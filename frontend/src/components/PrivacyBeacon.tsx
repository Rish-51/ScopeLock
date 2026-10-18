import React, { useEffect } from "react";
import { ShieldCheck, Activity, Cpu } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

export const PrivacyBeacon: React.FC = () => {
  const { health, setHealth, trace, setTraceModalOpen } = useProposalStore();

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/v1/health");
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {
        // Fallback offline health state
        setHealth({
          status: "ok",
          model: "gemma4:e4b",
          num_ctx: 16384,
          telemetry_enabled: false,
          telemetry_state: "Offline: telemetry off",
          ollama: { reachable: false },
        });
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [setHealth]);

  const isTelemetryOn = health?.telemetry_enabled ?? false;
  const modelName = health?.model ?? "gemma4:e4b";
  const numCtxK = Math.round((health?.num_ctx ?? 16384) / 1024);

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      {/* Privacy Beacon - Warm Brutalism Hard Badge */}
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-[2px] text-xs font-mono font-bold tracking-tight shadow-[2px_2px_0px_#2d0c30] transition-transform"
        style={{
          backgroundColor: "var(--status-safe-bg)",
          border: "2px solid var(--border-hard)",
          color: "var(--status-safe-fg)",
        }}
        title={
          isTelemetryOn
            ? "Sentry metadata-only telemetry enabled. Client brief text never leaves this machine."
            : "Telemetry disabled. System is operating fully offline on your local machine."
        }
      >
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--status-safe-fg)" }} />
        <span className="uppercase text-[11px]">
          {health?.telemetry_state || "Offline: telemetry off"}
        </span>
        <span className="opacity-50">/</span>
        <span className="text-[11px] uppercase tracking-wider text-[#ea580c]">
          ZERO CONTENT EGRESS
        </span>
      </div>

      {/* Model Spec */}
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[11px] font-semibold shadow-[2px_2px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "2px solid var(--border-hard)",
          color: "var(--text-primary)",
        }}
      >
        <Cpu className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
        <span>{modelName}</span>
        <span style={{ color: "var(--text-muted)" }}>({numCtxK}k ctx)</span>
      </div>

      {/* Trace Waterfall Launcher */}
      {trace.length > 0 && (
        <button
          onClick={() => setTraceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[11px] font-bold shadow-[2px_2px_0px_#2d0c30] transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "2px solid var(--border-hard)",
            color: "var(--text-primary)",
          }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
          <span>{trace.length} Spans</span>
        </button>
      )}
    </div>
  );
};
