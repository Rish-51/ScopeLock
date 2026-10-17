import React from "react";
import { Lock, ShieldCheck, Sparkles, Code2 } from "lucide-react";
import { useProposalStore } from "./store/proposalStore";
import { PrivacyBeacon } from "./components/PrivacyBeacon";
import { IngestionDropzone } from "./components/IngestionDropzone";
import { ProposalWorkbench } from "./components/ProposalWorkbench";
import { TraceInspectorModal } from "./components/TraceInspectorModal";
import { ExportModal } from "./components/ExportModal";

export const App: React.FC = () => {
  const { proposal } = useProposalStore();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Demo Banner if deployed on Render */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            <strong>Recorded Run Demo:</strong> This showcase replays an authentic execution recorded from local Gemma 4.
            Run ScopeLock locally to analyze your own NDA briefs offline.
          </span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  ScopeLock
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                  v0.1.0
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                NDA-Safe RFQ & Proposal Scoper
              </p>
            </div>
          </div>

          {/* Privacy Beacon & Status */}
          <div className="flex items-center gap-4">
            <PrivacyBeacon />

            <div className="hidden md:flex items-center gap-2 border-l border-zinc-800 pl-4">
              <a
                href="https://github.com/Rish-51/week2"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-mono"
                title="View GitHub Repository"
              >
                <Code2 className="w-4 h-4" />
                <span>Source</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {proposal ? <ProposalWorkbench /> : <IngestionDropzone />}
      </main>

      {/* Modals */}
      <TraceInspectorModal />
      <ExportModal />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 px-4 bg-zinc-950 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Client-Content Egress: Brief text strictly stays on your local machine.</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>DEV Hacktoberfest 2026</span>
            <span>•</span>
            <span>Apache-2.0</span>
            <span>•</span>
            <span>Gemma 4 via Ollama</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
