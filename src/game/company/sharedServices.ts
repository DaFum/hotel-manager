import { assertCount, assertNonNegativeMinor } from "../domain/units";

/**
 * What headquarters is actually for. Scale buys buying power and a place to
 * put functions no single hotel can justify — and it costs money to run, so
 * the group has to be big enough to be worth having.
 */

/** The most a group can ever negotiate off a supplier's list price. */
export const MAX_PURCHASING_DISCOUNT_BP = 1200;

/** What each doubling of the group is worth at the negotiating table. */
const DISCOUNT_PER_DOUBLING_BP = 250;

/**
 * Central purchasing power. Each doubling of the group buys the same further
 * step, so the second hotel is worth as much as the next two and the next
 * four after that — and the cap stops the group buying for free.
 */
export function purchasingDiscountBasisPoints(hotelCount: number): number {
  assertCount(hotelCount, "hotel count");
  if (hotelCount <= 1) return 0;
  return Math.min(
    MAX_PURCHASING_DISCOUNT_BP,
    doublings(hotelCount) * DISCOUNT_PER_DOUBLING_BP,
  );
}

/**
 * Whole doublings in a count, by halving. Integer arithmetic on purpose: a
 * logarithm's last bit is a platform detail, and this number reaches the
 * ledger.
 */
function doublings(count: number): number {
  let steps = 0;
  let remaining = count;
  while (remaining >= 2) {
    remaining = Math.floor(remaining / 2);
    steps += 1;
  }
  return steps;
}

/** Truncated so a discount never quietly rounds in the group's favour. */
export function discountedUnitPriceMinor(
  listPriceMinor: number,
  discountBp: number,
): number {
  assertNonNegativeMinor(listPriceMinor, "list price");
  if (
    !Number.isSafeInteger(discountBp) ||
    discountBp < 0 ||
    discountBp > 10_000
  )
    throw new Error("invalid purchasing discount");
  return Math.trunc((listPriceMinor * (10_000 - discountBp)) / 10_000);
}

/**
 * What the centre costs to run each month. A fixed base for having a head
 * office at all, plus what each further house adds to it.
 */
export function headquartersMonthlyCostMinor(input: {
  hotelCount: number;
  baseMinor: number;
  perHotelMinor: number;
}): number {
  assertCount(input.hotelCount, "hotel count");
  assertNonNegativeMinor(input.baseMinor, "headquarters base cost");
  assertNonNegativeMinor(input.perHotelMinor, "headquarters cost per hotel");
  return input.baseMinor + input.hotelCount * input.perHotelMinor;
}

/**
 * Whether a central function can still serve the group, and why not. Shared
 * services have capacity like any other serviced area; when they run out the
 * player must be able to read which function is short and by how much.
 */
export function sharedServiceLoad(input: {
  hotelCount: number;
  capacityPerAnalyst: number;
  analysts: number;
}): { demand: number; capacity: number; overloaded: boolean; cause: string } {
  assertCount(input.hotelCount, "hotel count");
  assertCount(input.capacityPerAnalyst, "capacity per analyst");
  assertCount(input.analysts, "analysts");
  const capacity = input.capacityPerAnalyst * input.analysts;
  return {
    demand: input.hotelCount,
    capacity,
    overloaded: input.hotelCount > capacity,
    cause: `${input.hotelCount} hotels served by capacity for ${capacity}`,
  };
}
