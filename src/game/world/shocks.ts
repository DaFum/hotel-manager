export interface WorldShock {
  id: string;
  kind: "financial" | "supply" | "health" | "weather";
  severityBp: number;
  remainingMonths: number;
  causes: readonly string[];
}
export function maybeCreateShock(
  sequence: number,
  riskBp: number,
  rollBp: number,
  kind: WorldShock["kind"],
  causes: readonly string[],
): WorldShock | null {
  if (rollBp >= riskBp) return null;
  return {
    id: `shock.${sequence}.${kind}`,
    kind,
    severityBp: Math.max(500, Math.min(10_000, riskBp)),
    remainingMonths: 3 + Math.floor(riskBp / 2000),
    causes: [...causes].sort(),
  };
}
