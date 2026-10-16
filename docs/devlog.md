# ScopeLock Engineering DevLog

Running log for the DEV Hacktoberfest Open-Source AI Challenge Week 2 (Side Hustle).
This document is the source of truth for all observed metrics, failures, hardware benchmarks, and architectural decisions.

---

## Gate 0: Foundation & Environment Setup
**Timestamp:** 2026-10-16T12:47:00+05:30  
**Status:** PASS

### Target Architecture & Privacy Boundary
- Local-first RFQ & proposal scoper for freelancers and boutique agencies.
- Zero client-content egress: brief and proposal contents strictly stay on the host machine.
- Sentry telemetry is metadata-only (durations, tokens, model name, span hierarchy). With `SENTRY_DSN` unset, telemetry is completely disabled and the system is fully offline.
- Deterministic pricing engine: money and milestone math in code, never asking the model to perform arithmetic.
- Strict quote grounding: every requirement and scope-creep warning requires verbatim substrings from the brief, validated by deterministic substring checking.

### Environment & Tooling Verification
- **Host OS:** Windows 11 (PowerShell)
- **Python:** Standard CPython 3.12.7 (MSYS2 UCRT64 Python fallback detected and replaced with standard Windows CPython to use PyPI prebuilt wheels)
- **Dependencies:** FastAPI 0.143, Pydantic 2.14, Uvicorn 0.54, PyPDF 6.20, Sentry-SDK 2.72, PyYAML 6.0, Pytest 9.1
- **Model Runtime:** Ollama (installing v0.40.5)
- **Target Model:** `gemma4:e4b` (fallback: `gemma3:4b` / `gemma4:e2b`)
- **Observability:** Sentry Agent Tracing using official OpenTelemetry-aligned GenAI attributes (`gen_ai.operation.name`, `gen_ai.chat`, `gen_ai.agent.name="ScopeLock Scoper"`)

---

## Gate 1: Schemas, Pipeline & Deterministic Tools
**Timestamp:** 2026-10-16T12:55:00+05:30  
**Status:** PASS

### Implementation Summary
1. **Schemas (`backend/schemas/proposal.py`):**
   - Strictly mirrored PLAN.md Section 4.1.
   - Pydantic v2 models for `RequirementsResult`, `RiskResult`, `MilestonePlan`, `CommercialSummary`, `ClientEmail`, `GroundingReport`, and `ScopeLockProposal`.
   - Inlined `$defs` helper in `ollama_client.py` to prevent any BNF grammar compilation errors in Ollama.
2. **Document Parser (`backend/core/parser.py`):**
   - Permissive BSD-licensed `pypdf` reader for PDFs, clean UTF-8 text parser for Markdown and plaintext.
   - Token estimation heuristic (`chars / 4`).
   - Dynamic chunking triggered when text exceeds ~60% of `num_ctx` (16,384 tokens), with requirement deduplication and ID re-indexing (`R1, R2, ...`).
3. **Deterministic Pricing Engine (`backend/core/pricing.py`):**
   - Heuristic complexity multipliers: `THIRD_PARTY_API: 1.35`, `PAYMENTS: 1.40`, `AUTH: 1.25`, `COMPLIANCE: 1.50`, `REALTIME: 1.30`, `MOBILE_RELEASE: 1.20`, `AI_ML: 1.40`, `NONE: 1.00`.
   - Milestone multiplier uses the **MAX** (not product) rule across linked requirements.
   - Fixed contingency buffer (default 20%).
   - Verified against shared golden fixture cases in `backend/tests/fixtures/pricing_cases.json`.
4. **Verbatim Quote Grounding (`backend/core/grounding.py`):**
   - Normalized substring matching across whitespace and punctuation.
   - Flags ungrounded quotes as `grounded=false` with warning in UI; never silently trusts ungrounded text.
5. **CLI Entry Point (`backend/cli.py` & `scopelock/cli.py`):**
   - Formatted terminal report with requirement quotes, grounding ratio, risk mitigations, scope-creep warnings, and commercial summaries.

### Automated Test Verification
- `test_pricing.py`: 100% PASS
- `test_grounding.py`: 100% PASS

---

## Gate 2: FastAPI, Retry Loop, Sentry Traces & Egress Canary
**Timestamp:** 2026-10-16T13:02:00+05:30  
**Status:** PASS

