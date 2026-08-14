import { compareIds } from "../domain/ids";
import {
  createRevenueManagerAttributes,
  type RevenueManagerAttributes,
} from "./revenueManagerAttributes";

export interface RatePlan {
  id: string;
  modifierBp: number;
  refundable: boolean;
  minimumStayNights: number;
  maximumStayNights: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  rateFloorMinor: number;
  rateCeilingMinor: number;
  closedChannelIds: string[];
  minimumAdvanceBookingNights: number;
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
  rateFloorMinor: number;
  rateCeilingMinor: number;
  targetOccupancyBasisPoints: number;
  prioritizedSegmentIds: string[];
  channelCostLimitBasisPoints: number;
  managerAttributes: RevenueManagerAttributes;
}
export type RevenuePolicyChange = Partial<RevenuePolicy>;
export interface RevenueDecision {
  rateMinor: number;
  causes: string[];
  ruleId: string | null;
}
export function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} must be whole and non-negative`);
  return value;
}
export function basisPoints(value: number, label: string): number {
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
        closedToDeparture: false,
        rateFloorMinor: 0,
        rateCeilingMinor: Number.MAX_SAFE_INTEGER,
        closedChannelIds: [],
        minimumAdvanceBookingNights: 0,
      },
    ],
    rules: [],
    rateFloorMinor: 0,
    rateCeilingMinor: Number.MAX_SAFE_INTEGER,
    targetOccupancyBasisPoints: 7500,
    prioritizedSegmentIds: [],
    channelCostLimitBasisPoints: 10_000,
    managerAttributes: createRevenueManagerAttributes(),
  };
}

function validateRatePlan(plan: RatePlan): RatePlan {
  if (!plan.id) throw new Error("a rate plan id is required");
  basisPoints(plan.modifierBp, "rate modifier");
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
  nonNegativeInteger(plan.rateFloorMinor, "rate floor");
  nonNegativeInteger(plan.rateCeilingMinor, "rate ceiling");
  if (plan.rateFloorMinor > plan.rateCeilingMinor)
    throw new Error("rate floor cannot exceed rate ceiling");
  nonNegativeInteger(
    plan.minimumAdvanceBookingNights,
    "minimum advance booking nights",
  );
  return {
    ...plan,
    closedChannelIds: [...new Set(plan.closedChannelIds)].sort(compareIds),
  };
}

export function updateRevenuePolicy(
  current: RevenuePolicy,
  change: RevenuePolicyChange,
): RevenuePolicy {
  const candidate: RevenuePolicy = {
    ...current,
    ...change,
    ratePlans: (change.ratePlans ?? current.ratePlans).map(validateRatePlan),
    rules: (change.rules ?? current.rules).map((rule) => ({ ...rule })),
    prioritizedSegmentIds: [
      ...(change.prioritizedSegmentIds ?? current.prioritizedSegmentIds),
    ],
    managerAttributes: createRevenueManagerAttributes(
      change.managerAttributes ?? current.managerAttributes,
    ),
  };
  nonNegativeInteger(candidate.overbookingLimitRooms, "overbooking limit");
  basisPoints(candidate.managerAuthorityBp, "manager authority");
  nonNegativeInteger(candidate.rateFloorMinor, "rate floor");
  nonNegativeInteger(candidate.rateCeilingMinor, "rate ceiling");
  if (candidate.rateFloorMinor > candidate.rateCeilingMinor)
    throw new Error("rate floor cannot exceed rate ceiling");
  basisPoints(candidate.targetOccupancyBasisPoints, "target occupancy");
  basisPoints(candidate.channelCostLimitBasisPoints, "channel cost limit");
  for (const rule of candidate.rules) {
    if (!rule.id) throw new Error("a revenue rule id is required");
    if (!Number.isSafeInteger(rule.threshold))
      throw new Error("rule threshold must be whole");
    basisPoints(Math.abs(rule.rateChangeBp), "rate change");
    nonNegativeInteger(rule.priority, "rule priority");
  }
  return candidate;
}
export function applyRatePlan(
  baseMinor: number,
  plan: RatePlan,
  nights: number,
  context: { leadDays?: number; channelId?: string } = {},
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
    plan.closedToDeparture ||
    nights < plan.minimumStayNights ||
    (plan.maximumStayNights !== null && nights > plan.maximumStayNights) ||
    (context.leadDays ?? 0) < plan.minimumAdvanceBookingNights ||
    (context.channelId !== undefined &&
      plan.closedChannelIds.includes(context.channelId))
  )
    throw new Error("rate plan restrictions reject stay");
  const result = Number(
    (BigInt(baseMinor) * BigInt(plan.modifierBp) + 5_000n) / 10_000n,
  );
  if (!Number.isSafeInteger(result)) throw new Error("rate plan overflow");
  return Math.max(plan.rateFloorMinor, Math.min(plan.rateCeilingMinor, result));
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
  const strategyAuthority = Math.trunc(
    (policy.managerAuthorityBp * policy.managerAttributes.PricingStrategy) / 50,
  );
  const authority = Math.min(10_000, strategyAuthority);
  const bounded = Math.max(-authority, Math.min(authority, rule.rateChangeBp));
  if (!Number.isSafeInteger(baseMinor) || baseMinor < 0)
    throw new Error("baseMinor must be a safe non-negative integer");

  const calculatedRate =
    (BigInt(baseMinor) * BigInt(10_000 + bounded)) / 10_000n;
  const rateMinorNum = Number(calculatedRate);
  if (!Number.isSafeInteger(rateMinorNum))
    throw new Error("rate calculation overflowed safe integer");

  return {
    rateMinor: Math.max(1, rateMinorNum),
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
