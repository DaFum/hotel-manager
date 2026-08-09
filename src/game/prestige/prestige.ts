import { assertScore } from "../domain/units";

/**
 * Standing, not score. Prestige opens doors — a bank returns the call, an
 * owner shows the property first — but it never creates cash or profit by
 * itself, so it cannot become the number the game is won on.
 */
export interface PrestigeState {
  personal: number;
  company: number;
  causes: string[];
}

/** At most a full percentage point off the spread, and never negative. */
export function financingAccessBonusBasisPoints(prestige: number): number {
  return assertScore(clampPrestige(prestige), "prestige") * 10;
}

export function propertyAccessScore(prestige: number): number {
  return assertScore(clampPrestige(prestige), "prestige");
}

function clampPrestige(prestige: number): number {
  if (!Number.isSafeInteger(prestige)) throw new Error("invalid prestige");
  return Math.max(0, Math.min(100, prestige));
}
