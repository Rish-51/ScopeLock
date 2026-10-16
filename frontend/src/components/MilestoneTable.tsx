import React from "react";
import {
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

export const MilestoneTable: React.FC = () => {
  const { proposal, updateMilestone } = useProposalStore();

  if (!proposal) return null;

  const milestones = proposal.plan.milestones;
  const comm = proposal.commercial;

  const baseHoursMin = milestones.reduce((sum, m) => sum + m.hours_min, 0);
  const baseHoursMax = milestones.reduce((sum, m) => sum + m.hours_max, 0);

  const handleHoursChange = (
    id: string,
    field: "hours_min" | "hours_max",
    val: number
  ) => {
    updateMilestone(id, { [field]: Math.max(0, val) });
  };

  return (
    <div className="space-y-6">
      {/* Commercial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Base Hours</span>
          </span>
          <p className="text-base font-bold text-white font-mono">
            {baseHoursMin} - {baseHoursMax} hrs
          </p>
          <span className="text-[10px] text-zinc-500">Unweighted engineering</span>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Adjusted Effort</span>
          </span>
          <p className="text-base font-bold text-indigo-300 font-mono">
            {comm.hours_min_adjusted.toFixed(1)} - {comm.hours_max_adjusted.toFixed(1)} hrs
          </p>
          <span className="text-[10px] text-zinc-500">Tag heuristics applied</span>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
            <span>Rate & Contingency</span>
          </span>
          <p className="text-base font-bold text-zinc-200 font-mono">
            {comm.currency} {comm.hourly_rate} <span className="text-xs text-zinc-400">+{comm.contingency_percent}%</span>
          </p>
          <span className="text-[10px] text-zinc-500">Editable parameters</span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recommended Fixed</span>
          </span>
          <p className="text-base font-extrabold text-emerald-300 font-mono">
            {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500/80">Deterministic code</span>
        </div>
      </div>

      {/* Applied Multipliers Pill Bar */}
      {comm.multipliers_applied.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs">
          <span className="text-zinc-400 font-medium flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span>Multipliers Active:</span>
          </span>
          {comm.multipliers_applied.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 font-mono text-[11px]"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Milestones Breakdown ({milestones.length})
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            Editing hours live-updates commercial totals
          </span>
        </div>

        {milestones.map((m) => (
          <div
            key={m.id}
            className="p-4 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl space-y-3 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono font-bold text-xs text-white">
                    {m.id}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                </div>
                <p className="text-xs text-zinc-400">{m.objective}</p>
              </div>

              {/* Hours Inputs */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="text-zinc-500">Hours:</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_min}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_min", parseInt(e.target.value) || 0)
                  }
                  className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-white text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-zinc-500">-</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_max}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_max", parseInt(e.target.value) || 0)
                  }
                  className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-white text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-zinc-400">hrs</span>
              </div>
            </div>

            {/* Deliverables List */}
            <div className="pt-2 border-t border-zinc-900">
              <span className="text-[11px] font-medium text-zinc-500 block mb-1.5">
                Key Deliverables:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-300 font-mono">
                {m.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Linked Requirement IDs */}
            {m.requirement_ids.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                <span>Linked requirements:</span>
                <div className="flex gap-1">
                  {m.requirement_ids.map((rid) => (
                    <span
                      key={rid}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px]"
                    >
                      {rid}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Schedule Card */}
      <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Recommended Payment Schedule (30 / 40 / 30)</span>
          </h4>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            Total: {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comm.payment_schedule.map((step) => (
            <div
              key={step.label}
              className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">{step.label}</span>
                <span className="font-mono text-zinc-400">{step.percent}%</span>
              </div>
              <p className="text-sm font-bold font-mono text-emerald-300">
                {comm.currency} {step.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
