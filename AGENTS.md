# ScopeLock: Agent Guidelines & Architecture

ScopeLock is an NDA-safe, local-first proposal/RFQ scoper for freelancers built for the DEV Hacktoberfest 2026 Open-Source AI Challenge Week 2 (Side Hustle).

## Project Guidelines

- **Source of Truth**: [PLAN.md](file:///c:/Users/nisha/OneDrive/Documents/GitHub/week2/PLAN.md) is the absolute specification for architecture, schemas, and file structure.
- **Privacy & Telemetry**: Zero client-content egress over the wire. Telemetry is metadata-only via Sentry Agent Tracing and completely disabled when `SENTRY_DSN` is empty.
- **Deterministic Pricing**: Pricing arithmetic must strictly remain in deterministic code ([backend/core/pricing.py](file:///c:/Users/nisha/OneDrive/Documents/GitHub/week2/backend/core/pricing.py)), never delegated to LLMs.
- **Model Runtime**: Runs on local Ollama (`gemma4:e2b` or `gemma4:e4b`) using schema-constrained JSON decoding.

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See [`docs/agents/issue-tracker.md`](file:///c:/Users/nisha/OneDrive/Documents/GitHub/week2/docs/agents/issue-tracker.md).

### Triage labels

Canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See [`docs/agents/triage-labels.md`](file:///c:/Users/nisha/OneDrive/Documents/GitHub/week2/docs/agents/triage-labels.md).

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/`). See [`docs/agents/domain.md`](file:///c:/Users/nisha/OneDrive/Documents/GitHub/week2/docs/agents/domain.md).
