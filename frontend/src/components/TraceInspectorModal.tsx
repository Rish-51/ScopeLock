import React, { useState } from "react";
import { X, Activity } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

export const TraceInspectorModal: React.FC = () => {
  const { isTraceModalOpen, setTraceModalOpen, trace } = useProposalStore();
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  if (!isTraceModalOpen) return null;

  const totalDurationMs = trace.reduce((max, s) => Math.max(max, s.duration_ms), 1);
  const selectedSpan = trace.find((s) => s.id === selectedSpanId) || trace[0] || null;

  // Calculate total tokens across spans
  const totalTokens = trace.reduce(
    (sum, s) => sum + (s.attributes["gen_ai.usage.total_tokens"] || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Modal Header */}
        <div
          className="p-5 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
              <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--text-primary)" }}
              >
                Agent Trace Inspector & Waterfall
              </h3>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                style={{
                  backgroundColor: "var(--status-safe-bg)",
                  border: "1px solid var(--status-safe-border)",
                  color: "var(--status-safe-fg)",
                }}
              >
                LOCAL IN-MEMORY RECORDER
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Captured locally via ScopeLock TraceRecorder. The browser does NOT query Sentry's API.
            </p>
          </div>

          <button
            onClick={() => setTraceModalOpen(false)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Stats */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 text-xs"
          style={{
            backgroundColor: "var(--bg-input)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Total Recorded Spans
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              {trace.length}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Total Tokens Used
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              {totalTokens.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Marginal Cost
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--status-safe-fg)" }}>
              $0.00 (Local)
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Sentry GenAI Schema
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--text-secondary)" }}>
              OTel GenAI v1.28
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Waterfall View (7 cols) */}
          <div
            className="md:col-span-7 p-4 overflow-y-auto space-y-2"
            style={{ borderRight: "1px solid var(--border-subtle)" }}
          >
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Span Execution Waterfall
            </h4>

            {trace.map((span) => {
              const isSelected = selectedSpan?.id === span.id;
              const isParent = span.op === "gen_ai.invoke_agent";
              const isTool = span.op === "gen_ai.execute_tool";
              const barWidthPct = Math.max(
                8,
                Math.min(100, (span.duration_ms / totalDurationMs) * 100)
              );

              return (
                <div
                  key={span.id}
                  onClick={() => setSelectedSpanId(span.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isParent ? "pl-3 font-semibold" : "pl-6"
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? "var(--bg-elevated)"
                      : "var(--bg-input)",
                    borderColor: isSelected
                      ? "var(--border-focus)"
                      : "var(--border-subtle)",
                    color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-xs truncate max-w-[280px]" style={{ color: "var(--text-primary)" }}>
                      {span.name}
                    </span>
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                      {span.duration_ms} ms
                    </span>
                  </div>

                  {/* Latency Bar */}
                  <div
                    className="w-full rounded-full h-1.5 overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidthPct}%`,
                        backgroundColor: isParent
                          ? "var(--status-safe-fg)"
                          : isTool
                          ? "#f59e0b"
                          : "#94a3b8",
                      }}
                    />
                  </div>

                  {/* Inline Token Indicator */}
                  {span.attributes["gen_ai.usage.total_tokens"] && (
                    <div className="text-[10px] font-mono mt-1 flex gap-2" style={{ color: "var(--text-muted)" }}>
                      <span>Tokens: {span.attributes["gen_ai.usage.total_tokens"]}</span>
                      {span.attributes["scopelock.load_ms"] && (
                        <span>Load: {span.attributes["scopelock.load_ms"]}ms</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Span Inspector Panel (5 cols) */}
          <div
            className="md:col-span-5 p-5 overflow-y-auto space-y-4"
            style={{ backgroundColor: "var(--bg-canvas)" }}
          >
            {selectedSpan ? (
              <>
                <div
                  className="space-y-1 pb-3"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Selected Span Details
                  </span>
                  <h4 className="text-sm font-bold font-mono break-all" style={{ color: "var(--text-primary)" }}>
                    {selectedSpan.name}
                  </h4>
                  <div className="flex gap-2 text-xs font-mono pt-1" style={{ color: "var(--text-secondary)" }}>
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      op: {selectedSpan.op}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {selectedSpan.duration_ms} ms
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Sentry GenAI Attributes
                  </h5>
                  <div
                    className="rounded-xl p-3 space-y-2 text-xs font-mono overflow-x-auto"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-2 pb-1 last:border-none"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{k}:</span>
                        <span className="text-right break-all" style={{ color: "var(--text-primary)" }}>
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Select a span to inspect attributes.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-3 text-right"
          style={{
            backgroundColor: "var(--bg-canvas)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button
            onClick={() => setTraceModalOpen(false)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
