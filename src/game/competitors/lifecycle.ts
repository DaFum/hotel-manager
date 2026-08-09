import { BASE_ROOM_BUILD_MINOR } from "../property/market";

/**
 * Entry, distress and exit. A city without failure is not a market: rivals go
 * under when the money runs out, and new ones appear only when the numbers
 * would tempt a real investor.
 */
export type LifecycleAction = "operate" | "restructure" | "exit";

/** Months of burn a house must hold before it stops being in distress. */
const DISTRESS_MONTHS = 2;

export function lifecycleAction(i: {
  cash: number;
  credit: number;
  burn: number;
}): LifecycleAction {
  for (const [label, value] of [
    ["cash", i.cash],
    ["credit", i.credit],
    ["burn", i.burn],
  ] as const)
    if (!Number.isFinite(value)) throw new Error(`invalid ${label}`);
  if (i.cash + i.credit < 0) return "exit";
  if (i.burn > 0 && i.cash < i.burn * DISTRESS_MONTHS) return "restructure";
  return "operate";
}

/** Occupancy at which an investor starts looking at a city, in basis points. */
export const ENTRY_OCCUPANCY_BP = 7500;
/** Yearly return a new build must promise before it is funded, in bp. */
export const ENTRY_HURDLE_BP = 700;
/** Room nights one new room is assumed to sell in a year at entry occupancy. */
const ENTRY_ROOM_NIGHTS_PER_YEAR = 274;
/** Share of room revenue a new build keeps as profit, in basis points. */
const ENTRY_MARGIN_BP = 2500;

/**
 * Whether the city currently justifies a new hotel. The test is the one an
 * investor would apply: does the rate the market pays, at the occupancy it
 * runs, clear the hurdle on what the building costs today?
 */
export function entryOpportunity(i: {
  occupancyBp: number;
  marketRateMinor: number;
  buildCostPerRoomMinor?: number;
}): boolean {
  if (!Number.isFinite(i.occupancyBp) || i.occupancyBp < 0)
    throw new Error("invalid occupancy");
  if (!Number.isSafeInteger(i.marketRateMinor) || i.marketRateMinor <= 0)
    throw new Error("invalid market rate");
  const buildCost = i.buildCostPerRoomMinor ?? BASE_ROOM_BUILD_MINOR;
  if (!Number.isSafeInteger(buildCost) || buildCost <= 0)
    throw new Error("invalid build cost");
  if (i.occupancyBp < ENTRY_OCCUPANCY_BP) return false;
  const yearlyProfit = Math.round(
    (i.marketRateMinor * ENTRY_ROOM_NIGHTS_PER_YEAR * ENTRY_MARGIN_BP) / 10000,
  );
  return Math.round((yearlyProfit * 10000) / buildCost) >= ENTRY_HURDLE_BP;
}
