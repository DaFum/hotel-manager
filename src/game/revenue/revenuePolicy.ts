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
function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} must be whole and non-negative`);
  return value;
}
function basisPoints(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000)
    throw new Error(`${label} must be 0..10000 basis points`);
  return value;
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
  nonNegativeInteger(baseMinor, "base rate");
  basisPoints(plan.modifierBp, "rate modifier");
  if (!Number.isSafeInteger(nights) || nights <= 0)
    throw new Error("stay nights must be a positive whole number");
  if (
    !Number.isSafeInteger(plan.minimumStayNights) ||
    plan.minimumStayNights <= 0
  )
    throw new Error("minimum stay must be a positive whole number");
  if (
    plan.maximumStayNights !== null &&
    (!Number.isSafeInteger(plan.maximumStayNights) ||
      plan.maximumStayNights < plan.minimumStayNights)
  )
    throw new Error("maximum stay must be whole and at least the minimum");
  if (
    plan.closedToArrival ||
    nights < plan.minimumStayNights ||
    (plan.maximumStayNights !== null && nights > plan.maximumStayNights)
  )
    throw new Error("rate plan restrictions reject stay");
  const result = Number(
    (BigInt(baseMinor) * BigInt(plan.modifierBp) + 5_000n) / 10_000n,
  );
  if (!Number.isSafeInteger(result)) throw new Error("rate plan overflow");
  return result;
}
export function automaticRate(
  baseMinor: number,
  metrics: Readonly<Record<string, number>>,
  policy: RevenuePolicy,
): RevenueDecision {
  const rule = [...policy.rules]
    .sort((a, b) => a.priority - b.priority || compareIds(a.id, b.id))
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
  nonNegativeInteger(rooms, "displaced rooms");
  nonNegativeInteger(alternativeRateMinor, "alternative rate");
  nonNegativeInteger(transportMinor, "transport cost");
  nonNegativeInteger(compensationMinor, "compensation");
  const total =
    BigInt(rooms) *
    BigInt(alternativeRateMinor + transportMinor + compensationMinor);
  const result = Number(total);
  if (!Number.isSafeInteger(result))
    throw new Error("displacement cost overflow");
  return result;
}
import { compareIds } from "../domain/ids";
