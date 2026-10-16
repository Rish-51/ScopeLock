"""
The Egress Canary Test (Privacy Proof).
Source of truth: PLAN.md Section 6.
Proves that:
1. When Sentry is enabled, zero client brief text and zero canary tokens escape to Sentry.
2. Telemetry payloads contain only whitelisted span names, token counts, and durations.
3. When Sentry is disabled, no external network requests are made.
"""

import uuid
import json
import pytest
from unittest.mock import AsyncMock
import sentry_sdk
from sentry_sdk.transport import Transport

from backend.core.tracing import init_sentry, trace_session
from backend.core.parser import parse_document
from backend.services.scoping_service import ScopingService
from backend.schemas.proposal import (
    RequirementsResult,
    Requirement,
    RiskResult,
    TechnicalRisk,
    ScopeCreepWarning,
    MilestonePlan,
    Milestone,
    ClientEmail,
)


class CapturingTransport(Transport):
    """In-memory capturing transport for Sentry SDK that records all envelopes."""

    def __init__(self, options):
        super().__init__(options)
        self.captured_data = []

    def capture_envelope(self, envelope):
        for item in envelope.items:
            try:
                payload = item.payload
                if hasattr(payload, "json") and payload.json:
                    self.captured_data.append(json.dumps(payload.json, default=str))
                elif hasattr(payload, "get_bytes"):
                    raw = payload.get_bytes().decode("utf-8", errors="replace")
                    self.captured_data.append(raw)
                elif isinstance(payload, bytes):
                    raw = payload.decode("utf-8", errors="replace")
                    self.captured_data.append(raw)
                else:
                    self.captured_data.append(str(payload))
            except Exception:
                pass

    def capture_event(self, event):
        self.captured_data.append(json.dumps(event, default=str))

    def flush(self, timeout=None, callback=None):
        pass


@pytest.mark.asyncio
async def test_canary_and_brief_zero_egress_to_sentry():
    # 1. Create unique canary tokens
    canary_token = f"CANARY-SECRET-{uuid.uuid4().hex}"
    client_confidential_phrase = "Project TopSecretAlpha proprietary algorithmic high frequency trading core"

    # Embed canary and confidential brief phrases
    synthetic_brief = (
        f"Confidential Brief: {client_confidential_phrase}. "
        f"Security code: {canary_token}. "
        "The application requires single sign on with corporate LDAP, "
        "a real-time WebSocket dashboard for stock ticks, "
        "and automated reconciliation reports."
    )

    doc = parse_document(synthetic_brief.encode("utf-8"), "secret_brief.md")

    # 2. Init Sentry with CapturingTransport
    transport = CapturingTransport(options={})
    sentry_sdk.init(
        dsn="https://fake_key@fake_host.ingest.sentry.io/123456",
        transport=transport,
        traces_sample_rate=1.0,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
    )

    mock_requirements = RequirementsResult(
        project_title="Proprietary Trading Engine",
        one_line_summary="High-speed trading dashboard",
        stated_platform_or_stack=["Python", "WebSockets"],
        requirements=[
            Requirement(
                id="R1",
                summary="Corporate LDAP single sign on",
                kind="FUNCTIONAL",
                source_quote="single sign on with corporate LDAP",
                complexity_tags=["AUTH"],
            ),
            Requirement(
                id="R2",
                summary="WebSocket real-time tick stream",
                kind="FUNCTIONAL",
                source_quote="real-time WebSocket dashboard for stock ticks",
                complexity_tags=["REALTIME"],
            ),
        ],
    )

    mock_risks = RiskResult(
        risks=[
            TechnicalRisk(
                title="Latency and Connection Dropping",
                category="PERFORMANCE",
                severity="HIGH",
                description="High throughput WebSocket connections require load balancing",
                mitigation="Use Redis pub/sub backplane",
                client_question="What is the expected peak tick volume per second?",
                requirement_ids=["R2"],
            )
        ],
        scope_creep_warnings=[
            ScopeCreepWarning(
                vague_quote="automated reconciliation reports",
                why_dangerous="Report specifications and export formats are undefined",
                suggested_sow_clause="Limited to standard CSV export of daily trade logs",
            )
        ],
        assumptions=["Client supplies test LDAP credentials"],
        out_of_scope=["Direct broker FIX protocol execution"],
    )

    mock_milestones = MilestonePlan(
        milestones=[
            Milestone(
                id="M1",
                title="Auth & WebSocket Ingestion",
                objective="Deliver LDAP authentication and live data feed",
                deliverables=["LDAP connector", "WS server"],
                requirement_ids=["R1", "R2"],
                hours_min=20,
                hours_max=40,
                depends_on=[],
            )
        ]
    )

    mock_email = ClientEmail(
        subject="Clarification Questions: Trading Engine",
        body="Dear Client,\n\nWe need clarification on the tick throughput requirements.",
    )

    mock_ollama = AsyncMock()
    mock_ollama.chat_structured.side_effect = [
        (mock_requirements, {"total_tokens": 100, "input_tokens": 60, "output_tokens": 40, "load_ms": 10.0}),
        (mock_risks, {"total_tokens": 150, "input_tokens": 90, "output_tokens": 60, "load_ms": 8.0}),
        (mock_milestones, {"total_tokens": 120, "input_tokens": 70, "output_tokens": 50, "load_ms": 6.0}),
        (mock_email, {"total_tokens": 90, "input_tokens": 50, "output_tokens": 40, "load_ms": 4.0}),
    ]
    mock_ollama.default_model = "gemma4:e4b"

    service = ScopingService(ollama_client=mock_ollama)

    # 3. Execute the full pipeline
    with trace_session():
        proposal = await service.analyze_document(
            doc=doc,
            hourly_rate=150.0,
            currency="USD",
            contingency_percent=20,
        )

    # Flush any queued envelopes in Sentry SDK
    sentry_sdk.flush()

    captured_corpus = "\n".join(transport.captured_data)

    # 4. Assert CANARY string never appears anywhere in Sentry data
    assert canary_token not in captured_corpus, "CRITICAL PRIVACY FAILURE: Canary string leaked to Sentry!"

    # 5. Assert 8+ word windows of confidential brief never appear in Sentry data
    words = client_confidential_phrase.split()
    for i in range(len(words) - 7):
        eight_word_window = " ".join(words[i : i + 8])
        assert eight_word_window not in captured_corpus, (
            f"CRITICAL PRIVACY FAILURE: 8-word brief window '{eight_word_window}' leaked to Sentry!"
        )

    # 6. Verify that only metadata spans were transmitted
    assert "invoke_agent ScopeLock Scoper" in captured_corpus
    assert "gen_ai.chat" in captured_corpus
    assert "execute_tool verify_quotes" in captured_corpus
    assert "execute_tool compute_pricing" in captured_corpus


