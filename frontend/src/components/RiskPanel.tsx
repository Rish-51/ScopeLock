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
        return "bg-[#FFF0EB] text-[#C2410C] border-2 border-[#2d0c30] shadow-[1px_1px_0px_#2d0c30]";
      case "HIGH":
        return "bg-[#FFF7ED] text-[#EA580C] border-2 border-[#2d0c30] shadow-[1px_1px_0px_#2d0c30]";
      case "MEDIUM":
        return "bg-[#FDF4FF] text-[#7A407E] border-2 border-[#2d0c30] shadow-[1px_1px_0px_#2d0c30]";
      case "LOW":
        return "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-2 border-[#2d0c30] shadow-[1px_1px_0px_#2d0c30]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[2px] text-xs shadow-[2px_2px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <span className="font-mono font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--text-primary)" }}>Filter Severity:</span>
        <div className="flex gap-1.5">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl)}
              className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer border-1.5"
              style={{
                backgroundColor: severityFilter === lvl ? "var(--pill-active-bg)" : "var(--bg-surface)",
                color: severityFilter === lvl ? "var(--pill-active-fg)" : "var(--text-primary)",
                borderColor: "var(--border-hard)",
                boxShadow: severityFilter === lvl ? "2px 2px 0px #2d0c30" : "1px 1px 0px #2d0c30",
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
            className="p-8 text-center text-sm rounded-[2px] font-mono border-2 border-dashed shadow-[2px_2px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-hard)",
              color: "var(--text-muted)",
            }}
          >
            No technical risks matching the selected filter.
          </div>
        ) : (
          filteredRisks.map((risk, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[2px] space-y-3 shadow-[3px_3px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "2px solid var(--border-hard)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-extrabold uppercase tracking-wider ${getSeverityBadge(
                        risk.severity
                      )}`}
                    >
                      {risk.severity}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0px_#2d0c30]"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1.5px solid var(--border-hard)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {risk.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold font-sans" style={{ color: "var(--text-primary)" }}>{risk.title}</h4>
                </div>
              </div>

              {/* Description & Mitigation */}
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{risk.description}</p>

              <div
                className="p-3 rounded-[2px] space-y-1 shadow-[2px_2px_0px_#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "2px solid var(--border-hard)",
                }}
              >
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--status-safe-fg)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                  <span>Mitigation Strategy:</span>
                </span>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>{risk.mitigation}</p>
              </div>

              {/* Client Question */}
              {risk.client_question && (
                <div
                  className="p-3 rounded-[2px] flex items-center justify-between gap-3 shadow-[2px_2px_0px_#2d0c30]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "2px solid var(--border-hard)",
                  }}
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                      <HelpCircle className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
                      <span>Clarification for Client:</span>
                    </span>
                    <p className="text-xs italic" style={{ color: "var(--text-primary)" }}>
                      "{risk.client_question}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyQuestion(risk.client_question, idx)}
                    className="p-1.5 rounded-[2px] cursor-pointer transition-all shrink-0 shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1.5px solid var(--border-hard)",
                      color: "var(--text-primary)",
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
          className="p-4 rounded-[2px] space-y-2 shadow-[3px_3px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <ClipboardList className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Assumptions ({assumptions.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="font-bold" style={{ color: "var(--accent-primary-bg)" }}>•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out-of-Scope */}
        <div
          className="p-4 rounded-[2px] space-y-2 shadow-[3px_3px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--accent-primary-hover)" }}>
            <Ban className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-hover)" }} />
            <span>Explicitly Out-of-Scope ({outOfScope.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {outOfScope.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="font-bold" style={{ color: "var(--accent-primary-hover)" }}>•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
