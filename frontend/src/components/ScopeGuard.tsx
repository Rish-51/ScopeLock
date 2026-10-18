import React, { useState } from "react";
import { ShieldAlert, Copy, Check, Quote, ShieldCheck } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

export const ScopeGuard: React.FC = () => {
  const { proposal } = useProposalStore();
  const [copiedClauseIdx, setCopiedClauseIdx] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  if (!proposal) return null;

  const warnings = proposal.risks.scope_creep_warnings;

  const handleCopyClause = (clause: string, idx: number) => {
    navigator.clipboard.writeText(clause);
    setCopiedClauseIdx(idx);
    setTimeout(() => setCopiedClauseIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const combined = warnings
      .map(
        (w, i) =>
          `Clause ${i + 1} (Regarding "${w.vague_quote}"):\n${w.suggested_sow_clause}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(combined);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ScopeGuard Header */}
      <div
        className="p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-3 shadow-[3px_3px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold font-sans flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <ShieldAlert className="w-4 h-4" style={{ color: "var(--accent-primary-hover)" }} />
            <span>Scope-Creep Guardrails & SOW Protective Clauses</span>
          </h3>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Detected {warnings.length} ambiguous phrase(s) in the client's brief that could trigger unpaid revisions.
          </p>
        </div>

        {warnings.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "2px solid var(--border-hard)",
              color: "var(--text-primary)",
            }}
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                <span>All Clauses Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Clauses</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Warnings List */}
      <div className="space-y-4">
        {warnings.length === 0 ? (
          <div
            className="p-8 text-center text-sm font-mono rounded-[2px] border-2 border-dashed shadow-[2px_2px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-hard)",
              color: "var(--text-muted)",
            }}
          >
            No severe scope-creep hazards detected.
          </div>
        ) : (
          warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[2px] space-y-4 transition-all shadow-[4px_4px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "2px solid var(--border-hard)",
              }}
            >
              {/* Quote extracted from brief */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <Quote className="w-3 h-3" style={{ color: "var(--accent-primary-hover)" }} />
                  <span>Ambiguous Phrase in Client Brief:</span>
                </span>
                <p
                  className="text-sm font-mono font-bold p-2.5 rounded-[2px] shadow-[2px_2px_0px_#2d0c30]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "2px solid var(--border-hard)",
                    color: "var(--text-primary)",
                  }}
                >
                  "{w.vague_quote}"
                </p>
              </div>

              {/* Why Dangerous */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Why this triggers scope explosion:
                </span>
                <p
                  className="text-xs leading-relaxed p-3 rounded-[2px] shadow-[2px_2px_0px_#2d0c30]"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "2px solid var(--border-hard)",
                    color: "var(--text-primary)",
                  }}
                >
                  {w.why_dangerous}
                </p>
              </div>

              {/* Protective SOW Clause with 1-click copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--status-safe-fg)" }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                    <span>Paste into Statement of Work (SOW):</span>
                  </span>
                  <button
                    onClick={() => handleCopyClause(w.suggested_sow_clause, idx)}
                    className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1.5px solid var(--border-hard)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {copiedClauseIdx === idx ? (
                      <>
                        <Check className="w-3 h-3" style={{ color: "var(--status-safe-fg)" }} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Clause</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  className="p-3 rounded-[2px] text-xs font-mono font-semibold leading-relaxed shadow-[2px_2px_0px_#2d0c30]"
                  style={{
                    backgroundColor: "var(--status-safe-bg)",
                    border: "2px solid var(--border-hard)",
                    color: "var(--status-safe-fg)",
                  }}
                >
                  "{w.suggested_sow_clause}"
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
