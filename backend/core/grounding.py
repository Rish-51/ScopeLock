"""
Grounding Verification Engine.
PLAN.md Section 4 & 4.1:
- Normalized substring match of every model-extracted quote against the original brief.
- Catches hallucinated quotes and flags ungrounded items.
"""

import re
from typing import List, Optional
from backend.schemas.proposal import Requirement, ScopeCreepWarning, GroundingReport


def normalize_text(text: str) -> str:
    """Normalize whitespace and clean non-printable characters for robust substring matching."""
    if not text:
        return ""
    # Replace non-breaking spaces and line breaks with standard space
    cleaned = re.sub(r"[\r\n\t\xa0\u200b]+", " ", text)
    # Collapse multiple spaces into one and strip
    return re.sub(r" +", " ", cleaned).strip()


def is_substring_in_text(quote: str, text: str) -> bool:
    """Checks whether quote (normalized) exists in text (normalized)."""
    norm_quote = normalize_text(quote)
    if not norm_quote:
        return False
    norm_text = normalize_text(text)

    # Direct normalized substring check
    if norm_quote in norm_text:
        return True

    # Case-insensitive check
    if norm_quote.lower() in norm_text.lower():
        return True

    return False


def verify_quotes(
    brief_text: str,
    requirements: List[Requirement],
    scope_creep_warnings: Optional[List[ScopeCreepWarning]] = None,
) -> GroundingReport:
    """
    Verifies all requirement quotes and scope creep quotes against the original brief text.
    Returns GroundingReport with total, grounded count, and list of ungrounded IDs.
    """
    scope_creep = scope_creep_warnings or []
    ungrounded_ids: List[str] = []
    total_quotes = 0
    grounded_quotes = 0

    # Verify requirement source quotes
    for req in requirements:
        total_quotes += 1
        if is_substring_in_text(req.source_quote, brief_text):
            grounded_quotes += 1
        else:
            ungrounded_ids.append(req.id)

    # Verify scope creep quotes
    for idx, sc in enumerate(scope_creep, start=1):
        total_quotes += 1
        sc_id = f"SC{idx}"
        if is_substring_in_text(sc.vague_quote, brief_text):
            grounded_quotes += 1
        else:
            ungrounded_ids.append(sc_id)

    return GroundingReport(
        total_quotes=total_quotes,
        grounded_quotes=grounded_quotes,
        ungrounded_ids=ungrounded_ids,
    )