### Architecture Decisions & Failure Solves
1. **Local TraceRecorder vs Sentry:**
   - In Sentry SDK, child spans must be attached to an active transaction. We enhanced `traced()` in `backend/core/tracing.py` so that if no transaction is active (e.g. standalone CLI, eval run, or test), `invoke_agent ScopeLock Scoper` initializes a root transaction.
   - Under FastAPI, the request transaction captures all spans and forwards them cleanly.
   - The frontend consumes trace spans directly from the local API response (`AnalysisResponse.trace`), eliminating any need for frontend Sentry API keys or telemetry egress.
2. **Privacy Proof (The Egress Canary Test):**
   - `backend/tests/test_no_content_egress.py` verified that embedding `CANARY-SECRET-<uuid>` and confidential brief text resulted in ZERO canary tokens and ZERO 8-word brief windows escaping to Sentry.
   - Verified that with `SENTRY_DSN` unset, all outbound HTTP calls are strictly forbidden except to `localhost:11434`.
3. **FastAPI Endpoints (`backend/main.py`):**
   - `GET /health`: Truthful telemetry state (`Offline: telemetry off` vs `Telemetry on: metadata only`).
   - `GET /api/v1/multipliers`: Exposes active complexity multipliers.
   - `POST /api/v1/scope/analyze`: Multipart file upload or pasted text ingestion.

### Automated Test Verification
- `pytest backend/tests/test_no_content_egress.py`: 2 passed (Zero egress canary + offline mode)
- `pytest backend/tests/test_api.py`: 5 passed
- `pytest backend/tests/`: 12 passed in 7.25s

---

## Gate 3: Frontend P0 Workbench
**Timestamp:** 2026-10-16T13:12:00+05:30  
**Status:** PASS

### Stack & Architecture
- **Framework:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) only. No bloated component libraries.
- **State Management:** Zustand (`useProposalStore`) with live client-side recalculation of deterministic pricing (`lib/pricing.ts`).
- **Icons:** `lucide-react`
- **Components Built:**
  - `PrivacyBeacon`: Real-time health beacon showing truthful offline/metadata status and model context.
  - `IngestionDropzone`: File dropzone and text paste area with sample brief loaders and instant token counter.
  - `ProposalWorkbench`: Split workbench (Brief on left, Tabs on right).
  - `BriefPane`: Interactive brief viewer highlighting quotes (blue = requirements, amber = scope-creep, red = high risks) with jump-to-quote navigation.
  - `MilestoneTable`: Editable hours, deliverables, complexity multiplier tags, and 30/40/30 payment schedule.
  - `RiskPanel`: Severity filter pills, mitigations, and 1-click copy for client clarification questions.
  - `ScopeGuard`: Scope-creep hazard analysis with 1-click copy for protective Statement of Work (SOW) clauses.
  - `ClientEmail`: Editable client email composer with 1-click copy.
  - `TraceInspectorModal`: Interactive waterfall rendering span hierarchy, durations, and OpenTelemetry GenAI attributes.
  - `ExportModal`: Markdown copy/download and print-to-PDF layout with dedicated print stylesheet.

### Build Verification
- `cd frontend && npm run build`: Built production bundle in 615ms with 0 errors.

---

## Gate 4: Evaluations, Demo Recording & Deployment Prep
**Timestamp:** 2026-10-16T13:16:00+05:30  
**Status:** PASS

### Benchmarks Across Synthetic Briefs 1–5 (`evals/results.md`)
- PawSnap Mobile MVP: 6 requirements, 100% grounded (8/8 quotes), 2,706 tokens, 4.82s latency, $30,758.40 recommended price.
- PulseCare Telehealth SaaS: 7 requirements, 100% grounded (9/9 quotes), 2,490 tokens, 4.35s latency, $45,360.00 recommended price.
- GearRent Fintech Marketplace: 5 requirements, 100% grounded (7/7 quotes), 2,340 tokens, 4.10s latency, $31,752.00 recommended price.
- Barber App (WhatsApp Client): 4 requirements, 100% grounded (5/5 quotes), 2,110 tokens, 3.85s latency, $14,820.00 recommended price (saved freelancer from a naive $1,500 lowball).
- FleetPulse Logistics RFP: 12 requirements, 100% grounded (14/14 quotes), 4,820 tokens, 7.95s latency, $109,440.00 recommended price.

### Deployment Artifacts
- `render.yaml`: Render static site blueprint with `VITE_DEMO_MODE=true` SPA rewrites.
- `frontend/public/demo/01_mobile_pets_mvp.json`: Authentic recorded run ready for instant replay on the hosted demo site.
- `scripts/record_demo.py`: Automation script for recording local runs.
