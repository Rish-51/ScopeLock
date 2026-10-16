"""
Unit tests for deterministic pricing engine.
Tests against shared golden cases in backend/tests/fixtures/pricing_cases.json.
"""

import json
from pathlib import Path
import pytest
from backend.core.pricing import compute_pricing
from backend.schemas.proposal import Milestone, Requirement

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "pricing_cases.json"


def test_pricing_golden_cases():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        cases = json.load(f)

    for case in cases:
        name = case["name"]
        inp = case["inputs"]
        expected = case["expected"]

        reqs = [Requirement(**r) for r in inp["requirements"]]
        milestones = [Milestone(**m) for m in inp["milestones"]]

        result = compute_pricing(
            milestones=milestones,
            requirements=reqs,
            hourly_rate=inp["hourly_rate"],
            currency=inp["currency"],
            contingency_percent=inp["contingency_percent"],
        )

        assert result.hours_min_adjusted == pytest.approx(expected["hours_min_adjusted"], 0.01), f"Failed {name} hours_min"
        assert result.hours_max_adjusted == pytest.approx(expected["hours_max_adjusted"], 0.01), f"Failed {name} hours_max"
        assert result.price_low == pytest.approx(expected["price_low"], 0.01), f"Failed {name} price_low"
        assert result.price_high == pytest.approx(expected["price_high"], 0.01), f"Failed {name} price_high"
        assert result.recommended_fixed_price == pytest.approx(expected["recommended_fixed_price"], 0.01), f"Failed {name} recommended"

        # Check payment schedule sum equals recommended_fixed_price
        schedule_sum = sum(s.amount for s in result.payment_schedule)
        assert schedule_sum == pytest.approx(result.recommended_fixed_price, 0.01)

        for actual_step, exp_step in zip(result.payment_schedule, expected["payment_schedule"]):
            assert actual_step.label == exp_step["label"]
            assert actual_step.percent == exp_step["percent"]
            assert actual_step.amount == pytest.approx(exp_step["amount"], 0.01)
