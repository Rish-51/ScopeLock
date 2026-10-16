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
        return "bg-red-950/80 text-red-300 border-red-700/60";
      case "HIGH":
        return "bg-orange-950/80 text-orange-300 border-orange-700/60";
      case "MEDIUM":
        return "bg-amber-950/80 text-amber-300 border-amber-700/60";
      case "LOW":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs">
        <span className="text-zinc-400 font-medium">Filter Severity:</span>
        <div className="flex gap-1.5">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                severityFilter === lvl
                  ? "bg-zinc-800 text-white border-zinc-600"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-transparent"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Risks Grid */}
      <div className="space-y-4">
        {filteredRisks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm bg-zinc-950/40 border border-zinc-800 rounded-xl">
            No technical risks matching the selected filter.
          </div>
        ) : (
          filteredRisks.map((risk, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3"
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
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {risk.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{risk.title}</h4>
                </div>
              </div>

              {/* Description & Mitigation */}
              <p className="text-xs text-zinc-300 leading-relaxed">{risk.description}</p>

              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mitigation Strategy:</span>
                </span>
                <p className="text-xs text-zinc-300">{risk.mitigation}</p>
              </div>

              {/* Client Question */}
              {risk.client_question && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Clarification for Client:</span>
                    </span>
                    <p className="text-xs text-zinc-200 italic">
                      "{risk.client_question}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyQuestion(risk.client_question, idx)}
                    className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 text-indigo-200 cursor-pointer transition-colors shrink-0"
                    title="Copy question"
                  >
                    {copiedQuestionIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
        <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-zinc-500" />
            <span>Assumptions ({assumptions.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-zinc-500">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out-of-Scope */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            <span>Explicitly Out-of-Scope ({outOfScope.length})</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {outOfScope.map((o, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-red-500/70">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
