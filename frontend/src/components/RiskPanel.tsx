import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  HelpCircle,
  Ban,
  ClipboardList,
} from "lucide-react";
import { useProposalStore } from "../store/proposalStore";
import type { Severity } from "../types/proposal";

export const RiskPanel: React.FC = () => {
  const { proposal } = useProposalStore();
  const [severityFilter, setSeverityFilter] = useState<"ALL" | Severity>("ALL");
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  if (!proposal) return null;

  const risks = proposal.risks.risks;
  const assumptions = proposal.risks.assumptions;
  const outOfScope = proposal.risks.out_of_scope;

  const filteredRisks = risks.filter((r) =>
    severityFilter === "ALL" ? true : r.severity === severityFilter
  );

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-[#FFF0EB] text-[#C2410C] border-[#FDBA74]";
      case "HIGH":
        return "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]";
      case "MEDIUM":
        return "bg-[#FDF4FF] text-[#7A407E] border-[#E9D5FF]";
      case "LOW":
        return "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl text-xs"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>Filter Severity:</span>
        <div className="flex gap-1.5">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border"
              style={{
                backgroundColor: severityFilter === lvl ? "var(--pill-active-bg)" : "transparent",
                color: severityFilter === lvl ? "var(--pill-active-fg)" : "var(--text-secondary)",
                borderColor: severityFilter === lvl ? "var(--border-focus)" : "transparent",
                fontWeight: severityFilter === lvl ? 600 : 400,
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Risks Grid */}
      <div className="space-y-4">
        {filteredRisks.length === 0 ? (
          <div
            className="p-8 text-center text-sm rounded-xl"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            No technical risks matching the selected filter.
          </div>
        ) : (
          filteredRisks.map((risk, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl space-y-3"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                        risk.severity
                      )}`}
                    >
                      {risk.severity}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {risk.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{risk.title}</h4>
                </div>
              </div>

              {/* Description & Mitigation */}
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{risk.description}</p>

              <div
                className="p-3 rounded-lg space-y-1"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "var(--status-safe-fg)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                  <span>Mitigation Strategy:</span>
                </span>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>{risk.mitigation}</p>
              </div>

              {/* Client Question */}
              {risk.client_question && (
                <div
                  className="p-3 rounded-lg flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                      <HelpCircle className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      <span>Clarification for Client:</span>
                    </span>
                    <p className="text-xs italic" style={{ color: "var(--text-primary)" }}>
                      "{risk.client_question}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyQuestion(risk.client_question, idx)}
                    className="p-1.5 rounded-lg cursor-pointer transition-colors shrink-0"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                    title="Copy question"
                  >
                    {copiedQuestionIdx === idx ? (
                      <Check className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Assumptions & Out-of-Scope Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Assumptions */}
        <div
          className="p-4 rounded-xl space-y-2"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <ClipboardList className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Assumptions ({assumptions.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out-of-Scope */}
        <div
          className="p-4 rounded-xl space-y-2"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--accent-primary-hover)" }}>
            <Ban className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-hover)" }} />
            <span>Explicitly Out-of-Scope ({outOfScope.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {outOfScope.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span style={{ color: "var(--accent-primary-hover)" }}>•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
