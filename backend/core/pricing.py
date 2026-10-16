"""
Deterministic Pricing Engine.
PLAN.md Section 4.2:
- Multiplier table driven by complexity tags.
- Milestone multiplier is the MAX (not product) of tags across its linked requirements.
- adjusted_hours = hours * multiplier.
- Contingency default: 20%.
- recommended_fixed_price = hours_max_adjusted * rate * (1 + contingency).
- price_low = hours_min_adjusted * rate (no contingency).
- payment_schedule default: 30/40/30.
- Currency and rate are inputs.
- The model NEVER does arithmetic.
"""

from typing import Dict, List, Optional, Any
from pathlib import Path
import yaml
from backend.schemas.proposal import (
    Milestone,
    Requirement,
    CommercialSummary,
    PaymentStep,
    ComplexityTag,
)

DEFAULT_MULTIPLIERS: Dict[str, float] = {
    ComplexityTag.THIRD_PARTY_API.value: 1.35,
    ComplexityTag.PAYMENTS.value: 1.40,
    ComplexityTag.AUTH.value: 1.25,
    ComplexityTag.COMPLIANCE.value: 1.50,
    ComplexityTag.REALTIME.value: 1.30,
    ComplexityTag.MOBILE_RELEASE.value: 1.20,
    ComplexityTag.AI_ML.value: 1.40,
    ComplexityTag.NONE.value: 1.00,
}

DEFAULT_SCHEDULE = [
    {"label": "Deposit", "percent": 30},
    {"label": "Mid-point demo", "percent": 40},
    {"label": "Final sign-off", "percent": 30},
]


def load_multipliers(config_path: Optional[Path] = None) -> Dict[str, float]:
    """Load multipliers from YAML if available, falling back to defaults."""
    if config_path and config_path.is_file():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if data and "multipliers" in data:
                    return {str(k): float(v) for k, v in data["multipliers"].items()}
        except Exception:
            pass
    return dict(DEFAULT_MULTIPLIERS)


def compute_pricing(
    milestones: List[Milestone],
    requirements: List[Requirement],
    hourly_rate: float = 120.0,
    currency: str = "USD",
    contingency_percent: int = 20,
    multipliers_override: Optional[Dict[str, float]] = None,
    payment_schedule_override: Optional[List[Dict[str, Any]]] = None,
) -> CommercialSummary:
    """
    Computes deterministic pricing summary from milestones and requirements.
    """
    multipliers = dict(DEFAULT_MULTIPLIERS)
    if multipliers_override:
        multipliers.update(multipliers_override)

    # Map requirement ID to its complexity tags
    req_tag_map: Dict[str, List[ComplexityTag]] = {
        r.id: r.complexity_tags for r in requirements
    }

    hours_min_adjusted_total = 0.0
    hours_max_adjusted_total = 0.0
    tags_applied = set()

    for m in milestones:
        # Collect all tags for requirements linked to this milestone
        m_tags: List[str] = []
        for req_id in m.requirement_ids:
            tags = req_tag_map.get(req_id, [])
            for t in tags:
                tag_name = t.value if isinstance(t, ComplexityTag) else str(t)
                m_tags.append(tag_name)

        # Milestone multiplier is the MAX of tags across linked requirements
        m_mult = 1.00
        if m_tags:
            m_mult = max(multipliers.get(t, 1.00) for t in m_tags)
            # Record tags that contributed to a multiplier > 1.0
            for t in set(m_tags):
                if multipliers.get(t, 1.00) > 1.00:
                    tags_applied.add(t)

        hours_min_adjusted_total += m.hours_min * m_mult
        hours_max_adjusted_total += m.hours_max * m_mult

    hours_min_adjusted_total = round(hours_min_adjusted_total, 2)
    hours_max_adjusted_total = round(hours_max_adjusted_total, 2)

    # Low price has 0 contingency, based on hours_min_adjusted
    price_low = round(hours_min_adjusted_total * hourly_rate, 2)

    # Recommended fixed price and high price include contingency on hours_max_adjusted
    contingency_factor = 1.0 + (contingency_percent / 100.0)
    recommended_fixed_price = round(
        hours_max_adjusted_total * hourly_rate * contingency_factor, 2
    )
    price_high = recommended_fixed_price

    # Payment schedule
    schedule_specs = payment_schedule_override or DEFAULT_SCHEDULE
    payment_schedule: List[PaymentStep] = []
    running_amount = 0.0

    for i, step in enumerate(schedule_specs):
        label = step["label"]
        percent = int(step["percent"])
        # For the final step, reconcile any rounding cents
        if i == len(schedule_specs) - 1:
            amount = round(recommended_fixed_price - running_amount, 2)
        else:
            amount = round(recommended_fixed_price * (percent / 100.0), 2)
            running_amount += amount

        payment_schedule.append(PaymentStep(label=label, percent=percent, amount=amount))

    # Formatted list of applied multipliers
    multipliers_applied = sorted(
        [f"{tag}: {multipliers[tag]}x" for tag in tags_applied if tag in multipliers]
    )

    return CommercialSummary(
        currency=currency,
        hourly_rate=hourly_rate,
        hours_min_adjusted=hours_min_adjusted_total,
        hours_max_adjusted=hours_max_adjusted_total,
        contingency_percent=contingency_percent,
        price_low=price_low,
        price_high=price_high,
        recommended_fixed_price=recommended_fixed_price,
        payment_schedule=payment_schedule,
        multipliers_applied=multipliers_applied,
    )
