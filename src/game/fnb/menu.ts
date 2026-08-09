import { assertCount, assertMinor } from "../domain/units";
/**
 * F&B economics. Every figure is integer Pfennig: a cover's contribution is
 * the number the player steers the outlets on, so it must not drift.
 */
export function contributionMinor(
  priceMinor: number,
  ingredientMinor: number,
): number {
  if (
    !Number.isSafeInteger(priceMinor) ||
    !Number.isSafeInteger(ingredientMinor)
  )
    throw new Error("minor units required");
  return priceMinor - ingredientMinor;
}

/** Contribution as basis points of the selling price. */
export function contributionMarginBp(
  priceMinor: number,
  ingredientMinor: number,
): number {
  const contribution = contributionMinor(priceMinor, ingredientMinor);
  if (priceMinor <= 0) return 0;
  return Math.round((contribution * 10000) / priceMinor);
}

export interface SoldLine {
  priceMinor: number;
  ingredientMinor: number;
  sold: number;
}

export function menuContributionMinor(lines: readonly SoldLine[]): number {
  const total = lines.reduce((sum, l) => {
    assertCount(l.sold, "covers sold");
    return sum + contributionMinor(l.priceMinor, l.ingredientMinor) * l.sold;
  }, 0);
  return assertMinor(total, "menu contribution");
}

/**
 * Seats still sellable in a service. A reserved table is held for the whole
 * service, and a seated walk-in occupies its seat the same way.
 */
export function availableSeats(
  seats: number,
  reserved: number,
  walkIns: number,
): number {
  assertCount(seats, "seats");
  assertCount(reserved, "reserved seats");
  assertCount(walkIns, "seated walk-ins");
  return Math.max(0, seats - reserved - walkIns);
}
