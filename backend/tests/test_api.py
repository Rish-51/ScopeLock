"""
API Integration tests for FastAPI endpoints.
Tests /health, /api/v1/multipliers, and /api/v1/scope/analyze with mocked ScopingService.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.proposal import (
    ScopeLockProposal,
    RequirementsResult,
    Requirement,
    RiskResult,
    MilestonePlan,
    Milestone,
    CommercialSummary,
    ClientEmail,
    GroundingReport,
    PaymentStep,
)

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "telemetry_state" in data
    assert "model" in data
    assert "ollama" in data


def test_api_v1_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_multipliers_endpoint():
    response = client.get("/api/v1/multipliers")
    assert response.status_code == 200
    data = response.json()
    assert "multipliers" in data
    assert "defaults" in data
    assert data["multipliers"]["PAYMENTS"] == 1.40
    assert data["defaults"]["hourly_rate"] == 120.0


@pytest.mark.asyncio
async def test_analyze_endpoint_with_text():
    mock_proposal = ScopeLockProposal(
        model="gemma4:e4b",
        requirements=RequirementsResult(
            project_title="FastAPI Demo Project",
            one_line_summary="High-speed API",
            stated_platform_or_stack=["FastAPI", "Python"],
            requirements=[
                Requirement(
                    id="R1",
                    summary="REST API endpoints",
                    kind="FUNCTIONAL",
                    source_quote="REST API endpoints",
                    complexity_tags=["NONE"],
                )
            ],
        ),
        risks=RiskResult(
            risks=[],
            scope_creep_warnings=[],
            assumptions=[],
            out_of_scope=[],
        ),
        plan=MilestonePlan(
            milestones=[
                Milestone(
                    id="M1",
                    title="API Core",
                    objective="Deliver endpoints",
                    deliverables=["main.py"],
                    requirement_ids=["R1"],
                    hours_min=10,
                    hours_max=20,
                    depends_on=[],
                )
            ]
        ),
        commercial=CommercialSummary(
            currency="USD",
            hourly_rate=120.0,
            hours_min_adjusted=10.0,
            hours_max_adjusted=20.0,
            contingency_percent=20,
            price_low=1200.0,
            price_high=2880.0,
            recommended_fixed_price=2880.0,
            payment_schedule=[
                PaymentStep(label="Deposit", percent=30, amount=864.0),
                PaymentStep(label="Mid-point demo", percent=40, amount=1152.0),
                PaymentStep(label="Final sign-off", percent=30, amount=864.0),
            ],
            multipliers_applied=[],
        ),
        client_email=ClientEmail(subject="Project Clarification", body="Hi Client..."),
        grounding=GroundingReport(total_quotes=1, grounded_quotes=1, ungrounded_ids=[]),
    )

    with patch("backend.services.scoping_service.ScopingService.analyze_document", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = mock_proposal

        response = client.post(
            "/api/v1/scope/analyze",
            data={
                "brief_text": "We need REST API endpoints built with Python.",
                "hourly_rate": "120.0",
                "currency": "USD",
                "contingency_percent": "20",
            },
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert "proposal" in data
        assert "trace" in data
        assert data["proposal"]["requirements"]["project_title"] == "FastAPI Demo Project"
        assert data["proposal"]["commercial"]["recommended_fixed_price"] == 2880.0


def test_analyze_endpoint_missing_input():
    response = client.post("/api/v1/scope/analyze", data={})
    assert response.status_code == 400
    assert "Either a file upload or brief_text" in response.json()["detail"]
