import React from "react";
import { Lock, ShieldCheck, Sparkles, Code2, ArrowLeft } from "lucide-react";
import { useProposalStore } from "./store/proposalStore";
import { PrivacyBeacon } from "./components/PrivacyBeacon";
import { IngestionDropzone } from "./components/IngestionDropzone";
import { ProposalWorkbench } from "./components/ProposalWorkbench";
import { TraceInspectorModal } from "./components/TraceInspectorModal";
import { ExportModal } from "./components/ExportModal";

export const App: React.FC = () => {
  const { proposal, resetWorkbench } = useProposalStore();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
    >
      {/* Top Demo Banner if deployed on Render */}
      {isDemoMode && (
        <div
          className="px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 border-b"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
          <span>
            <strong>Recorded Run Demo:</strong> This showcase replays an authentic execution recorded from local Gemma 4.
            Run ScopeLock locally to analyze your own NDA briefs offline.
          </span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b-2"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-hard)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={resetWorkbench}
              className="flex items-center gap-3 text-left cursor-pointer group transition-transform"
              title="ScopeLock Home (Return to Upload)"
            >
              <div
                className="w-9 h-9 rounded-[3px] flex items-center justify-center shadow-[2px_2px_0px_#2d0c30] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_#2d0c30] transition-all"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "2px solid var(--border-hard)",
                }}
              >
                <Lock className="w-5 h-5" style={{ color: "var(--status-safe-fg)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-extrabold text-base tracking-tight font-sans group-hover:text-[#ea580c] transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ScopeLock
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold shadow-[1px_1px_0px_#2d0c30]"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-hard)",
                    }}
                  >
                    v0.1.0
                  </span>
                </div>
                <p
                  className="text-[10px] font-mono uppercase tracking-wider hidden sm:block font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  NDA-Safe RFQ & Proposal Scoper
                </p>
              </div>
            </button>

            {/* Back button in header when proposal is open */}
            {proposal && (
              <button
                onClick={resetWorkbench}
                className="ml-2 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                style={{
                  backgroundColor: "var(--accent-primary-bg)",
                  color: "var(--accent-primary-fg)",
                  border: "2px solid var(--border-hard)",
                }}
                title="Return to upload / new brief"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO UPLOAD</span>
              </button>
            )}
          </div>

          {/* Privacy Beacon & Status */}
          <div className="flex items-center gap-4">
            <PrivacyBeacon />

            <div
              className="hidden md:flex items-center gap-2 pl-4 border-l-2"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <a
                href="https://github.com/Rish-51/week2"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-[2px] transition-all flex items-center gap-1.5 text-xs font-mono font-bold shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                style={{
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1.5px solid var(--border-hard)",
                }}
                title="View GitHub Repository"
              >
                <Code2 className="w-4 h-4" />
                <span>SOURCE</span>
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
      <footer
        className="py-6 px-4 text-xs border-t-2"
        style={{
          backgroundColor: "var(--bg-canvas)",
          borderColor: "var(--border-hard)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <span>Zero Client-Content Egress: Brief text strictly stays on your local machine.</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
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
