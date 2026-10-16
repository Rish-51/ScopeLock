"""
Unit tests for grounding verification.
"""

from backend.core.grounding import verify_quotes, normalize_text
from backend.schemas.proposal import Requirement, ScopeCreepWarning


def test_normalize_text():
    raw = "Hello   world!\n\nThis is\ta\r\ntest  \xa0with spaces."
    assert normalize_text(raw) == "Hello world! This is a test with spaces."


def test_verify_quotes_all_grounded():
    brief = "The client requires user authentication via Google OAuth and expects payments processed using Stripe."
    reqs = [
        Requirement(
            id="R1",
            summary="Google OAuth",
            kind="FUNCTIONAL",
            source_quote="user authentication via Google OAuth",
            complexity_tags=["AUTH"],
        ),
        Requirement(
            id="R2",
            summary="Stripe Payments",
            kind="FUNCTIONAL",
            source_quote="payments processed using Stripe",
            complexity_tags=["PAYMENTS"],
        ),
    ]
    sc = [
        ScopeCreepWarning(
            vague_quote="user authentication",
            why_dangerous="Ambiguous scope",
            suggested_sow_clause="Limited to Google OAuth only",
        )
    ]

    report = verify_quotes(brief, reqs, sc)
    assert report.total_quotes == 3
    assert report.grounded_quotes == 3
    assert report.ungrounded_ids == []


def test_verify_quotes_with_hallucinations():
    brief = "The application must support offline mode for mobile devices."
    reqs = [
        Requirement(
            id="R1",
            summary="Offline mode",
            kind="NON_FUNCTIONAL",
            source_quote="offline mode for mobile devices",
            complexity_tags=["MOBILE_RELEASE"],
        ),
        Requirement(
            id="R2",
            summary="Hallucinated requirement",
            kind="FUNCTIONAL",
            source_quote="blockchain smart contract deployment",
            complexity_tags=["NONE"],
        ),
    ]
    sc = [
        ScopeCreepWarning(
            vague_quote="unlimited free cloud storage forever",
            why_dangerous="Not in brief",
            suggested_sow_clause="Storage capped",
        )
    ]

    report = verify_quotes(brief, reqs, sc)
    assert report.total_quotes == 3
    assert report.grounded_quotes == 1
    assert "R2" in report.ungrounded_ids
    assert "SC1" in report.ungrounded_ids
