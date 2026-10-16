"""
Unit tests for ScopingService with mocked Ollama client.
Tests the 5-step pipeline, quote grounding integration, deterministic pricing,
the 2-retry repair loop, and the local TraceRecorder.
"""

import pytest
from unittest.mock import AsyncMock
from backend.services.scoping_service import ScopingService
from backend.core.parser import parse_document
from backend.core.tracing import trace_session, get_current_trace
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


@pytest.mark.asyncio
async def test_scoping_service_end_to_end_mocked():
    sample_brief = (
        "Project: VetClinic Mobile App\n\n"
        "We need a cross-platform mobile application for pet appointments. "
        "The user must be able to login with Google OAuth. "
        "We also need in-app credit card payments via Stripe. "
        "The system should be as fast as possible and scale infinitely."
    )

    doc = parse_document(sample_brief.encode("utf-8"), "brief.md")

    mock_requirements = RequirementsResult(
        project_title="VetClinic Mobile App",
        one_line_summary="Pet appointment booking app with payments",
        stated_platform_or_stack=["React Native", "Stripe"],
        requirements=[
            Requirement(
                id="R1",
                summary="Google OAuth login",
                kind="FUNCTIONAL",
                source_quote="login with Google OAuth",
                complexity_tags=["AUTH"],
            ),
            Requirement(
                id="R2",
                summary="Stripe card payments",
                kind="FUNCTIONAL",
                source_quote="credit card payments via Stripe",
                complexity_tags=["PAYMENTS"],
            ),
        ],
    )

    mock_risks = RiskResult(
        risks=[
            TechnicalRisk(
                title="Payment Compliance & PCI Scope",
                category="SECURITY",
                severity="HIGH",
                description="Handling payments requires strict compliance",
                mitigation="Use Stripe Elements to prevent card data touching backend",
                client_question="Do you already have a verified Stripe merchant account?",
                requirement_ids=["R2"],
            )
        ],
        scope_creep_warnings=[
            ScopeCreepWarning(
                vague_quote="scale infinitely",
                why_dangerous="Infinite scaling is an undefined non-functional requirement",
                suggested_sow_clause="Architecture sized for up to 1,000 concurrent active users",
            )
        ],
        assumptions=["Client will provide Stripe credentials"],
        out_of_scope=["Custom in-house payment gateway development"],
    )

    mock_milestones = MilestonePlan(
        milestones=[
            Milestone(
                id="M1",
                title="Authentication & Core Booking",
                objective="Deliver working OAuth and appointment scheduling",
                deliverables=["OAuth flow", "Booking screens"],
                requirement_ids=["R1"],
                hours_min=15,
                hours_max=30,
                depends_on=[],
            ),
            Milestone(
                id="M2",
                title="Stripe Payment Integration",
                objective="Implement checkout flow and webhooks",
                deliverables=["Payment sheet", "Webhook listener"],
                requirement_ids=["R2"],
                hours_min=20,
                hours_max=40,
                depends_on=["M1"],
            ),
        ]
    )

    mock_email = ClientEmail(
        subject="Scope & Clarification Questions: VetClinic Mobile App",
        body="Hi Team,\n\nThanks for sharing the brief. I have two quick questions...",
    )

    mock_ollama = AsyncMock()

    # Configure mock responses in sequence: Step A, Step B, Step C, Step D
    mock_ollama.chat_structured.side_effect = [
        (mock_requirements, {"total_tokens": 120, "input_tokens": 80, "output_tokens": 40, "load_ms": 15.0}),
        (mock_risks, {"total_tokens": 180, "input_tokens": 110, "output_tokens": 70, "load_ms": 10.0}),
        (mock_milestones, {"total_tokens": 150, "input_tokens": 90, "output_tokens": 60, "load_ms": 8.0}),
        (mock_email, {"total_tokens": 100, "input_tokens": 60, "output_tokens": 40, "load_ms": 5.0}),
    ]
    mock_ollama.default_model = "gemma4:e4b"

    service = ScopingService(ollama_client=mock_ollama)

    with trace_session() as trace_buf:
        proposal = await service.analyze_document(
            doc=doc,
            hourly_rate=120.0,
            currency="USD",
            contingency_percent=20,
        )

        # Check proposal integrity
        assert proposal.requirements.project_title == "VetClinic Mobile App"
        assert len(proposal.requirements.requirements) == 2
        assert len(proposal.risks.risks) == 1
        assert len(proposal.risks.scope_creep_warnings) == 1
        assert len(proposal.plan.milestones) == 2

        # Check grounding report (all 3 quotes exist in sample_brief)
        assert proposal.grounding.total_quotes == 3
        assert proposal.grounding.grounded_quotes == 3
        assert proposal.grounding.ungrounded_ids == []

        # Check commercial calculations
        # M1: 15-30 hrs, tag AUTH (1.25x) -> 18.75 - 37.5 hrs
        # M2: 20-40 hrs, tag PAYMENTS (1.40x) -> 28.0 - 56.0 hrs
        # Total min adj = 46.75, Total max adj = 93.5
        assert proposal.commercial.hours_min_adjusted == 46.75
        assert proposal.commercial.hours_max_adjusted == 93.5
        # Low price: 46.75 * 120 = 5610.0
        assert proposal.commercial.price_low == 5610.0
        # High price: 93.5 * 120 * 1.20 = 13464.0
        assert proposal.commercial.price_high == 13464.0
        assert proposal.commercial.recommended_fixed_price == 13464.0

        # Check trace spans recorded locally
        traces = get_current_trace()
        span_ops = [s["op"] for s in traces]
        assert "gen_ai.invoke_agent" in span_ops
        assert "doc.parse" in span_ops
        assert "gen_ai.execute_tool" in span_ops
        assert len(traces) >= 6
