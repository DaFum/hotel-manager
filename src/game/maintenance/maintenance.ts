import type { EngineeringAsset } from "../engineering/assets";

export type AssetStatus = "operational" | "failed" | "repairing";

/** Condition is basis points of as-new quality: 10000 is factory fresh. */
export interface Asset {
  condition: number;
  status: AssetStatus;
  /** Running minutes since the last preventive service. */
  minutesSinceService?: number;
}

/** One repair needs two technician hours; anything less leaves it in progress. */
export const REPAIR_MINUTES = 120;
export const REPAIRED_CONDITION = 5000;
/** A preventive service needs three technician hours. */
export const SERVICE_MINUTES = 180;
/** Condition a preventive service gives back, in basis points. */
export const SERVICE_RECOVERY_BP = 2500;

export function degradeAsset(a: Asset, minutes: number): Asset {
  return {
    ...a,
    condition: Math.max(0, a.condition - Math.floor(minutes / 144)),
    minutesSinceService: (a.minutesSinceService ?? 0) + Math.max(0, minutes),
  };
}

export function repairAsset(a: Asset, technicianMinutes: number): Asset {
  if (technicianMinutes < REPAIR_MINUTES) return { ...a, status: "repairing" };
  return {
    condition: Math.max(a.condition, REPAIRED_CONDITION),
    status: "operational",
  };
}

/**
 * Planned service, not a breakdown fix: it costs technician time before
 * anything has failed and buys back condition the asset has not yet lost.
 */
export function serviceAsset(a: Asset, technicianMinutes: number): Asset {
  if (technicianMinutes < SERVICE_MINUTES) return a;
  return {
    ...a,
    condition: Math.min(10000, a.condition + SERVICE_RECOVERY_BP),
    status: a.status === "operational" ? "operational" : a.status,
    minutesSinceService: 0,
  };
}

/**
 * Maintenance stores condition in basis points; engineering capacity rules
 * work on a 0..100 scale. Converting in one place keeps the two units from
 * being mixed at call sites.
 */
export function toEngineeringAsset(a: Asset, rated: number): EngineeringAsset {
  return { rated, condition: Math.round(a.condition / 100) };
}
