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
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={resetWorkbench}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>New Brief</span>
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {proposal.model}
            </span>
            {req.stated_platform_or_stack.map((s) => (
              <span
                key={s}
                className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded"
              >
                {s}
              </span>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {req.project_title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">{req.one_line_summary}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTraceModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-zinc-700"
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Trace Waterfall</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
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
        <div className="lg:col-span-7 flex flex-col h-[750px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-2 gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("milestones")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "milestones"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Milestones & Price</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded">
                {proposal.plan.milestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("risks")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "risks"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>Technical Risks</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded">
                {risks.risks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("scope_guard")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "scope_guard"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Scope Guard</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded">
                {risks.scope_creep_warnings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("client_email")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "client_email"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
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