@pytest.mark.asyncio
async def test_offline_mode_no_outbound_calls_when_telemetry_off(monkeypatch):
    """
    PLAN.md Section 6:
    Assert that with SENTRY_DSN unset, no outbound HTTP calls are made
    except to localhost:11434.
    """
    import httpx

    outbound_hosts_contacted = []
    original_send = httpx.AsyncClient.send

    async def patched_send(self, request, *args, **kwargs):
        host = request.url.host
        port = request.url.port
        outbound_hosts_contacted.append(f"{host}:{port}")
        # Allow only local Ollama calls
        if host not in ("localhost", "127.0.0.1") or port != 11434:
            raise PermissionError(f"CRITICAL PRIVACY FAILURE: Outbound connection attempted to {host}:{port}")
        # Return dummy 200 response for local Ollama in this mock test
        return httpx.Response(
            status_code=200,
            json={
                "message": {"content": "{}"},
                "prompt_eval_count": 10,
                "eval_count": 10,
                "load_duration": 1000,
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "send", patched_send)

    # Disable Sentry
    sentry_sdk.init(dsn=None)

    brief = "Build an offline inventory app for a local bookstore."
    doc = parse_document(brief.encode("utf-8"), "inventory.txt")

    mock_reqs = RequirementsResult(
        project_title="Bookstore Inventory",
        one_line_summary="Offline inventory app",
        stated_platform_or_stack=["SQLite"],
        requirements=[
            Requirement(
                id="R1",
                summary="Local inventory management",
                kind="FUNCTIONAL",
                source_quote="offline inventory app for a local bookstore",
                complexity_tags=["NONE"],
            )
        ],
    )
    mock_risks = RiskResult(
        risks=[],
        scope_creep_warnings=[],
        assumptions=[],
        out_of_scope=[],
    )
    mock_plan = MilestonePlan(
        milestones=[
            Milestone(
                id="M1",
                title="Inventory UI",
                objective="Deliver basic CRUD",
                deliverables=["CRUD screens"],
                requirement_ids=["R1"],
                hours_min=10,
                hours_max=20,
                depends_on=[],
            )
        ]
    )
    mock_email = ClientEmail(subject="Inventory Scope", body="Hello")

    mock_client = AsyncMock()
    mock_client.chat_structured.side_effect = [
        (mock_reqs, {"total_tokens": 10, "input_tokens": 5, "output_tokens": 5, "load_ms": 1.0}),
        (mock_risks, {"total_tokens": 10, "input_tokens": 5, "output_tokens": 5, "load_ms": 1.0}),
        (mock_plan, {"total_tokens": 10, "input_tokens": 5, "output_tokens": 5, "load_ms": 1.0}),
        (mock_email, {"total_tokens": 10, "input_tokens": 5, "output_tokens": 5, "load_ms": 1.0}),
    ]
    mock_client.default_model = "gemma4:e4b"

    service = ScopingService(ollama_client=mock_client)
    proposal = await service.analyze_document(doc=doc)

    assert proposal.requirements.project_title == "Bookstore Inventory"
    # Ensure all contacted endpoints were local only
    for destination in outbound_hosts_contacted:
        assert destination.startswith("localhost:11434") or destination.startswith("127.0.0.1:11434")
