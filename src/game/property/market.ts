/**
 * The city property market. Land is priced by the demand pressure the city is
 * under, but it moves slowly: a price that reacted instantly would let every
 * actor time the market perfectly, which is not how property works.
 */

/** The most a land price may move in one month, in basis points. */
export const MAX_MONTHLY_MOVE_BP = 300;
/** Fit-out and shell cost of one room, in Pfennig, at neutral land prices. */
export const BASE_ROOM_BUILD_MINOR = 4_500_000;
/** Land price the base build cost is quoted against. */
export const NEUTRAL_LAND_PRICE_MINOR = 10_000_000;
/** Share of a build that is land-price sensitive, in basis points. */
const LAND_SHARE_BP = 4000;

function assertPrice(label: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label} price`);
}

/**
 * One month of lagged adjustment toward the target. The cap is symmetric, so
 * a crash unwinds no faster than a boom builds.
 */
export function nextPrice(
  current: number,
  target: number,
  maxMoveBp: number,
): number {
  assertPrice("current", current);
  assertPrice("target", target);
  if (!Number.isFinite(maxMoveBp) || maxMoveBp < 0)
    throw new Error("invalid max move");
  const limit = Math.round((current * maxMoveBp) / 10000);
  const delta = target - current;
  return current + Math.sign(delta) * Math.min(Math.abs(delta), limit);
}

/**
 * Where the land price is heading, given how hard the city's room nights are
 * pressing on its hotel supply (10000 = supply and demand in balance).
 */
export function targetPriceMinor(
  baseLandPriceMinor: number,
  demandPressureBp: number,
): number {
  assertPrice("base land", baseLandPriceMinor);
  if (!Number.isFinite(demandPressureBp) || demandPressureBp <= 0)
    throw new Error("invalid demand pressure");
  // Property overshoots demand: a tight market bids land up faster than the
  // room nights that justify it.
  const factorBp = 10000 + Math.round((demandPressureBp - 10000) * 1.5);
  return Math.max(
    1,
    Math.round((baseLandPriceMinor * Math.max(2500, factorBp)) / 10000),
  );
}

/** What it costs to build rooms today, in whole Pfennig. */
export function buildCostMinor(i: {
  rooms: number;
  landPriceMinor: number;
}): number {
  if (!Number.isSafeInteger(i.rooms) || i.rooms <= 0)
    throw new Error("invalid rooms");
  assertPrice("land", i.landPriceMinor);
  const landFactorBp = Math.round(
    10000 +
      (LAND_SHARE_BP * (i.landPriceMinor - NEUTRAL_LAND_PRICE_MINOR)) /
        NEUTRAL_LAND_PRICE_MINOR,
  );
  return Math.round(
    (i.rooms * BASE_ROOM_BUILD_MINOR * Math.max(2500, landFactorBp)) / 10000,
  );
}
