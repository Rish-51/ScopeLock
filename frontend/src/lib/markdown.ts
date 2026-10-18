import type { ScopeLockProposal } from "../types/proposal";

export function generateProposalMarkdown(proposal: ScopeLockProposal): string {
  const { requirements, risks, plan, commercial, client_email } = proposal;
  const currencySymbol = commercial.currency === "USD" ? "$" : `${commercial.currency} `;

  let md = `# Statement of Work & Proposal: ${requirements.project_title}\n\n`;
  md += `> **Summary:** ${requirements.one_line_summary}\n\n`;

  if (requirements.stated_platform_or_stack && requirements.stated_platform_or_stack.length > 0) {
    md += `**Stated Tech Stack / Platforms:** ${requirements.stated_platform_or_stack.join(", ")}\n\n`;
  }

  md += `---\n\n`;
  md += `## 1. Commercial Summary & Pricing\n\n`;
  md += `| Item | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Hourly Base Rate** | ${currencySymbol}${commercial.hourly_rate.toFixed(2)}/hr |\n`;
  md += `| **Estimated Hours Range** | ${commercial.hours_min_adjusted.toFixed(1)} hrs – ${commercial.hours_max_adjusted.toFixed(1)} hrs |\n`;
  md += `| **Contingency Buffer** | ${commercial.contingency_percent}% |\n`;
  md += `| **Estimated Price Range** | ${currencySymbol}${commercial.price_low.toLocaleString()} – ${currencySymbol}${commercial.price_high.toLocaleString()} |\n`;
  md += `| **Recommended Fixed Price** | **${currencySymbol}${commercial.recommended_fixed_price.toLocaleString()}** |\n\n`;

  if (commercial.multipliers_applied && commercial.multipliers_applied.length > 0) {
    md += `*Complexity Multipliers Applied:* ${commercial.multipliers_applied.join(", ")}\n\n`;
  }

  md += `### Payment Milestones\n\n`;
  md += `| Milestone / Phase | Share (%) | Amount |\n`;
  md += `| :--- | :---: | :--- |\n`;
  for (const step of commercial.payment_schedule) {
    md += `| ${step.label} | ${step.percent}% | ${currencySymbol}${step.amount.toLocaleString()} |\n`;
  }
  md += `\n---\n\n`;

  md += `## 2. Milestone Execution Plan\n\n`;
  for (const m of plan.milestones) {
    md += `### ${m.id}: ${m.title}\n`;
    md += `**Objective:** ${m.objective}\n\n`;
    md += `**Effort:** ${m.hours_min}–${m.hours_max} hours | **Linked Requirements:** ${m.requirement_ids.join(", ") || "General"}`;
    if (m.depends_on && m.depends_on.length > 0) {
      md += ` | **Depends on:** ${m.depends_on.join(", ")}`;
    }
    md += `\n\n`;
    if (m.deliverables && m.deliverables.length > 0) {
      md += `**Deliverables:**\n`;
      for (const d of m.deliverables) {
        md += `- [ ] ${d}\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;
  md += `## 3. Scoped Requirements & Brief Grounding\n\n`;
  for (const req of requirements.requirements) {
    md += `### [${req.id}] ${req.summary}\n`;
    md += `- **Type:** ${req.kind}\n`;
    if (req.complexity_tags && req.complexity_tags.length > 0) {
      md += `- **Complexity Tags:** ${req.complexity_tags.join(", ")}\n`;
    }
    md += `- **Verbatim Source Quote:**\n`;
    md += `  > "${req.source_quote}"\n\n`;
  }

  md += `---\n\n`;
  md += `## 4. Scope Guard & Protective Clauses\n\n`;
  if (risks.scope_creep_warnings && risks.scope_creep_warnings.length > 0) {
    for (const sc of risks.scope_creep_warnings) {
      md += `### ⚠️ Ambiguous Scope: "${sc.vague_quote}"\n`;
      md += `**Risk:** ${sc.why_dangerous}\n\n`;
      md += `**Protective SOW Clause:**\n`;
      md += `> ${sc.suggested_sow_clause}\n\n`;
    }
  }

  if (risks.out_of_scope && risks.out_of_scope.length > 0) {
    md += `### Out of Scope\n`;
    for (const oos of risks.out_of_scope) {
      md += `- ❌ ${oos}\n`;
    }
    md += `\n`;
  }

  if (risks.assumptions && risks.assumptions.length > 0) {
    md += `### Key Assumptions\n`;
    for (const asm of risks.assumptions) {
      md += `- ℹ️ ${asm}\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## 5. Technical Risks & Mitigations\n\n`;
  for (const risk of risks.risks) {
    md += `### [${risk.severity}] ${risk.title} (${risk.category})\n`;
    md += `${risk.description}\n\n`;
    md += `- **Mitigation Strategy:** ${risk.mitigation}\n`;
    if (risk.client_question) {
      md += `- **Clarification Needed:** ${risk.client_question}\n`;
    }
    md += `\n`;
  }

  if (client_email && client_email.body) {
    md += `---\n\n`;
    md += `## 6. Client Clarification Email (Draft)\n\n`;
    md += `**Subject:** ${client_email.subject}\n\n`;
    md += `\`\`\`text\n${client_email.body}\n\`\`\`\n`;
  }

  return md;
}
