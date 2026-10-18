"""
Unit tests for the deep ScopingPipeline module.
Uses FakeModelAdapter to test all pipeline stages, deterministic gates,
and token metrics in milliseconds without network or Ollama runtime.
"""

import pytest
from backend.pipeline import (
    ScopingPipeline,
    BriefInput,
    PipelineOptions,
    FakeModelAdapter,
)
from backend.schemas.proposal import (
    RequirementsResult,
    Requirement,
    ComplexityTag,
    RiskResult,
    TechnicalRisk,
    Severity,
    RiskCategory,
    ScopeCreepWarning,
    MilestonePlan,
    Milestone,
    ClientEmail,
)


@pytest.fixture
def fake_brief_text() -> str:
    return (
        "# Mobile Marketplace App\n\n"
        "We need a cross-platform mobile marketplace for pet adoption.\n"
        "Users must sign in with OAuth 2.0 (Google and Apple).\n"
        "All transactions require Stripe payment processing.\n"
        "The app must be completely bug-free and scale infinitely without slowdown.\n"
    )


@pytest.fixture
def fake_model_adapter(fake_brief_text: str) -> FakeModelAdapter:
    adapter = FakeModelAdapter(model_name="gemma4:test-fake")

    # 1. Canned Requirements
    reqs = RequirementsResult(
        project_title="Pet Adoption Marketplace",
        one_line_summary="Pet adoption mobile marketplace MVP",
        stated_platform_or_stack=["React Native", "FastAPI"],
        requirements=[
            Requirement(
                id="R1",
                summary="User authentication via OAuth 2.0",
                source_quote="Users must sign in with OAuth 2.0 (Google and Apple).",
                complexity_tags=[ComplexityTag.AUTH],
            ),
            Requirement(
                id="R2",
                summary="In-app payments via Stripe",
                source_quote="All transactions require Stripe payment processing.",
                complexity_tags=[ComplexityTag.PAYMENTS],
            ),
        ],
    )
    adapter.register_response("requirements", reqs)

    # 2. Canned Risks
    risks = RiskResult(
        risks=[
            TechnicalRisk(
                category=RiskCategory.INTEGRATION,
                title="OAuth Token Expiration",
                severity=Severity.MEDIUM,
                description="OAuth tokens expire quickly",
                mitigation="Implement automated refresh token rotation.",
                client_question="Will social login require enterprise SSO?",
            )
        ],
        scope_creep_warnings=[
            ScopeCreepWarning(
                vague_quote="The app must be completely bug-free and scale infinitely without slowdown.",
                risk_explanation="Infinite scale and zero bugs are impossible contractual liabilities.",
                protective_clause="Testing covers standard QA passes up to 1,000 concurrent active users.",
            )
        ],
        assumptions=["Client supplies Stripe API credentials."],
        out_of_scope=["Web administrative portal."],
    )
    adapter.register_response("risks", risks)

    # 3. Canned Milestones
    plan = MilestonePlan(
        milestones=[
            Milestone(
                id="M1",
                title="Auth & Foundation",
                objective="Deliver working authentication flow",
                deliverables=["Apple/Google OAuth", "JWT Sessions"],
                requirement_ids=["R1"],
                hours_min=20,
                hours_max=30,
                depends_on=[],
            ),
            Milestone(
                id="M2",
                title="Payment Integration",
                objective="Integrate Stripe checkout",
                deliverables=["Stripe webhooks", "Order receipting"],
                requirement_ids=["R2"],
                hours_min=25,
                hours_max=40,
                depends_on=["M1"],
            ),
        ]
    )
    adapter.register_response("milestones", plan)

    # 4. Canned Client Email
    email = ClientEmail(
        subject="Clarification Questions: Pet Adoption Marketplace",
        body="Hi Team, thanks for sharing the brief. Could you confirm your target concurrent user load?",
    )
    adapter.register_response("client_email", email)

    return adapter


@pytest.mark.asyncio
async def test_scoping_pipeline_end_to_end_with_fake_adapter(fake_brief_text: str, fake_model_adapter: FakeModelAdapter):
    """
    Verifies that ScopingPipeline coordinates all stages and deterministic gates.
    """
    pipeline = ScopingPipeline(model_client=fake_model_adapter)

    brief_input = BriefInput(text=fake_brief_text, filename="rfq_pets.md")
    options = PipelineOptions(
        hourly_rate=150.0,
        currency="USD",
        contingency_percent=20,
    )

    proposal = await pipeline.scope(input=brief_input, options=options)

    # 1. Output Model verification
    assert proposal.model == "gemma4:test-fake"
    assert proposal.requirements.project_title == "Pet Adoption Marketplace"
    assert len(proposal.requirements.requirements) == 2

    # 2. Deterministic Quote Grounding Gate verification
    assert proposal.grounding.total_quotes == 3  # 2 reqs + 1 scope-creep quote
    assert proposal.grounding.grounded_quotes == 3
    assert len(proposal.grounding.ungrounded_ids) == 0

    # 3. Deterministic Pricing Gate verification
    # M1 has R1 (AUTH: 1.25x) -> hours: 20*1.25=25 to 30*1.25=37.5
    # M2 has R2 (PAYMENTS: 1.40x) -> hours: 25*1.4=35 to 40*1.4=56.0
    # Total adjusted max hours = 37.5 + 56.0 = 93.5
    # Recommended fixed price = 93.5 * 150.0 * 1.20 (contingency) = 16,830.0
    assert proposal.commercial.hourly_rate == 150.0
    assert proposal.commercial.currency == "USD"
    assert proposal.commercial.contingency_percent == 20
    assert proposal.commercial.hours_max_adjusted == 93.5
    assert proposal.commercial.recommended_fixed_price == 16830.0

    # 4. Client Email verification
    assert proposal.client_email.subject.startswith("Clarification Questions")

    # 5. Model Seam call history check
    call_stages = [call["stage"] for call in fake_model_adapter.call_history]
    assert "requirements" in call_stages
    assert "risks" in call_stages
    assert "milestones" in call_stages
    assert "client_email" in call_stages


@pytest.mark.asyncio
async def test_scoping_pipeline_rejects_empty_input(fake_model_adapter: FakeModelAdapter):
    """Verifies that BriefInput validation fails immediately if content is empty."""
    pipeline = ScopingPipeline(model_client=fake_model_adapter)
    empty_input = BriefInput(file_bytes=b"", text="", filename="empty.txt")

    with pytest.raises(ValueError, match="BriefInput must provide non-empty"):
        await pipeline.scope(input=empty_input)
