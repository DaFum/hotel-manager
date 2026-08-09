/**
 * What the player is allowed to know about next month's market. A forecast is
 * always a band, never a number: research narrows it, but no amount of money
 * buys certainty, so a plan has to survive being wrong.
 */

export interface ForecastBand {
  low: number;
  base: number;
  high: number;
}

/** The best information quality money can buy, on a 0-100 scale. */
export const MAX_INFORMATION_QUALITY = 100;
/** Spread of a blind forecast, in basis points of the base figure. */
const BLIND_SPREAD_BP = 4000;
/** Spread that survives even perfect research, in basis points. */
const RESIDUAL_SPREAD_BP = 200;
/** What one market-research report costs, in Pfennig. */
export const REPORT_COST_MINOR = 150_000;
/** Research spend at which quality reaches about 63 of its 100 points. */
const QUALITY_SCALE_MINOR = REPORT_COST_MINOR * 2;

/**
 * The band around a base figure at a given information quality. Bounds are
 * whole units and ordered, so the UI can render them without re-checking.
 */
export function forecastBand(base: number, quality: number): ForecastBand {
  if (!Number.isSafeInteger(base) || base < 0)
    throw new Error("invalid forecast base");
  if (!Number.isFinite(quality)) throw new Error("invalid quality");
  const q = Math.min(MAX_INFORMATION_QUALITY, Math.max(0, quality));
  const spread = Math.max(
    Math.round((base * RESIDUAL_SPREAD_BP) / 10000),
    Math.round(
      (base * (MAX_INFORMATION_QUALITY - q) * BLIND_SPREAD_BP) /
        (MAX_INFORMATION_QUALITY * 10000),
    ),
  );
  return { low: Math.max(0, base - spread), base, high: base + spread };
}

/** What a run of reports costs, in whole Pfennig. */
export function reportCostMinor(reports: number): number {
  if (!Number.isSafeInteger(reports) || reports < 0)
    throw new Error("invalid report count");
  return reports * REPORT_COST_MINOR;
}

/**
 * The quality that a level of research spend buys. Saturating: the second
 * report tells the player far less than the first, so research is a decision
 * with a stopping point rather than a tax to pay every month.
 */
export function informationQuality(spendMinor: number): number {
  if (!Number.isFinite(spendMinor) || spendMinor < 0)
    throw new Error("invalid research spend");
  return Math.round(
    MAX_INFORMATION_QUALITY * (1 - Math.exp(-spendMinor / QUALITY_SCALE_MINOR)),
  );
}
