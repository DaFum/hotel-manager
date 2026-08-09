import { type EngineeringAsset } from "./assets";

/** Plant is serviced every ninety days of running time. */
export const SERVICE_INTERVAL_MINUTES = 90 * 1440;
/** A preventive service costs three percent of replacement value. */
export const PREVENTIVE_COST_BP = 300;
/** Below this condition an asset is a replacement candidate. */
export const REPLACEMENT_CONDITION = 30;
/** A repair worth this much of a new unit is not worth doing. */
export const REPAIR_WRITE_OFF_BP = 5000;

export function isDueForService(i: { minutesSinceService: number }): boolean {
  return i.minutesSinceService >= SERVICE_INTERVAL_MINUTES;
}

export function preventiveCostMinor(i: { replacementMinor: number }): number {
  return Math.round(
    (Math.max(0, i.replacementMinor) * PREVENTIVE_COST_BP) / 10000,
  );
}

export interface ReplacementDecision {
  replace: boolean;
  reason: string;
}

/**
 * Replacement is a two-sided call: the asset has to be worn out *and* the
 * repair has to cost enough of a new unit to be wasted money. Either alone
 * keeps the old machine running.
 */
export function replacementDecision(
  asset: EngineeringAsset,
  cost: { replacementMinor: number; repairMinor: number },
): ReplacementDecision {
  if (asset.condition >= REPLACEMENT_CONDITION)
    return { replace: false, reason: "condition still serviceable" };
  const writeOffMinor = Math.round(
    (cost.replacementMinor * REPAIR_WRITE_OFF_BP) / 10000,
  );
  if (cost.repairMinor < writeOffMinor)
    return { replace: false, reason: "repair is cheaper than replacement" };
  return { replace: true, reason: "worn out and uneconomic to repair" };
}

export interface EngineeringWork {
  id: string;
  status: "failed" | "operational";
  condition: number;
  minutesSinceService: number;
  replacementMinor: number;
  repairMinor: number;
}

export function prioritizeEngineering(
  work: readonly EngineeringWork[],
): EngineeringWork[] {
  return [...work].sort((a, b) => {
    const priority = (x: EngineeringWork) =>
      x.status === "failed"
        ? 0
        : replacementDecision({ rated: 0, condition: x.condition }, x).replace
          ? 1
          : isDueForService(x)
            ? 2
            : 3;
    return (
      priority(a) - priority(b) ||
      a.condition - b.condition ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    );
  });
}
