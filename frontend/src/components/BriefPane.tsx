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
    <div
      className="flex flex-col h-full rounded-[3px] overflow-hidden shadow-[4px_4px_0px_#2d0c30]"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "2px solid var(--border-hard)",
      }}
    >
      {/* Pane Header */}
      <div
        className="p-4 flex items-center justify-between border-b-2"
        style={{
          borderColor: "var(--border-hard)",
          backgroundColor: "var(--bg-canvas)",
        }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
          <h2
            className="text-xs font-mono font-bold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}
          >
            Client Brief & Grounding
          </h2>
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1.5px solid var(--border-hard)",
            }}
          >
            {filename || "brief.txt"}
          </span>
        </div>

        {/* Grounding Badge */}
        {grounding && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold shadow-[2px_2px_0px_#2d0c30]"
            style={{
              backgroundColor:
                grounding.ungrounded_ids.length === 0
                  ? "var(--status-safe-bg)"
                  : "#FFF7ED",
              border: "2px solid var(--border-hard)",
              color:
                grounding.ungrounded_ids.length === 0
                  ? "var(--status-safe-fg)"
                  : "#EA580C",
            }}
          >
            {grounding.ungrounded_ids.length === 0 ? (
              <CheckCircle className="w-3 h-3" style={{ color: "var(--status-safe-fg)" }} />
            ) : (
              <AlertTriangle className="w-3 h-3" style={{ color: "var(--accent-primary-hover)" }} />
            )}
            <span>
              {grounding.grounded_quotes}/{grounding.total_quotes} Grounded ({groundedRatio}%)
            </span>
          </div>
        )}
      </div>

      {/* Quote Navigation Bar */}
      <div
        className="p-2.5 overflow-x-auto flex gap-1.5 text-[11px] font-mono border-b-2"
        style={{
          borderColor: "var(--border-hard)",
          backgroundColor: "var(--bg-input)",
        }}
      >
        <span className="shrink-0 self-center px-1 font-bold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Jump:
        </span>
        {highlights.map((h) => {
          const isSelected = selectedHighlightId === h.id;
          return (
            <button
              key={h.id}
              onClick={() => handleHighlightClick(h)}
              className="shrink-0 px-2 py-0.5 rounded-[2px] cursor-pointer transition-all font-mono font-bold shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: isSelected
                  ? "var(--pill-active-bg)"
                  : "var(--bg-elevated)",
                border: "1.5px solid var(--border-hard)",
                color: isSelected
                  ? "var(--pill-active-fg)"
                  : "var(--text-primary)",
              }}
            >
              {h.id}
            </button>
          );
        })}
      </div>

      {/* Brief Body Text (Markdown Editor Well) */}
      <div
        className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap select-text"
        style={{
          backgroundColor: "var(--bg-input)",
          color: "var(--text-primary)",
        }}
      >
        {rawBriefText || "No brief text provided."}
      </div>

      {/* Footer Legend */}
      <div
        className="p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-t-2"
        style={{
          borderColor: "var(--border-hard)",
          backgroundColor: "var(--bg-canvas)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold">
            <span
              className="w-2.5 h-2.5 rounded-[1px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1.5px solid var(--border-hard)",
              }}
            />
            <span>Requirements</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span
              className="w-2.5 h-2.5 rounded-[1px]"
              style={{
                backgroundColor: "var(--status-safe-bg)",
                border: "1.5px solid var(--border-hard)",
              }}
            />
            <span>Scope Verified</span>
          </span>
        </div>
        <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
          Deterministic verbatim quote grounding
        </span>
      </div>
    </div>
  );
};
