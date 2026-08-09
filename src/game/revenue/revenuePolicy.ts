export interface RatePlan {
  id: string;
  modifierBp: number;
  refundable: boolean;
  minimumStayNights: number;
  maximumStayNights: number | null;
  closedToArrival: boolean;
}
export interface RevenueRule {
  id: string;
  metric: "occupancy" | "leadTime" | "forecast";
  threshold: number;
  rateChangeBp: number;
  priority: number;
}
export interface RevenuePolicy {
  overbookingLimitRooms: number;
  managerAuthorityBp: number;
  ratePlans: RatePlan[];
  rules: RevenueRule[];
}
export interface RevenueDecision {
  rateMinor: number;
  causes: string[];
  ruleId: string | null;
}
export function createRevenuePolicy(): RevenuePolicy {
  return {
    overbookingLimitRooms: 0,
    managerAuthorityBp: 0,
    ratePlans: [
      {
        id: "flexible",
        modifierBp: 10_000,
        refundable: true,
        minimumStayNights: 1,
        maximumStayNights: null,
        closedToArrival: false,
      },
    ],
    rules: [],
  };
}
export function applyRatePlan(
  baseMinor: number,
  plan: RatePlan,
  nights: number,
): number {
  if (
    plan.closedToArrival ||
    nights < plan.minimumStayNights ||
    (plan.maximumStayNights !== null && nights > plan.maximumStayNights)
  )
    throw new Error("rate plan restrictions reject stay");
  return Math.round((baseMinor * plan.modifierBp) / 10_000);
}
export function automaticRate(
  baseMinor: number,
  metrics: Readonly<Record<string, number>>,
  policy: RevenuePolicy,
): RevenueDecision {
  const rule = [...policy.rules]
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .find(
      (candidate) => (metrics[candidate.metric] ?? 0) >= candidate.threshold,
    );
  if (!rule || policy.managerAuthorityBp === 0)
    return {
      rateMinor: baseMinor,
      causes: ["manager policy made no change"],
      ruleId: null,
    };
  const bounded = Math.max(
    -policy.managerAuthorityBp,
    Math.min(policy.managerAuthorityBp, rule.rateChangeBp),
  );
  return {
    rateMinor: Math.max(
      1,
      Math.round((baseMinor * (10_000 + bounded)) / 10_000),
    ),
    causes: [
      `${rule.metric} reached ${metrics[rule.metric] ?? 0}`,
      `bounded authority ${policy.managerAuthorityBp}bp`,
    ],
    ruleId: rule.id,
  };
}
export function displacementCostMinor(
  rooms: number,
  alternativeRateMinor: number,
  transportMinor: number,
  compensationMinor: number,
): number {
  return rooms * (alternativeRateMinor + transportMinor + compensationMinor);
}
