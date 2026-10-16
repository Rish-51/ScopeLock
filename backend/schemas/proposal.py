"""
ScopeLock Schema Definitions (Pydantic v2).
Source of truth: PLAN.md Section 4.1
"""

from enum import Enum
from typing import List, Literal
from pydantic import BaseModel, Field


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskCategory(str, Enum):
    INTEGRATION = "INTEGRATION"
    SECURITY = "SECURITY"
    SCOPE_CREEP = "SCOPE_CREEP"
    PERFORMANCE = "PERFORMANCE"
    LEGAL_COMPLIANCE = "LEGAL_COMPLIANCE"


class ComplexityTag(str, Enum):
    THIRD_PARTY_API = "THIRD_PARTY_API"
    PAYMENTS = "PAYMENTS"
    AUTH = "AUTH"
    COMPLIANCE = "COMPLIANCE"
    REALTIME = "REALTIME"
    MOBILE_RELEASE = "MOBILE_RELEASE"
    AI_ML = "AI_ML"
    NONE = "NONE"


# ---- Step A: Requirements Extraction ----
class Requirement(BaseModel):
    id: str = Field(description="R1, R2, ...")
    summary: str
    kind: Literal["FUNCTIONAL", "NON_FUNCTIONAL", "CONSTRAINT"]
    source_quote: str = Field(description="EXACT substring copied from the brief")
    complexity_tags: List[ComplexityTag]


class RequirementsResult(BaseModel):
    project_title: str
    one_line_summary: str
    stated_platform_or_stack: List[str]
    requirements: List[Requirement]


# ---- Step B: Risks & Scope Creep ----
class TechnicalRisk(BaseModel):
    title: str
    category: RiskCategory
    severity: Severity
    description: str
    mitigation: str
    client_question: str
    requirement_ids: List[str]


class ScopeCreepWarning(BaseModel):
    vague_quote: str = Field(description="EXACT ambiguous phrase from the brief")
    why_dangerous: str
    suggested_sow_clause: str


class RiskResult(BaseModel):
    risks: List[TechnicalRisk]
    scope_creep_warnings: List[ScopeCreepWarning]
    assumptions: List[str]
    out_of_scope: List[str]


# ---- Step C: Milestones & Scoping ----
class Milestone(BaseModel):
    id: str = Field(description="M1, M2, ...")
    title: str
    objective: str
    deliverables: List[str]
    requirement_ids: List[str]
    hours_min: int
    hours_max: int
    depends_on: List[str]


class MilestonePlan(BaseModel):
    milestones: List[Milestone]


# ---- Deterministic Output (NOT requested from the model) ----
class PaymentStep(BaseModel):
    label: str
    percent: int
    amount: float


class CommercialSummary(BaseModel):
    currency: str
    hourly_rate: float
    hours_min_adjusted: float
    hours_max_adjusted: float
    contingency_percent: int
    price_low: float
    price_high: float
    recommended_fixed_price: float
    payment_schedule: List[PaymentStep]
    multipliers_applied: List[str]


# ---- Step D: Client Communication ----
class ClientEmail(BaseModel):
    subject: str
    body: str


# ---- Grounding Report ----
class GroundingReport(BaseModel):
    total_quotes: int
    grounded_quotes: int
    ungrounded_ids: List[str]


# ---- Full Proposal Envelope ----
class ScopeLockProposal(BaseModel):
    model: str
    requirements: RequirementsResult
    risks: RiskResult
    plan: MilestonePlan
    commercial: CommercialSummary
    client_email: ClientEmail
    grounding: GroundingReport
