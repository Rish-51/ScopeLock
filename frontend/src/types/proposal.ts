/**
 * ScopeLock TypeScript Interfaces.
 * Mirrors backend/schemas/proposal.py per PLAN.md Section 4.1.
 */

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskCategory =
  | "INTEGRATION"
  | "SECURITY"
  | "SCOPE_CREEP"
  | "PERFORMANCE"
  | "LEGAL_COMPLIANCE";

export type ComplexityTag =
  | "THIRD_PARTY_API"
  | "PAYMENTS"
  | "AUTH"
  | "COMPLIANCE"
  | "REALTIME"
  | "MOBILE_RELEASE"
  | "AI_ML"
  | "NONE";

export interface Requirement {
  id: string; // R1, R2...
  summary: string;
  kind: "FUNCTIONAL" | "NON_FUNCTIONAL" | "CONSTRAINT";
  source_quote: string;
  complexity_tags: ComplexityTag[];
}

export interface RequirementsResult {
  project_title: string;
  one_line_summary: string;
  stated_platform_or_stack: string[];
  requirements: Requirement[];
}

export interface TechnicalRisk {
  title: string;
  category: RiskCategory;
  severity: Severity;
  description: string;
  mitigation: string;
  client_question: string;
  requirement_ids: string[];
}

export interface ScopeCreepWarning {
  vague_quote: string;
  why_dangerous: string;
  suggested_sow_clause: string;
}

export interface RiskResult {
  risks: TechnicalRisk[];
  scope_creep_warnings: ScopeCreepWarning[];
  assumptions: string[];
  out_of_scope: string[];
}

export interface Milestone {
  id: string; // M1, M2...
  title: string;
  objective: string;
  deliverables: string[];
  requirement_ids: string[];
  hours_min: number;
  hours_max: number;
  depends_on: string[];
}

export interface MilestonePlan {
  milestones: Milestone[];
}

export interface PaymentStep {
  label: string;
  percent: number;
  amount: number;
}

export interface CommercialSummary {
  currency: string;
  hourly_rate: number;
  hours_min_adjusted: number;
  hours_max_adjusted: number;
  contingency_percent: number;
  price_low: number;
  price_high: number;
  recommended_fixed_price: number;
  payment_schedule: PaymentStep[];
  multipliers_applied: string[];
}

export interface ClientEmail {
  subject: string;
  body: string;
}

export interface GroundingReport {
  total_quotes: number;
  grounded_quotes: number;
  ungrounded_ids: string[];
}

export interface ScopeLockProposal {
  model: string;
  requirements: RequirementsResult;
  risks: RiskResult;
  plan: MilestonePlan;
  commercial: CommercialSummary;
  client_email: ClientEmail;
  grounding: GroundingReport;
}

export interface TraceSpan {
  id: string;
  parent_id: string | null;
  name: string;
  op: string;
  start_ms: number;
  duration_ms: number;
  status: "ok" | "error";
  attributes: Record<string, any>;
}

export interface AnalysisResponse {
  proposal: ScopeLockProposal;
  trace: TraceSpan[];
  char_count: number;
  estimated_tokens: number;
  is_chunked: boolean;
}

export interface HealthState {
  status: string;
  model: string;
  num_ctx: number;
  telemetry_enabled: boolean;
  telemetry_state: string;
  ollama: {
    reachable: boolean;
    models?: string[];
    error?: string;
  };
}
