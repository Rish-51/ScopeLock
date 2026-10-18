# ScopeLock Domain Glossary

This document defines the canonical ubiquitous language for the ScopeLock codebase. Maintainers and agents must use these terms consistently across code, schemas, and tests.

---

### Core Concepts

#### Brief Input
The raw, unparsed client RFQ (Request for Quote), RFP, or project specification uploaded by the freelancer. Can be a PDF document, Markdown file, or pasted plain text. Contains confidential client specifications subject to NDA.

#### Scoping Pipeline
The core automated engine that transforms a **Brief Input** into a fully structured, grounded, and priced **ScopeLock Proposal**. Encapsulates document parsing, token estimation, chunking, LLM extraction stages, quote verification, and pricing arithmetic behind a single interface.

#### Model Seam
The abstraction interface (`ModelClient` protocol) that decouples the pipeline's stage orchestration from the underlying language model runtime. Satisfied by two adapters:
1. `OllamaModelAdapter`: Production adapter communicating with local Ollama (`gemma4:e4b` / `gemma4:e2b`).
2. `FakeModelAdapter`: Deterministic test adapter replaying canned responses for millisecond unit testing.

#### Stage Gate
A deterministic verification or transformation step within the pipeline that does NOT rely on a language model.
- **Quote Grounding Gate (`verify_quotes`)**: Verifies that every extracted requirement and scope-creep warning has a verbatim substring match in the brief.
- **Deterministic Pricing Gate (`compute_pricing`)**: Calculates adjusted hours, contingency buffers, and payment milestones using deterministic arithmetic.

#### ScopeLock Proposal
The final structured output artifact. Composed of:
- **Requirements Result**: Atomic functional/non-functional requirements with verbatim quotes and complexity tags.
- **Technical Risks & Scope Creep**: Identified hazards, severity ratings, mitigations, and protective SOW clauses.
- **Milestone Plan**: Sequential milestones with realistic integer hour ranges.
- **Commercial Summary**: Authoritative pricing totals, contingency buffers, and milestone payment schedules.
- **Client Email**: Professional, courteous clarification email for unaddressed scope questions.
- **Grounding Report**: Audit of verbatim quotes verifying 0% hallucination.
