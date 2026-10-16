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
      <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Scope-Creep Guardrails & SOW Protective Clauses</span>
          </h3>
          <p className="text-xs text-amber-200/80">
            Detected {warnings.length} ambiguous phrase(s) in the client's brief that could trigger unpaid revisions.
          </p>
        </div>

        {warnings.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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
          <div className="p-8 text-center text-zinc-500 text-sm bg-zinc-950/40 border border-zinc-800 rounded-xl">
            No severe scope-creep hazards detected.
          </div>
        ) : (
          warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl space-y-4 transition-all"
            >
              {/* Quote extracted from brief */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Quote className="w-3 h-3 text-amber-400" />
                  <span>Ambiguous Phrase in Client Brief:</span>
                </span>
                <p className="text-sm font-mono font-bold text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
                  "{w.vague_quote}"
                </p>
              </div>

              {/* Why Dangerous */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Why this triggers scope explosion:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                  {w.why_dangerous}
                </p>
              </div>

              {/* Protective SOW Clause with 1-click copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Paste into Statement of Work (SOW):</span>
                  </span>
                  <button
                    onClick={() => handleCopyClause(w.suggested_sow_clause, idx)}
                    className="px-2 py-1 rounded-md bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedClauseIdx === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
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
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-200/90 leading-relaxed">
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
