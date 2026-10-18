import type {
  Milestone,
  Requirement,
  CommercialSummary,
  PaymentStep,
  ComplexityTag,
} from "../types/proposal";

export const DEFAULT_MULTIPLIERS: Record<string, number> = {
  THIRD_PARTY_API: 1.35,
  PAYMENTS: 1.40,
  AUTH: 1.25,
  COMPLIANCE: 1.50,
  REALTIME: 1.30,
  MOBILE_RELEASE: 1.20,
  AI_ML: 1.40,
  NONE: 1.0,
};

export const DEFAULT_SCHEDULE = [
  { label: "Deposit", percent: 30 },
  { label: "Mid-point demo", percent: 40 },
  { label: "Final sign-off", percent: 30 },
];

export function computePricing(
  milestones: Milestone[],
  requirements: Requirement[],
  hourlyRate = 120.0,
  currency = "USD",
  contingencyPercent = 20,
  multipliersOverride?: Record<string, number>,
  paymentScheduleOverride?: Array<{ label: string; percent: number }>
): CommercialSummary {
  const multipliers = { ...DEFAULT_MULTIPLIERS, ...(multipliersOverride || {}) };

  const reqTagMap = new Map<string, ComplexityTag[]>();
  for (const r of requirements) {
    reqTagMap.set(r.id, r.complexity_tags || []);
  }

  let hoursMinAdjustedTotal = 0.0;
  let hoursMaxAdjustedTotal = 0.0;
  const tagsApplied = new Set<string>();

  for (const m of milestones) {
    const mTags: string[] = [];
    for (const reqId of m.requirement_ids || []) {
      const tags = reqTagMap.get(reqId) || [];
      for (const t of tags) {
        mTags.push(t);
      }
    }

    let mMult = 1.0;
    if (mTags.length > 0) {
      mMult = Math.max(...mTags.map((t) => multipliers[t] ?? 1.0));
      for (const t of mTags) {
        if ((multipliers[t] ?? 1.0) > 1.0) {
          tagsApplied.add(t);
        }
      }
    }

    hoursMinAdjustedTotal += (m.hours_min || 0) * mMult;
    hoursMaxAdjustedTotal += (m.hours_max || 0) * mMult;
  }

  hoursMinAdjustedTotal = Number(hoursMinAdjustedTotal.toFixed(2));
  hoursMaxAdjustedTotal = Number(hoursMaxAdjustedTotal.toFixed(2));

  const priceLow = Number((hoursMinAdjustedTotal * hourlyRate).toFixed(2));
  const contingencyFactor = 1.0 + contingencyPercent / 100.0;
  const recommendedFixedPrice = Number(
    (hoursMaxAdjustedTotal * hourlyRate * contingencyFactor).toFixed(2)
  );
  const priceHigh = recommendedFixedPrice;

  const scheduleSpecs = paymentScheduleOverride || DEFAULT_SCHEDULE;
  const paymentSchedule: PaymentStep[] = [];
  let runningAmount = 0.0;

  for (let i = 0; i < scheduleSpecs.length; i++) {
    const step = scheduleSpecs[i];
    const percent = step.percent;
    let amount: number;

    if (i === scheduleSpecs.length - 1) {
      amount = Number((recommendedFixedPrice - runningAmount).toFixed(2));
    } else {
      amount = Number((recommendedFixedPrice * (percent / 100.0)).toFixed(2));
      runningAmount += amount;
    }

    paymentSchedule.push({
      label: step.label,
      percent,
      amount,
    });
  }

  const multipliersApplied = Array.from(tagsApplied)
    .filter((t) => t in multipliers)
    .sort()
    .map((tag) => `${tag}: ${multipliers[tag]}x`);

  return {
    currency,
    hourly_rate: hourlyRate,
    hours_min_adjusted: hoursMinAdjustedTotal,
    hours_max_adjusted: hoursMaxAdjustedTotal,
    contingency_percent: contingencyPercent,
    price_low: priceLow,
    price_high: priceHigh,
    recommended_fixed_price: recommendedFixedPrice,
    payment_schedule: paymentSchedule,
    multipliers_applied: multipliersApplied,
  };
}
