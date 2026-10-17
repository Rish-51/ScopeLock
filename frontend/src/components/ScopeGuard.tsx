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
        className="p-4 rounded-xl flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
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
            className="p-8 text-center text-sm rounded-xl"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            No severe scope-creep hazards detected.
          </div>
        ) : (
          warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl space-y-4 transition-all"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Quote extracted from brief */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Quote className="w-3 h-3" style={{ color: "var(--accent-primary-hover)" }} />
                  <span>Ambiguous Phrase in Client Brief:</span>
                </span>
                <p
                  className="text-sm font-mono font-bold p-2.5 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  "{w.vague_quote}"
                </p>
              </div>

              {/* Why Dangerous */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Why this triggers scope explosion:
                </span>
                <p
                  className="text-xs leading-relaxed p-3 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {w.why_dangerous}
                </p>
              </div>

              {/* Protective SOW Clause with 1-click copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--status-safe-fg)" }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                    <span>Paste into Statement of Work (SOW):</span>
                  </span>
                  <button
                    onClick={() => handleCopyClause(w.suggested_sow_clause, idx)}
                    className="px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
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
                        <span>Copy SOW Clause</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  className="p-3 rounded-lg text-xs font-mono leading-relaxed"
                  style={{
                    backgroundColor: "var(--status-safe-bg)",
                    border: "1px solid var(--status-safe-border)",
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
