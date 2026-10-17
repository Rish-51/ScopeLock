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
      <div className="p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={resetWorkbench}
              className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>New Brief</span>
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--status-safe-bg)', color: 'var(--status-safe-fg)', borderColor: 'var(--status-safe-border)' }}>
              {proposal.model}
            </span>
            {req.stated_platform_or_stack.map((s) => (
              <span
                key={s}
                className="text-[11px] font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {s}
              </span>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {req.project_title}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{req.one_line_summary}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTraceModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Trace Waterfall</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary-bg)', color: 'var(--accent-primary-fg)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-bg)';
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
        <div className="lg:col-span-7 flex flex-col h-[750px] rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {/* Tab Navigation */}
          <div className="flex border-b p-2 gap-1.5 overflow-x-auto" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
            <button
              onClick={() => setActiveTab("milestones")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "milestones"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={activeTab === "milestones" ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' } : {}}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--status-safe-fg)' }} />
              <span>Milestones & Price</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>
                {proposal.plan.milestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("risks")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "risks"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={activeTab === "risks" ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' } : {}}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>Technical Risks</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>
                {risks.risks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("scope_guard")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "scope_guard"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={activeTab === "scope_guard" ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' } : {}}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Scope Guard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>
                {risks.scope_creep_warnings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("client_email")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "client_email"
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={activeTab === "client_email" ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' } : {}}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
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
