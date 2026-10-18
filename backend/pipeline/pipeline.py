"""
Deep Scoping Pipeline Engine.
Source of truth: GLOSSARY.md 'Scoping Pipeline'.
Encapsulates document parsing, token estimation, LLM extraction stages,
verbatim quote grounding, and deterministic pricing behind a single deep interface.
"""

from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar
from pydantic import BaseModel, ValidationError

from backend.schemas.proposal import (
    ScopeLockProposal,
    RequirementsResult,
    RiskResult,
    MilestonePlan,
    ClientEmail,
)
from backend.core.parser import parse_document, merge_requirements_results, ParsedDocument
from backend.core.grounding import verify_quotes
from backend.core.pricing import compute_pricing
from backend.core.tracing import traced
from backend.pipeline.client import ModelClient, OllamaModelAdapter
from backend.pipeline.stages import (
    RequirementsStage,
    RiskStage,
    MilestoneStage,
    ClientEmailStage,
)

T = TypeVar("T", bound=BaseModel)


class BriefInput(BaseModel):
    """Encapsulates raw, unparsed brief input from files or text, or an existing ParsedDocument."""
    file_bytes: Optional[bytes] = None
    text: Optional[str] = None
    filename: str = "uploaded_brief.txt"
    parsed_doc: Optional[ParsedDocument] = None

    def get_effective_bytes(self) -> bytes:
        if self.parsed_doc is not None:
            return self.parsed_doc.text.encode("utf-8")
        if self.file_bytes and len(self.file_bytes) > 0:
            return self.file_bytes
        if self.text and len(self.text) > 0:
            return self.text.encode("utf-8")
        raise ValueError("BriefInput must provide non-empty file_bytes, text, or parsed_doc.")


class PipelineOptions(BaseModel):
    """Commercial and calculation options for proposal generation."""
    hourly_rate: float = 120.0
    currency: str = "USD"
    contingency_percent: int = 20
    max_retries: int = 2


