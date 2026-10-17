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
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            : "bg-emerald-950/60 border-emerald-500/60 text-emerald-200"
        }`}
        title={
          isTelemetryOn
            ? "Sentry metadata-only telemetry enabled. Client brief text never leaves this machine."
            : "Telemetry disabled. System is operating fully offline on your local machine."
        }
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium tracking-wide">
          {health?.telemetry_state || "Offline: telemetry off"}
        </span>
        <span className="text-zinc-500">|</span>
        <span className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
          Zero Content Egress
        </span>
      </div>

      {/* Model Spec */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
        <Cpu className="w-3 h-3 text-zinc-400" />
        <span>{modelName}</span>
        <span className="text-zinc-500">({numCtxK}k ctx)</span>
      </div>

      {/* Trace Waterfall Launcher */}
      {trace.length > 0 && (
        <button
          onClick={() => setTraceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>{trace.length} Spans</span>
        </button>
      )}
    </div>
  );
};
