"""
Observability and Trace Recording Engine.
Source of truth: PLAN.md Section 5.
- Sentry Agent Tracing using official OpenTelemetry-aligned GenAI attributes.
- Scrub hooks to guarantee zero brief/client content egress.
- In-memory TraceRecorder (contextvar-based) for the frontend Trace Inspector.
- No direct browser-to-Sentry API calls.
"""

import time
import uuid
import hashlib
from contextvars import ContextVar
from contextlib import contextmanager
from typing import Any, Dict, List, Optional
import sentry_sdk
from backend.core.config import settings

# In-memory trace collection context variable
_active_traces: ContextVar[Optional[List[Dict[str, Any]]]] = ContextVar("active_traces", default=None)
_active_span_stack: ContextVar[List[str]] = ContextVar("active_span_stack", default=[])

WHITELISTED_TRACE_ATTRS = {
    "gen_ai.operation.name",
    "gen_ai.agent.name",
    "gen_ai.pipeline.name",
    "gen_ai.provider.name",
    "gen_ai.request.model",
    "gen_ai.response.model",
    "gen_ai.request.temperature",
    "gen_ai.request.seed",
    "gen_ai.usage.input_tokens",
    "gen_ai.usage.output_tokens",
    "gen_ai.usage.total_tokens",
    "gen_ai.tool.name",
    "error.type",
    "scopelock.stage",
    "scopelock.attempt",
    "scopelock.load_ms",
    "scopelock.num_ctx",
    "scopelock.chunks",
    "scopelock.grounded_ratio",
    "scopelock.doc_chars",
}


def scrub_event(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Defensive scrubbing hook: ensure no brief/content appears in Sentry events."""
    # Drop any prompt / response keys defensively
    if "extra" in event:
        event["extra"] = {
            k: v for k, v in event["extra"].items()
            if not k.startswith("gen_ai.input") and not k.startswith("gen_ai.output")
            and "brief" not in k.lower() and "prompt" not in k.lower()
        }
    return event


def scrub_transaction(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Defensive scrubbing hook for transactions and span data."""
    # Check spans within the transaction
    spans = event.get("spans", [])
    for span in spans:
        data = span.get("data", {})
        # Remove any input/output messages if present
        keys_to_remove = [k for k in data if k.startswith("gen_ai.input") or k.startswith("gen_ai.output")]
        for k in keys_to_remove:
            del data[k]
    return event


def init_sentry(dsn: Optional[str] = None):
    """
    Initialize Sentry with strict metadata-only privacy settings.
    If dsn is empty/None or telemetry_enabled is False, Sentry is a no-op.
    """
    if not dsn or not settings.telemetry_enabled:
        return

    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=1.0,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
        before_send_transaction=scrub_transaction,
        before_send=scrub_event,
    )


@contextmanager
def trace_session():
    """Context manager to initialize an isolated local trace buffer for a request."""
    trace_buffer: List[Dict[str, Any]] = []
    token = _active_traces.set(trace_buffer)
    stack_token = _active_span_stack.set([])
    try:
        yield trace_buffer
    finally:
        _active_traces.reset(token)
        _active_span_stack.reset(stack_token)


def get_current_trace() -> List[Dict[str, Any]]:
    """Retrieve recorded trace spans for the current request."""
    buf = _active_traces.get()
    return list(buf) if buf is not None else []


class SpanContext:
    def __init__(self, span_id: str, span_dict: Dict[str, Any], sentry_span: Any):
        self.span_id = span_id
        self.span_dict = span_dict
        self.sentry_span = sentry_span

    def set_attribute(self, key: str, value: Any):
        if key in WHITELISTED_TRACE_ATTRS:
            self.span_dict["attributes"][key] = value
        if self.sentry_span:
            try:
                self.sentry_span.set_data(key, value)
            except Exception:
                pass

    def set_status(self, status: str, error_type: Optional[str] = None):
        self.span_dict["status"] = status
        if error_type:
            self.set_attribute("error.type", error_type)
        if self.sentry_span:
            try:
                self.sentry_span.set_status(status)
            except Exception:
                pass


@contextmanager
def traced(op: str, name: str, attributes: Optional[Dict[str, Any]] = None):
    """
    Context manager that wraps sentry_sdk.start_span AND appends
    scrubbed metadata to the local in-memory trace recorder.
    """
    attrs = dict(attributes or {})
    span_id = f"span_{uuid.uuid4().hex[:8]}"

    # Parent span tracking
    current_stack = _active_span_stack.get()
    parent_id = current_stack[-1] if current_stack else None
    _active_span_stack.set(current_stack + [span_id])

    start_time = time.time()
    start_ms = round(start_time * 1000, 2)

    span_record: Dict[str, Any] = {
        "id": span_id,
        "parent_id": parent_id,
        "name": name,
        "op": op,
        "start_ms": start_ms,
        "duration_ms": 0.0,
        "status": "ok",
        "attributes": {k: v for k, v in attrs.items() if k in WHITELISTED_TRACE_ATTRS},
    }

    # Record to local buffer if inside an active trace session
    buffer = _active_traces.get()
    if buffer is not None:
        buffer.append(span_record)

    # Start Sentry span
    sentry_span = None
    try:
        if not settings.telemetry_enabled:
            sentry_span = None
        else:
            current_scope = sentry_sdk.get_current_scope()
            # In Sentry, child spans must be attached to an active transaction.
            # If no transaction is active (e.g. standalone/CLI/test), start one for invoke_agent.
            if op == "gen_ai.invoke_agent" and not getattr(current_scope, "transaction", None):
                sentry_span = sentry_sdk.start_transaction(name=name, op=op)
            else:
                sentry_span = sentry_sdk.start_span(op=op, name=name)

        sentry_span.__enter__() if sentry_span else None
        if sentry_span:
            for k, v in attrs.items():
                if k in WHITELISTED_TRACE_ATTRS:
                    sentry_span.set_data(k, v)
    except Exception:
        sentry_span = None

    ctx = SpanContext(span_id, span_record, sentry_span)

    try:
        yield ctx
    except Exception as exc:
        ctx.set_status("error", error_type=type(exc).__name__)
        raise
    finally:
        end_time = time.time()
        span_record["duration_ms"] = round((end_time - start_time) * 1000, 2)

        # Restore span stack
        stack = _active_span_stack.get()
        if stack and stack[-1] == span_id:
            _active_span_stack.set(stack[:-1])

        if sentry_span:
            try:
                sentry_span.__exit__(None, None, None)
            except Exception:
                pass
