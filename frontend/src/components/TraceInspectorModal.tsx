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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Agent Trace Inspector & Waterfall
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                LOCAL IN-MEMORY RECORDER
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Captured locally via ScopeLock TraceRecorder. The browser does NOT query Sentry's API.
            </p>
          </div>

          <button
            onClick={() => setTraceModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-zinc-950/60 border-b border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">
              Total Recorded Spans
            </span>
            <span className="text-sm font-bold font-mono text-white">{trace.length}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">
              Total Tokens Used
            </span>
            <span className="text-sm font-bold font-mono text-indigo-300">
              {totalTokens.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">
              Marginal Cost
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">$0.00 (Local)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">
              Sentry GenAI Schema
            </span>
            <span className="text-sm font-bold font-mono text-zinc-300">OTel GenAI v1.28</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Waterfall View (7 cols) */}
          <div className="md:col-span-7 p-4 overflow-y-auto border-r border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
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
                    isSelected
                      ? "bg-zinc-800 border-indigo-500 shadow-md"
                      : "bg-zinc-950/50 hover:bg-zinc-800/60 border-zinc-800/80"
                  } ${isParent ? "pl-3 font-semibold" : "pl-6 text-zinc-300"}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-xs text-white truncate max-w-[280px]">
                      {span.name}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                      {span.duration_ms} ms
                    </span>
                  </div>

                  {/* Latency Bar */}
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isParent
                          ? "bg-emerald-400"
                          : isTool
                          ? "bg-amber-400"
                          : "bg-indigo-400"
                      }`}
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>

                  {/* Inline Token Indicator */}
                  {span.attributes["gen_ai.usage.total_tokens"] && (
                    <div className="text-[10px] font-mono text-zinc-500 mt-1 flex gap-2">
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
          <div className="md:col-span-5 p-5 overflow-y-auto bg-zinc-950/40 space-y-4">
            {selectedSpan ? (
              <>
                <div className="space-y-1 pb-3 border-b border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Selected Span Details
                  </span>
                  <h4 className="text-sm font-bold text-white font-mono break-all">
                    {selectedSpan.name}
                  </h4>
                  <div className="flex gap-2 text-xs font-mono text-zinc-400 pt-1">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      op: {selectedSpan.op}
                    </span>
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {selectedSpan.duration_ms} ms
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Sentry GenAI Attributes
                  </h5>
                  <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 space-y-2 text-xs font-mono overflow-x-auto">
                    {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-zinc-800/60 pb-1 last:border-none">
                        <span className="text-zinc-500 text-[11px] shrink-0">{k}:</span>
                        <span className="text-zinc-200 text-right break-all">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Select a span to inspect attributes.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-right">
          <button
            onClick={() => setTraceModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
