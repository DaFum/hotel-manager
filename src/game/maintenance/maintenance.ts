export type AssetStatus = "operational" | "failed" | "repairing";

/** Condition is basis points of as-new quality: 10000 is factory fresh. */
export interface Asset {
  condition: number;
  status: AssetStatus;
}

/** One repair needs two technician hours; anything less leaves it in progress. */
export const REPAIR_MINUTES = 120;
export const REPAIRED_CONDITION = 5000;

export function degradeAsset(a: Asset, minutes: number): Asset {
  return {
    ...a,
    condition: Math.max(0, a.condition - Math.floor(minutes / 144)),
  };
}

export function repairAsset(a: Asset, technicianMinutes: number): Asset {
  if (technicianMinutes < REPAIR_MINUTES) return { ...a, status: "repairing" };
  return {
    condition: Math.max(a.condition, REPAIRED_CONDITION),
    status: "operational",
  };
}
