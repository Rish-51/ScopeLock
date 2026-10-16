"""
Async Ollama Client with Schema-Constrained Decoding and Sentry GenAI Tracing.
Source of truth: PLAN.md Section 3.3, 4, 5.1, 5.2.
"""

import copy
import json
from typing import Any, Dict, List, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel

from backend.core.config import settings
from backend.core.tracing import traced

T = TypeVar("T", bound=BaseModel)


def inline_schema_defs(schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively inlines $defs / $ref in a JSON Schema dictionary.
    Ensures Ollama's grammar engine never fails on nested schema definitions.
    """
    schema_copy = copy.deepcopy(schema)
    defs = schema_copy.pop("$defs", {})

    def resolve_refs(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                ref_path = node["$ref"]
                # e.g. #/$defs/ComplexityTag
                ref_key = ref_path.split("/")[-1]
                if ref_key in defs:
                    resolved = copy.deepcopy(defs[ref_key])
                    # Recurse into resolved definition in case it contains further refs
                    return resolve_refs(resolved)
            return {k: resolve_refs(v) for k, v in node.items()}
        elif isinstance(node, list):
            return [resolve_refs(item) for item in node]
        return node

    return resolve_refs(schema_copy)


from typing import Tuple
Tuple_Response = Tuple[Any, Dict[str, Any]]


def extract_and_repair_json(raw: str) -> Dict[str, Any]:
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Fast path: try standard loads
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find outermost { }
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace : last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # If truncated or unclosed, balance quotes, braces, brackets
    if first_brace != -1:
        text = text[first_brace:]

    stack = []
    in_str = False
    esc = False
    chars = []
    for c in text:
        if esc:
            chars.append(c)
            esc = False
            continue
        if c == "\\":
            esc = True
            chars.append(c)
            continue
        if c == '"':
            in_str = not in_str
            chars.append(c)
            continue
        if not in_str:
            if c in ("{", "["):
                stack.append(c)
            elif c == "}" and stack and stack[-1] == "{":
                stack.pop()
            elif c == "]" and stack and stack[-1] == "[":
                stack.pop()
        chars.append(c)

    repaired = "".join(chars)
    if in_str:
        repaired += '"'
    repaired = repaired.rstrip()
    while repaired and repaired[-1] in (",", ":"):
        repaired = repaired[:-1].rstrip()
    while stack:
        top = stack.pop()
        repaired += "}" if top == "{" else "]"

    try:
        return json.loads(repaired)
    except Exception as err:
        raise ValueError(f"Model output is not valid JSON: {raw[:150]}...") from err


class OllamaClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        num_ctx: Optional[int] = None,
        timeout: float = 600.0,
    ):
        self.base_url = (base_url or settings.ollama_host).rstrip("/")
        self.default_model = default_model or settings.scopelock_model
        self.num_ctx = num_ctx or settings.scopelock_num_ctx
        self.timeout = timeout

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama server is reachable and list models."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {"reachable": True, "models": models}
                return {"reachable": False, "error": f"HTTP {resp.status_code}"}
            except Exception as e:
                return {"reachable": False, "error": str(e)}

    async def chat_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage: str = "chat",
        attempt: int = 1,
        model: Optional[str] = None,
        trace_span: bool = False,
        num_predict: int = 1200,
    ) -> Tuple_Response:
        """
        Calls Ollama /api/chat with format=<JSON Schema>, parsing to response_model.
        """
        chosen_model = model or self.default_model
        schema = inline_schema_defs(response_model.model_json_schema())

        payload = {
            "model": chosen_model,
            "messages": messages,
            "stream": False,
            "format": schema,
            "options": {
                "temperature": 0.0,
                "seed": 42,
                "num_ctx": self.num_ctx,
                "num_predict": num_predict,
            },
        }

        async def _call_api():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                except httpx.ConnectError as exc:
                    raise RuntimeError(f"Ollama is unreachable at {self.base_url}: {exc}") from exc
                except httpx.TimeoutException as exc:
                    raise TimeoutError(f"Ollama request timed out after {self.timeout}s during model inference: {exc}") from exc

                if resp.status_code != 200:
                    raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {resp.text}")

                data = resp.json()

                prompt_eval_count = int(data.get("prompt_eval_count", 0))
                eval_count = int(data.get("eval_count", 0))
                total_tokens = prompt_eval_count + eval_count
                load_duration_ns = data.get("load_duration", 0)
                load_ms = round(load_duration_ns / 1e6, 2)

                raw_content = data.get("message", {}).get("content", "").strip()

                parsed_json = extract_and_repair_json(raw_content)

                try:
                    parsed_obj = response_model.model_validate(parsed_json)
                except Exception as err:
                    raise err

                return parsed_obj, {
                    "input_tokens": prompt_eval_count,
                    "output_tokens": eval_count,
                    "total_tokens": total_tokens,
                    "load_ms": load_ms,
                }

        if trace_span:
            span_attrs = {
                "gen_ai.operation.name": "chat",
                "gen_ai.provider.name": "ollama",
                "gen_ai.request.model": chosen_model,
                "gen_ai.agent.name": "ScopeLock Scoper",
                "gen_ai.request.temperature": 0.0,
                "gen_ai.request.seed": 42,
                "scopelock.stage": stage,
                "scopelock.attempt": attempt,
                "scopelock.num_ctx": self.num_ctx,
            }
            with traced(op="gen_ai.chat", name=f"chat {chosen_model} [{stage}]", attributes=span_attrs) as span:
                try:
                    res, metrics = await _call_api()
                    span.set_attribute("gen_ai.response.model", chosen_model)
                    span.set_attribute("gen_ai.usage.input_tokens", metrics["input_tokens"])
                    span.set_attribute("gen_ai.usage.output_tokens", metrics["output_tokens"])
                    span.set_attribute("gen_ai.usage.total_tokens", metrics["total_tokens"])
                    span.set_attribute("scopelock.load_ms", metrics["load_ms"])
                    return res, metrics
                except Exception as exc:
                    span.set_status("error", error_type=type(exc).__name__)
                    raise
        else:
            return await _call_api()


# Type alias for return
from typing import Tuple
Tuple_Response = Tuple[Any, Dict[str, Any]]
