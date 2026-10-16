"""
ScopeLock Scoping Agent Service.
Source of truth: PLAN.md Section 4, 4.3, 5.1, 5.2.
Implements the 5-step pipeline:
  Step A: Requirements extraction (with chunk-merging for long documents)
  Step B: Technical risks & scope-creep warnings
  Step C: Milestones & hour ranges
  Tool: verify_quotes (deterministic grounding)
  Tool: compute_pricing (deterministic money math)
  Step D: Client clarification email
Includes a 2-retry repair loop with explicit Sentry attempt tracking.
"""

import json
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar
from pydantic import BaseModel, ValidationError

from backend.schemas.proposal import (
    ScopeLockProposal,
    RequirementsResult,
    RiskResult,
    MilestonePlan,
    ClientEmail,
    GroundingReport,
    CommercialSummary,
)
from backend.core.parser import ParsedDocument, merge_requirements_results
from backend.core.ollama_client import OllamaClient
from backend.core.grounding import verify_quotes
from backend.core.pricing import compute_pricing
from backend.core.tracing import traced

T = TypeVar("T", bound=BaseModel)

SYSTEM_PROMPT_A = """You are ScopeLock Scoper, an expert technical estimator.
Extract atomic functional and non-functional requirements from the client brief.
RULES:
1. Every requirement MUST contain a source_quote copied EXACTLY character-for-character from the brief.
2. If you cannot find an exact verbatim quote in the brief, omit the item.
3. Dissect casual client requests into concrete engineering requirements (e.g. 'social login' -> OAuth flow, session handling, account linking).
4. Assign appropriate complexity_tags (e.g. AUTH, PAYMENTS, THIRD_PARTY_API, COMPLIANCE, REALTIME, MOBILE_RELEASE, AI_ML, NONE).
5. Extract between 3 and 5 key requirements total. Be concise.
6. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_B = """You are ScopeLock Scoper, an expert software architect.
Analyze the client brief and requirements for technical risks and scope-creep traps.
RULES:
1. Identify 2 to 3 key technical risks with category, severity (LOW, MEDIUM, HIGH, CRITICAL), mitigation, and a question to ask the client.
2. Identify 2 to 3 scope-creep warnings: vague phrases in the brief that could cause unpaid work. For each, quote the EXACT ambiguous phrase from the brief, explain why it is dangerous, and provide a protective Statement of Work (SOW) clause.
3. List 2 to 4 explicit assumptions and out-of-scope items. Be concise.
4. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_C = """You are ScopeLock Scoper, an expert engineering project manager.
Break down the requirements into an ordered milestone plan with integer hour estimates.
RULES:
1. Provide 3 to 4 sequential milestones.
2. Each milestone must specify objective, deliverables, linked requirement_ids, and an hour range (hours_min, hours_max).
3. Hours MUST be realistic integers (e.g. 10 to 25).
4. Do NOT compute prices, rates, totals, or percentages.
5. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_D = """You are ScopeLock Scoper.
Draft a professional, courteous 'questions before I quote' email for the freelancer to send to the client.
RULES:
1. Highlight the key technical ambiguities and scope clarification questions.
2. Keep the tone collaborative, professional, and confidence-inspiring. Keep it concise (under 150 words).
3. Output MUST strictly match the JSON schema with 'subject' and 'body'."""


class ScopingService:
    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.ollama = ollama_client or OllamaClient()

    async def _execute_step_with_retry(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage: str,
        max_retries: int = 2,
        num_predict: int = 768,
    ) -> Tuple[T, Dict[str, Any]]:
        """
        Executes an LLM stage with a JSON/schema repair retry loop (up to max_retries).
        Each attempt is tracked in Sentry with scopelock.attempt.
        """
        current_messages = list(messages)
        last_error = None
        aggregated_metrics = {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "load_ms": 0.0,
            "retries": 0,
        }

        for attempt in range(1, max_retries + 2):
            model_name = getattr(self.ollama, "default_model", "gemma4:e4b")
            span_attrs = {
                "gen_ai.operation.name": "chat",
                "gen_ai.provider.name": "ollama",
                "gen_ai.request.model": model_name,
                "gen_ai.agent.name": "ScopeLock Scoper",
                "gen_ai.request.temperature": 0.0,
                "gen_ai.request.seed": 42,
                "scopelock.stage": stage,
                "scopelock.attempt": attempt,
                "scopelock.num_ctx": getattr(self.ollama, "num_ctx", 16384),
            }

            with traced(op="gen_ai.chat", name=f"chat {model_name} [{stage}]", attributes=span_attrs) as span:
                try:
                    result, metrics = await self.ollama.chat_structured(
                        messages=current_messages,
                        response_model=response_model,
                        stage=stage,
                        attempt=attempt,
                        num_predict=num_predict,
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
                    if attempt > max_retries:
                        break
                    # Feedback only validation error message per PLAN.md Section 4
                    repair_prompt = (
                        f"Your previous response failed schema validation with error: {str(err)}\n"
                        f"Please correct the JSON output to strictly match the schema."
                    )
                    current_messages.append({"role": "user", "content": repair_prompt})

        raise RuntimeError(f"Stage '{stage}' failed after {max_retries} retries: {last_error}")

    async def analyze_document(
        self,
        doc: ParsedDocument,
        hourly_rate: float = 120.0,
        currency: str = "USD",
        contingency_percent: int = 20,
    ) -> ScopeLockProposal:
        """
        Runs the complete ScopeLock agent pipeline wrapped in Sentry invoke_agent span.
        """
        agent_attrs = {
            "gen_ai.operation.name": "invoke_agent",
            "gen_ai.agent.name": "ScopeLock Scoper",
            "gen_ai.pipeline.name": "scopelock-scoping",
            "scopelock.doc_chars": doc.char_count,
            "scopelock.chunks": len(doc.chunks),
        }

        with traced(op="gen_ai.invoke_agent", name="invoke_agent ScopeLock Scoper", attributes=agent_attrs) as agent_span:
            # Plain span for document parsing metadata
            with traced(op="doc.parse", name="doc.parse", attributes={"scopelock.doc_chars": doc.char_count}):
                pass

            # Step A: Requirements Extraction (chunk-aware)
            requirements_results: List[RequirementsResult] = []
            for chunk_idx, chunk_text in enumerate(doc.chunks, start=1):
                stage_label = f"requirements_chunk_{chunk_idx}" if doc.is_chunked else "requirements"
                msgs = [
                    {"role": "system", "content": SYSTEM_PROMPT_A},
                    {"role": "user", "content": f"Extract requirements from this project brief:\n\n{chunk_text}"},
                ]
                res, _ = await self._execute_step_with_retry(
                    messages=msgs,
                    response_model=RequirementsResult,
                    stage=stage_label,
                    num_predict=600,
                )
                requirements_results.append(res)

            # Merge requirements across chunks
            requirements_result = merge_requirements_results(requirements_results)

            # Step B: Risks & Scope Creep
            req_summary_lines = [
                f"- {r.id}: {r.summary} (Tags: {[t.value for t in r.complexity_tags]})"
                for r in requirements_result.requirements
            ]
            req_context = "\n".join(req_summary_lines)

            msgs_b = [
                {"role": "system", "content": SYSTEM_PROMPT_B},
                {
                    "role": "user",
                    "content": (
                        f"Brief excerpt:\n{doc.text[:3000]}\n\n"
                        f"Extracted Requirements:\n{req_context}\n\n"
                        f"Analyze the technical risks, scope creep hazards, assumptions, and out-of-scope items."
                    ),
                },
            ]
            risk_result, _ = await self._execute_step_with_retry(
                messages=msgs_b,
                response_model=RiskResult,
                stage="risks",
                num_predict=600,
            )

            # Step C: Milestones & Scoping
            risk_summary_lines = [f"- {risk.title} ({risk.severity}): {risk.mitigation}" for risk in risk_result.risks]
            risk_context = "\n".join(risk_summary_lines)

            msgs_c = [
                {"role": "system", "content": SYSTEM_PROMPT_C},
                {
                    "role": "user",
                    "content": (
                        f"Requirements:\n{req_context}\n\n"
                        f"Technical Risks:\n{risk_context}\n\n"
                        f"Create an ordered milestone plan with integer hour ranges for each milestone."
                    ),
                },
            ]
            milestone_plan, _ = await self._execute_step_with_retry(
                messages=msgs_c,
                response_model=MilestonePlan,
                stage="milestones",
                num_predict=450,
            )

            # Deterministic Tool 1: verify_quotes
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

            # Set grounded ratio on agent span
            if grounding_report.total_quotes > 0:
                ratio = round(grounding_report.grounded_quotes / grounding_report.total_quotes, 3)
                agent_span.set_attribute("scopelock.grounded_ratio", ratio)

            # Deterministic Tool 2: compute_pricing
            tool_attrs_cp = {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": "compute_pricing",
                "gen_ai.agent.name": "ScopeLock Scoper",
            }
            with traced(op="gen_ai.execute_tool", name="execute_tool compute_pricing", attributes=tool_attrs_cp):
                commercial_summary = compute_pricing(
                    milestones=milestone_plan.milestones,
                    requirements=requirements_result.requirements,
                    hourly_rate=hourly_rate,
                    currency=currency,
                    contingency_percent=contingency_percent,
                )

            # Step D: Client Clarification Email
            questions = [r.client_question for r in risk_result.risks if r.client_question]
            for w in risk_result.scope_creep_warnings:
                questions.append(f"Scope clarification regarding '{w.vague_quote}'")

            msgs_d = [
                {"role": "system", "content": SYSTEM_PROMPT_D},
                {
                    "role": "user",
                    "content": (
                        f"Project Title: {requirements_result.project_title}\n"
                        f"Open Questions and Risks to Clarify:\n"
                        + "\n".join(f"- {q}" for q in questions)
                        + "\n\nDraft a concise clarification email to the client."
                    ),
                },
            ]
            client_email, _ = await self._execute_step_with_retry(
                messages=msgs_d,
                response_model=ClientEmail,
                stage="client_email",
                num_predict=250,
            )

            return ScopeLockProposal(
                model=self.ollama.default_model,
                requirements=requirements_result,
                risks=risk_result,
                plan=milestone_plan,
                commercial=commercial_summary,
                client_email=client_email,
                grounding=grounding_report,
            )