class ScopingPipeline:
    """
    Deep Scoping Pipeline.
    A single unified entry point for turning client briefs into verified proposals.
    """

    def __init__(self, model_client: ModelClient):
        self.client = model_client
        self.req_stage = RequirementsStage()
        self.risk_stage = RiskStage()
        self.milestone_stage = MilestoneStage()
        self.email_stage = ClientEmailStage()

    @classmethod
    def create(cls, model: Optional[str] = None, ollama_client: Optional[Any] = None) -> "ScopingPipeline":
        """Factory method using production OllamaModelAdapter."""
        adapter = OllamaModelAdapter(ollama_client=ollama_client, default_model=model)
        return cls(model_client=adapter)

    async def _execute_stage_with_retry(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage_name: str,
        max_retries: int = 2,
        num_predict: int = 1500,
    ) -> Tuple[T, Dict[str, Any]]:
        """Executes a structured stage with a self-correcting repair retry loop."""
        current_messages = list(messages)
        last_error = None
        current_num_predict = num_predict
        aggregated_metrics = {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "load_ms": 0.0,
            "retries": 0,
        }

        for attempt in range(1, max_retries + 2):
            model_name = self.client.model_name
            span_attrs = {
                "gen_ai.operation.name": "chat",
                "gen_ai.provider.name": "ollama",
                "gen_ai.request.model": model_name,
                "gen_ai.agent.name": "ScopeLock Scoper",
                "gen_ai.request.temperature": 0.0,
                "gen_ai.request.seed": 42,
                "scopelock.stage": stage_name,
                "scopelock.attempt": attempt,
                "scopelock.num_ctx": self.client.context_window,
            }

            with traced(op="gen_ai.chat", name=f"chat {model_name} [{stage_name}]", attributes=span_attrs) as span:
                try:
                    result, metrics = await self.client.chat_structured(
                        messages=current_messages,
                        response_model=response_model,
                        stage=stage_name,
                        attempt=attempt,
                        num_predict=current_num_predict,
                    )
                    aggregated_metrics["input_tokens"] += metrics.get("input_tokens", 0)
                    aggregated_metrics["output_tokens"] += metrics.get("output_tokens", 0)
                    aggregated_metrics["total_tokens"] += metrics.get("total_tokens", 0)
                    aggregated_metrics["load_ms"] = max(aggregated_metrics["load_ms"], metrics.get("load_ms", 0.0))

                    span.set_attribute("gen_ai.response.model", model_name)
                    span.set_attribute("gen_ai.usage.input_tokens", metrics.get("input_tokens", 0))
                    span.set_attribute("gen_ai.usage.output_tokens", metrics.get("output_tokens", 0))
                    span.set_attribute("gen_ai.usage.total_tokens", metrics.get("total_tokens", 0))
                    span.set_attribute("scopelock.load_ms", metrics.get("load_ms", 0.0))
                    return result, aggregated_metrics
                except (ValueError, ValidationError) as err:
                    span.set_status("error", error_type="schema_validation")
                    last_error = err
                    aggregated_metrics["retries"] += 1
                    current_num_predict = min(4096, int(current_num_predict * 1.5))
                    if attempt > max_retries:
                        break
                    repair_prompt = (
                        f"Your previous response failed schema validation with error: {str(err)}\n"
                        f"Please provide the complete, un-truncated JSON output strictly matching all required schema fields."
                    )
                    current_messages.append({"role": "user", "content": repair_prompt})

        raise RuntimeError(f"Stage '{stage_name}' failed after {max_retries} retries: {last_error}")

    async def scope(
        self,
        input: BriefInput,
        options: Optional[PipelineOptions] = None,
    ) -> ScopeLockProposal:
        """
        Executes the entire scoping sequence.
        Turns raw brief input into a verified, grounded, and priced proposal.
        """
        opts = options or PipelineOptions()
        file_bytes = input.get_effective_bytes()

        # Step 0: Document parsing and chunking (encapsulated)
        if input.parsed_doc is not None:
            doc = input.parsed_doc
        else:
            file_bytes = input.get_effective_bytes()
            doc = parse_document(
                file_bytes=file_bytes,
                filename=input.filename,
                num_ctx=self.client.context_window,
            )

        agent_attrs = {
            "gen_ai.operation.name": "invoke_agent",
            "gen_ai.agent.name": "ScopeLock Scoper",
            "gen_ai.pipeline.name": "scopelock-scoping",
            "scopelock.doc_chars": doc.char_count,
            "scopelock.chunks": len(doc.chunks),
        }

        with traced(op="gen_ai.invoke_agent", name="invoke_agent ScopeLock Scoper", attributes=agent_attrs) as agent_span:
            with traced(op="doc.parse", name="doc.parse", attributes={"scopelock.doc_chars": doc.char_count}):
                pass

            # Step 1: Requirements Extraction Stage (chunk-aware)
            requirements_results: List[RequirementsResult] = []
            for chunk_idx, chunk_text in enumerate(doc.chunks, start=1):
                stage_label = f"requirements_chunk_{chunk_idx}" if doc.is_chunked else "requirements"
                msgs = self.req_stage.build_messages(chunk_text=chunk_text)
                res, _ = await self._execute_stage_with_retry(
                    messages=msgs,
                    response_model=RequirementsResult,
                    stage_name=stage_label,
                    max_retries=opts.max_retries,
                    num_predict=self.req_stage.default_num_predict,
                )
                requirements_results.append(res)

            requirements_result = merge_requirements_results(requirements_results)

            # Step 2: Technical Risks & Scope Creep Stage
            msgs_b = self.risk_stage.build_messages(
                brief_excerpt=doc.text[:3000],
                requirements=requirements_result,
            )
            risk_result, _ = await self._execute_stage_with_retry(
                messages=msgs_b,
                response_model=RiskResult,
                stage_name="risks",
                max_retries=opts.max_retries,
                num_predict=self.risk_stage.default_num_predict,
            )

            # Step 3: Milestone Estimation Stage
            msgs_c = self.milestone_stage.build_messages(
                requirements=requirements_result,
                risks=risk_result,
            )
            milestone_plan, _ = await self._execute_stage_with_retry(
                messages=msgs_c,
                response_model=MilestonePlan,
                stage_name="milestones",
                max_retries=opts.max_retries,
                num_predict=self.milestone_stage.default_num_predict,
            )

            # Deterministic Gate 1: Verbatim Quote Grounding
            tool_attrs_vq = {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": "verify_quotes",
                "gen_ai.agent.name": "ScopeLock Scoper",
            }
            with traced(op="gen_ai.execute_tool", name="execute_tool verify_quotes", attributes=tool_attrs_vq):
                grounding_report = verify_quotes(
                    brief_text=doc.text,
                    requirements=requirements_result.requirements,
                    scope_creep_warnings=risk_result.scope_creep_warnings,
                )

            if grounding_report.total_quotes > 0:
                ratio = round(grounding_report.grounded_quotes / grounding_report.total_quotes, 3)
                agent_span.set_attribute("scopelock.grounded_ratio", ratio)

            # Deterministic Gate 2: Deterministic Commercial Pricing
            tool_attrs_cp = {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": "compute_pricing",
                "gen_ai.agent.name": "ScopeLock Scoper",
            }
            with traced(op="gen_ai.execute_tool", name="execute_tool compute_pricing", attributes=tool_attrs_cp):
                commercial_summary = compute_pricing(
                    milestones=milestone_plan.milestones,
                    requirements=requirements_result.requirements,
                    hourly_rate=opts.hourly_rate,
                    currency=opts.currency,
                    contingency_percent=opts.contingency_percent,
                )

            # Step 4: Client Clarification Email Stage
            msgs_d = self.email_stage.build_messages(
                project_title=requirements_result.project_title,
                risks=risk_result,
            )
            client_email, _ = await self._execute_stage_with_retry(
                messages=msgs_d,
                response_model=ClientEmail,
                stage_name="client_email",
                max_retries=opts.max_retries,
                num_predict=self.email_stage.default_num_predict,
            )

            return ScopeLockProposal(
                model=self.client.model_name,
                requirements=requirements_result,
                risks=risk_result,
                plan=milestone_plan,
                commercial=commercial_summary,
                client_email=client_email,
                grounding=grounding_report,
            )
