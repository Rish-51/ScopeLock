"""
ScopeLock CLI Interface.
PLAN.md Section 11 Gate 1:
Run via:
  python -m backend.cli path/to/brief.md
  python -m scopelock.cli path/to/brief.pdf
"""

import sys
import argparse
import asyncio
from pathlib import Path

from backend.core.parser import parse_document
from backend.services.scoping_service import ScopingService
from backend.core.ollama_client import OllamaClient
from backend.core.tracing import trace_session


def format_cli_output(proposal) -> str:
    lines = []
    lines.append("=" * 64)
    lines.append(f" SCOPELOCK PROPOSAL: {proposal.requirements.project_title.upper()}")
    lines.append("=" * 64)
    lines.append(f"Summary: {proposal.requirements.one_line_summary}")
    if proposal.requirements.stated_platform_or_stack:
        lines.append(f"Stack:   {', '.join(proposal.requirements.stated_platform_or_stack)}")
    lines.append("-" * 64)

    # Requirements
    lines.append(f"\n[+] REQUIREMENTS ({len(proposal.requirements.requirements)} total)")
    for req in proposal.requirements.requirements:
        tags = [t.value for t in req.complexity_tags]
        lines.append(f"  [{req.id}] ({req.kind}) {req.summary}")
        lines.append(f"       Quote: \"{req.source_quote}\"")
        if tags and tags != ["NONE"]:
            lines.append(f"       Complexity: {', '.join(tags)}")

    # Grounding Report
    g = proposal.grounding
    ratio = round(g.grounded_quotes / max(1, g.total_quotes) * 100, 1)
    status_str = "ALL GROUNDED" if not g.ungrounded_ids else f"WARNING: {len(g.ungrounded_ids)} ungrounded"
    lines.append(f"\n[+] GROUNDING: {g.grounded_quotes}/{g.total_quotes} ({ratio}%) quotes grounded [{status_str}]")
    if g.ungrounded_ids:
        lines.append(f"    Ungrounded IDs: {', '.join(g.ungrounded_ids)}")

    # Risks & Scope Creep
    if proposal.risks.risks:
        lines.append(f"\n[!] TECHNICAL RISKS ({len(proposal.risks.risks)})")
        for risk in proposal.risks.risks:
            lines.append(f"  * [{risk.severity.value}] {risk.title} ({risk.category.value})")
            lines.append(f"    Mitigation: {risk.mitigation}")
            if risk.client_question:
                lines.append(f"    Question for client: \"{risk.client_question}\"")

    if proposal.risks.scope_creep_warnings:
        lines.append(f"\n[!] SCOPE CREEP HAZARDS ({len(proposal.risks.scope_creep_warnings)})")
        for sc in proposal.risks.scope_creep_warnings:
            lines.append(f"  * Ambiguous phrase: \"{sc.vague_quote}\"")
            lines.append(f"    Hazard: {sc.why_dangerous}")
            lines.append(f"    Protective SOW Clause: {sc.suggested_sow_clause}")

    # Milestones
    lines.append(f"\n[+] MILESTONES & SCOPE PLAN ({len(proposal.plan.milestones)})")
    for m in proposal.plan.milestones:
        lines.append(f"  [{m.id}] {m.title}: {m.hours_min}-{m.hours_max} hrs (linked: {', '.join(m.requirement_ids)})")
        lines.append(f"       Deliverables: {', '.join(m.deliverables)}")

    # Commercial Summary
    c = proposal.commercial
    lines.append("-" * 64)
    lines.append(" COMMERCIAL SUMMARY (DETERMINISTIC MATH)")
    lines.append("-" * 64)
    lines.append(f"  Currency & Rate:       {c.currency} {c.hourly_rate:.2f}/hr")
    lines.append(f"  Base Hours:            {sum(m.hours_min for m in proposal.plan.milestones)}-{sum(m.hours_max for m in proposal.plan.milestones)} hrs")
    lines.append(f"  Adjusted Hours:        {c.hours_min_adjusted:.1f} - {c.hours_max_adjusted:.1f} hrs")
    if c.multipliers_applied:
        lines.append(f"  Multipliers Applied:   {', '.join(c.multipliers_applied)}")
    lines.append(f"  Contingency Buffer:    {c.contingency_percent}%")
    lines.append(f"  Price Range:           {c.currency} {c.price_low:,.2f} - {c.currency} {c.price_high:,.2f}")
    lines.append(f"  Recommended Fixed:     {c.currency} {c.recommended_fixed_price:,.2f}")

    lines.append("\n  Payment Schedule:")
    for step in c.payment_schedule:
        lines.append(f"    * {step.label} ({step.percent}%): {c.currency} {step.amount:,.2f}")

    # Client Email
    lines.append("-" * 64)
    lines.append(" DRAFT CLIENT EMAIL")
    lines.append("-" * 64)
    lines.append(f"Subject: {proposal.client_email.subject}\n")
    lines.append(proposal.client_email.body)
    lines.append("=" * 64)

    return "\n".join(lines)


async def main():
    parser = argparse.ArgumentParser(description="ScopeLock CLI: NDA-safe local proposal scoper")
    parser.add_argument("brief", help="Path to brief file (.pdf, .md, .txt)")
    parser.add_argument("--rate", type=float, default=120.0, help="Hourly rate in chosen currency (default: 120.0)")
    parser.add_argument("--currency", default="USD", help="Currency code (USD, INR, EUR, etc.)")
    parser.add_argument("--contingency", type=int, default=20, help="Contingency buffer percentage (default: 20)")
    parser.add_argument("--model", default=None, help="Ollama model override")
    parser.add_argument("--output", default=None, help="Optional output JSON file path")

    args = parser.parse_args()

    brief_path = Path(args.brief)
    if not brief_path.is_file():
        print(f"Error: Brief file not found at '{brief_path}'", file=sys.stderr)
        sys.exit(1)

    file_bytes = brief_path.read_bytes()
    doc = parse_document(file_bytes, brief_path.name)
    print(f"Loaded '{brief_path.name}' ({doc.char_count} chars, ~{doc.estimated_tokens} tokens)")

    ollama_client = OllamaClient(default_model=args.model)
    service = ScopingService(ollama_client=ollama_client)

    print("Analyzing brief locally with ScopeLock Scoper agent...")
    with trace_session():
        proposal = await service.analyze_document(
            doc=doc,
            hourly_rate=args.rate,
            currency=args.currency,
            contingency_percent=args.contingency,
        )

    output_str = format_cli_output(proposal)
    print(output_str)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(proposal.model_dump_json(indent=2), encoding="utf-8")
        print(f"\nProposal JSON saved to '{out_path}'")


if __name__ == "__main__":
    asyncio.run(main())
