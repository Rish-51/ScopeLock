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
      } catch (err) {
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
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {/* Privacy Beacon */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          isTelemetryOn
            ? "text-emerald-300"
            : "text-emerald-200"
        }`}
        style={{
          backgroundColor: 'var(--status-safe-bg)',
          borderColor: 'var(--status-safe-border)'
        }}
        title={
          isTelemetryOn
            ? "Sentry metadata-only telemetry enabled. Client brief text never leaves this machine."
            : "Telemetry disabled. System is operating fully offline on your local machine."
        }
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--status-safe-fg)' }}></span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--status-safe-fg)' }} />
        <span className="font-medium tracking-wide" style={{ color: 'var(--text-primary)' }}>
          {health?.telemetry_state || "Offline: telemetry off"}
        </span>
        <span className="text-zinc-500">|</span>
        <span className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--status-safe-fg)' }}>
          Zero Content Egress
        </span>
      </div>

      {/* Model Spec */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border font-mono text-[11px]" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <Cpu className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
        <span>{modelName}</span>
        <span className="text-zinc-500">({numCtxK}k ctx)</span>
      </div>

      {/* Trace Waterfall Launcher */}
      {trace.length > 0 && (
        <button
          onClick={() => setTraceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>{trace.length} Spans</span>
        </button>
      )}
    </div>
  );
};
