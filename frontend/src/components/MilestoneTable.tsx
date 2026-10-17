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
          className="rounded-xl p-3.5 space-y-1"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Base Hours</span>
          </span>
          <p className="text-base font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {baseHoursMin} - {baseHoursMax} hrs
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Unweighted engineering</span>
        </div>

        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Adjusted Effort</span>
          </span>
          <p className="text-base font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {comm.hours_min_adjusted.toFixed(1)} - {comm.hours_max_adjusted.toFixed(1)} hrs
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tag heuristics applied</span>
        </div>

        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Rate & Contingency</span>
          </span>
          <p className="text-base font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {comm.currency} {comm.hourly_rate} <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{comm.contingency_percent}%</span>
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Editable parameters</span>
        </div>

        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{
            backgroundColor: "var(--status-safe-bg)",
            border: "1px solid var(--status-safe-border)",
            color: "var(--status-safe-fg)",
          }}
        >
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--status-safe-fg)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
            <span>Recommended Fixed</span>
          </span>
          <p className="text-base font-extrabold font-mono" style={{ color: "var(--status-safe-fg)" }}>
            {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </p>
          <span className="text-[10px] opacity-80">Deterministic code</span>
        </div>
      </div>

      {/* Applied Multipliers Pill Bar */}
      {comm.multipliers_applied.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-xl text-xs"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span className="font-medium flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
            <Tag className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Multipliers Active:</span>
          </span>
          {comm.multipliers_applied.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full font-mono text-[11px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
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
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Milestones Breakdown ({milestones.length})
          </h3>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Editing hours live-updates commercial totals
          </span>
        </div>

        {milestones.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-xl space-y-3 transition-colors"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded font-mono font-bold text-xs"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {m.id}
                  </span>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {m.title}
                  </h4>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.objective}
                </p>
              </div>

              {/* Hours Inputs */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Hours:</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_min}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_min", parseInt(e.target.value) || 0)
                  }
                  className="w-12 rounded px-1.5 py-0.5 text-center outline-none"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-focus)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                />
                <span style={{ color: "var(--text-muted)" }}>-</span>
                <input
                  type="number"
                  min="1"
                  value={m.hours_max}
                  onChange={(e) =>
                    handleHoursChange(m.id, "hours_max", parseInt(e.target.value) || 0)
                  }
                  className="w-12 rounded px-1.5 py-0.5 text-center outline-none"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-focus)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                />
                <span style={{ color: "var(--text-secondary)" }}>hrs</span>
              </div>
            </div>

            {/* Deliverables List */}
            <div className="pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <span className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                Key Deliverables:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                {m.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--status-safe-fg)" }}
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Linked Requirement IDs */}
            {m.requirement_ids.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] pt-1" style={{ color: "var(--text-muted)" }}>
                <span>Linked requirements:</span>
                <div className="flex gap-1">
                  {m.requirement_ids.map((rid) => (
                    <span
                      key={rid}
                      className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
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
        className="p-4 rounded-xl space-y-3"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span>Recommended Payment Schedule (30 / 40 / 30)</span>
          </h4>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--status-safe-fg)" }}>
            Total: {comm.currency} {comm.recommended_fixed_price.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comm.payment_schedule.map((step) => (
            <div
              key={step.label}
              className="p-3 rounded-lg space-y-1"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{step.label}</span>
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>{step.percent}%</span>
              </div>
              <p className="text-sm font-bold font-mono" style={{ color: "var(--status-safe-fg)" }}>
                {comm.currency} {step.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
