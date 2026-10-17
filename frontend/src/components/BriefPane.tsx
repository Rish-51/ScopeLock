import React, { useMemo } from "react";
import { FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

interface HighlightSpan {
  text: string;
  kind: "requirement" | "scope_creep" | "risk";
  id: string;
  label: string;
  grounded: boolean;
}

export const BriefPane: React.FC = () => {
  const {
    rawBriefText,
    filename,
    proposal,
    selectedHighlightId,
    setSelectedHighlightId,
    setActiveTab,
  } = useProposalStore();

  const highlights: HighlightSpan[] = useMemo(() => {
    if (!proposal) return [];
    const list: HighlightSpan[] = [];

    // Requirements quotes
    proposal.requirements.requirements.forEach((req) => {
      const isGrounded = !proposal.grounding.ungrounded_ids.includes(req.id);
      if (req.source_quote && req.source_quote.trim()) {
        list.push({
          text: req.source_quote.trim(),
          kind: "requirement",
          id: req.id,
          label: `${req.id}: ${req.summary}`,
          grounded: isGrounded,
        });
      }
    });

    // Scope creep quotes
    proposal.risks.scope_creep_warnings.forEach((sc, idx) => {
      const scId = `SC${idx + 1}`;
      const isGrounded = !proposal.grounding.ungrounded_ids.includes(scId);
      if (sc.vague_quote && sc.vague_quote.trim()) {
        list.push({
          text: sc.vague_quote.trim(),
          kind: "scope_creep",
          id: scId,
          label: `Scope Hazard: "${sc.vague_quote}"`,
          grounded: isGrounded,
        });
      }
    });

    return list;
  }, [proposal]);

  // Click on a quote in brief -> jump to tab and focus item
  const handleHighlightClick = (h: HighlightSpan) => {
    setSelectedHighlightId(h.id);
    if (h.kind === "requirement") {
      setActiveTab("milestones");
    } else if (h.kind === "scope_creep") {
      setActiveTab("scope_guard");
    }
  };

  const grounding = proposal?.grounding;
  const groundedRatio = grounding
    ? Math.round((grounding.grounded_quotes / max1(grounding.total_quotes)) * 100)
    : 100;

  function max1(v: number) {
    return v > 0 ? v : 1;
  }

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Pane Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: 'var(--status-safe-fg)' }} />
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Client Brief & Grounding
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {filename || "brief.txt"}
          </span>
        </div>

        {/* Grounding Badge */}
        {grounding && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              grounding.ungrounded_ids.length === 0
                ? ""
                : "bg-amber-950/60 border-amber-500/40 text-amber-300"
            }`}
            style={grounding.ungrounded_ids.length === 0 ? { backgroundColor: 'var(--status-safe-bg)', borderColor: 'var(--status-safe-border)', color: 'var(--status-safe-fg)' } : {}}
          >
            {grounding.ungrounded_ids.length === 0 ? (
              <CheckCircle className="w-3 h-3" style={{ color: 'var(--status-safe-fg)' }} />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
            <span>
              {grounding.grounded_quotes}/{grounding.total_quotes} Quotes Grounded ({groundedRatio}%)
            </span>
          </div>
        )}
      </div>

      {/* Quote Navigation Bar */}
      <div className="p-2.5 border-b overflow-x-auto flex gap-1.5 text-[11px] font-mono" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
        <span className="text-zinc-500 shrink-0 self-center px-1" style={{ color: 'var(--text-muted)' }}>Jump to:</span>
        {highlights.map((h) => {
          const isSelected = selectedHighlightId === h.id;
          return (
            <button
              key={h.id}
              onClick={() => handleHighlightClick(h)}
              className={`shrink-0 px-2 py-0.5 rounded cursor-pointer transition-all border ${
                isSelected
                  ? ""
                  : h.kind === "requirement"
                  ? "bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-800/50"
                  : "bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/50"
              }`}
              style={isSelected ? { backgroundColor: 'var(--pill-active-bg)', color: 'var(--pill-active-fg)', borderColor: 'var(--border-focus)' } : {}}
            >
              {h.id}
            </button>
          );
        })}
      </div>

      {/* Brief Body Text */}
      <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap select-text" style={{ color: 'var(--text-secondary)' }}>
        {rawBriefText || "No brief text provided."}
      </div>

      {/* Footer Legend */}
      <div className="p-3 border-t flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/40 border border-blue-400" />
            <span>Requirement Quote</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-400" />
            <span>Scope Hazard</span>
          </span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Quotes verified via deterministic substring check
        </span>
      </div>
    </div>
  );
};
