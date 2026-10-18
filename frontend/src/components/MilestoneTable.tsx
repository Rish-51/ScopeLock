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
        <div
          className="rounded-[2px] p-3.5 space-y-1 shadow-[2px_2px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Base Hours</span>
          </span>
          <p className="text-base font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>
            {baseHoursMin} - {baseHoursMax} hrs
          </p>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Unweighted engineering</span>
        </div>

        <div
          className="rounded-[2px] p-3.5 space-y-1 shadow-[2px_2px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Adjusted Effort</span>
          </span>
          <p className="text-base font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>
            {comm.hours_min_adjusted.toFixed(1)} - {comm.hours_max_adjusted.toFixed(1)} hrs
          </p>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Tag heuristics applied</span>
        </div>

        <div
          className="rounded-[2px] p-3.5 space-y-1 shadow-[2px_2px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Rate & Buffer</span>
          </span>
          <p className="text-base font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>
            {comm.currency} {comm.hourly_rate} <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>+{comm.contingency_percent}%</span>
          </p>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Deterministic parameters</span>
        </div>

        <div
          className="rounded-[2px] p-3.5 space-y-1 shadow-[3px_3px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--status-safe-bg)",
            border: "2px solid var(--border-hard)",
            color: "var(--status-safe-fg)",
          }}
        >
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--status-safe-fg)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
            <span>Fixed Price</span>
          </span>
          <p className="text-base font-extrabold font-mono" style={{ color: "var(--status-safe-fg)" }}>
            {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </p>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-90">Deterministic code</span>
        </div>
      </div>

      {/* Applied Multipliers Pill Bar */}
      {comm.multipliers_applied.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-[2px] text-xs shadow-[2px_2px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "2px solid var(--border-hard)",
          }}
        >
          <span className="font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
            <Tag className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Multipliers Active:</span>
          </span>
          {comm.multipliers_applied.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-[2px] font-mono text-[11px] font-bold shadow-[1px_1px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1.5px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Milestones Breakdown ({milestones.length})
          </h3>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Editing hours live-updates commercial totals
          </span>
        </div>

        {milestones.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-[2px] space-y-3 shadow-[3px_3px_0px_#2d0c30] transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "2px solid var(--border-hard)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-[2px] font-mono font-bold text-xs shadow-[1px_1px_0px_#2d0c30]"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1.5px solid var(--border-hard)",
                    }}
                  >
                    {m.id}
                  </span>
                  <h4 className="text-sm font-bold font-sans" style={{ color: "var(--text-primary)" }}>
                    {m.title}
                  </h4>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.objective}
                </p>
              </div>

              {/* Hours Inputs */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold shadow-[2px_2px_0px_#2d0c30]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "2px solid var(--border-hard)",
                }}
              >
                <span style={{ color: "var(--text-primary)" }}>Hours:</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_min}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_min", parseInt(e.target.value) || 0)
                  }
                  className="w-12 rounded-[1px] px-1.5 py-0.5 text-center font-bold outline-none border border-[#2d0c30]"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                />
                <span style={{ color: "var(--text-primary)" }}>-</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_max}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_max", parseInt(e.target.value) || 0)
                  }
                  className="w-12 rounded-[1px] px-1.5 py-0.5 text-center font-bold outline-none border border-[#2d0c30]"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                />
                <span style={{ color: "var(--text-primary)" }}>hrs</span>
              </div>
            </div>

            {/* Deliverables List */}
            <div className="pt-2 border-t-2" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                Key Deliverables:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                {m.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                      style={{ backgroundColor: "var(--accent-primary-bg)", border: "1px solid var(--border-hard)" }}
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Linked Requirement IDs */}
            {m.requirement_ids.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] pt-1 font-mono font-bold" style={{ color: "var(--text-secondary)" }}>
                <span>Linked requirements:</span>
                <div className="flex gap-1">
                  {m.requirement_ids.map((rid) => (
                    <span
                      key={rid}
                      className="px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold shadow-[1px_1px_0px_#2d0c30]"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-hard)",
                        color: "var(--text-primary)",
                      }}
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
      <div
        className="p-4 rounded-[2px] space-y-3 shadow-[3px_3px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
            <span>Recommended Payment Schedule (30 / 40 / 30)</span>
          </h4>
          <span className="text-xs font-mono font-extrabold" style={{ color: "var(--status-safe-fg)" }}>
            Total: {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comm.payment_schedule.map((step) => (
            <div
              key={step.label}
              className="p-3 rounded-[2px] space-y-1 shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "2px solid var(--border-hard)",
              }}
            >
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>{step.label}</span>
                <span className="font-bold" style={{ color: "var(--text-muted)" }}>{step.percent}%</span>
              </div>
              <p className="text-sm font-extrabold font-mono" style={{ color: "var(--status-safe-fg)" }}>
                {comm.currency} {step.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
