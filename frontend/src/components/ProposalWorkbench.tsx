import React from "react";
import {
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Mail,
  Download,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { useProposalStore } from "../store/proposalStore";
import { BriefPane } from "./BriefPane";
import { MilestoneTable } from "./MilestoneTable";
import { RiskPanel } from "./RiskPanel";
import { ScopeGuard } from "./ScopeGuard";
import { ClientEmail } from "./ClientEmail";

export const ProposalWorkbench: React.FC = () => {
  const {
    proposal,
    activeTab,
    setActiveTab,
    setTraceModalOpen,
    setExportModalOpen,
    resetWorkbench,
  } = useProposalStore();

  if (!proposal) return null;

  const req = proposal.requirements;
  const risks = proposal.risks;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Workbench Header */}
      <div
        className="p-5 rounded-[3px] shadow-[4px_4px_0px_#2d0c30] flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={resetWorkbench}
              className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1.5px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>NEW BRIEF</span>
            </button>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--status-safe-bg)",
                border: "1.5px solid var(--border-hard)",
                color: "var(--status-safe-fg)",
              }}
            >
              {proposal.model}
            </span>
            {req.stated_platform_or_stack.map((s) => (
              <span
                key={s}
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0px_#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1.5px solid var(--border-hard)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans"
            style={{ color: "var(--text-primary)" }}
          >
            {req.project_title}
          </h1>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {req.one_line_summary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTraceModalOpen(true)}
            className="px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "var(--accent-secondary-bg)",
              border: "2px solid var(--border-hard)",
              color: "var(--accent-secondary-fg)",
            }}
          >
            <Activity className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <span>Trace Waterfall</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_#2d0c30] hover:shadow-[4px_4px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "var(--accent-primary-bg)",
              color: "var(--accent-primary-fg)",
              border: "2px solid var(--border-hard)",
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export Proposal</span>
          </button>
        </div>
      </div>

      {/* Main Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[750px]">
        {/* Left: Brief & Grounding (5 columns) */}
        <div className="lg:col-span-5 h-[750px]">
          <BriefPane />
        </div>

        {/* Right: Tabbed Scoping Workspace (7 columns) */}
        <div
          className="lg:col-span-7 flex flex-col h-[750px] rounded-[3px] overflow-hidden shadow-[4px_4px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "2px solid var(--border-hard)",
          }}
        >
          {/* Tab Navigation */}
          <div
            className="flex p-2 gap-1.5 overflow-x-auto border-b-2"
            style={{
              borderColor: "var(--border-hard)",
              backgroundColor: "var(--bg-canvas)",
            }}
          >
            <button
              onClick={() => setActiveTab("milestones")}
              className="px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "milestones" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "milestones" ? "var(--text-primary)" : "var(--text-secondary)",
                border: activeTab === "milestones" ? "2px solid var(--border-hard)" : "2px solid transparent",
                boxShadow: activeTab === "milestones" ? "2px 2px 0px #2d0c30" : "none",
              }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
              <span>Milestones & Price</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] border border-[#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {proposal.plan.milestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("risks")}
              className="px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "risks" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "risks" ? "var(--text-primary)" : "var(--text-secondary)",
                border: activeTab === "risks" ? "2px solid var(--border-hard)" : "2px solid transparent",
                boxShadow: activeTab === "risks" ? "2px 2px 0px #2d0c30" : "none",
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-hover)" }} />
              <span>Technical Risks</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] border border-[#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {risks.risks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("scope_guard")}
              className="px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "scope_guard" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "scope_guard" ? "var(--text-primary)" : "var(--text-secondary)",
                border: activeTab === "scope_guard" ? "2px solid var(--border-hard)" : "2px solid transparent",
                boxShadow: activeTab === "scope_guard" ? "2px 2px 0px #2d0c30" : "none",
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-hover)" }} />
              <span>Scope Guard</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] border border-[#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {risks.scope_creep_warnings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("client_email")}
              className="px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === "client_email" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "client_email" ? "var(--text-primary)" : "var(--text-secondary)",
                border: activeTab === "client_email" ? "2px solid var(--border-hard)" : "2px solid transparent",
                boxShadow: activeTab === "client_email" ? "2px 2px 0px #2d0c30" : "none",
              }}
            >
              <Mail className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
              <span>Client Email</span>
            </button>
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "milestones" && <MilestoneTable />}
            {activeTab === "risks" && <RiskPanel />}
            {activeTab === "scope_guard" && <ScopeGuard />}
            {activeTab === "client_email" && <ClientEmail />}
          </div>
        </div>
      </div>
    </div>
  );
};
