/**
 * Authoritative money is integer Pfennig. Major units exist only in the UI
 * formatter, never in game state or command payloads.
 */
export type Pfennig = number;

export function isPfennig(value: unknown): value is Pfennig {
  return Number.isSafeInteger(value);
}

export function assertPfennig(value: unknown, label = "amount"): Pfennig {
  if (!isPfennig(value)) throw new Error(`${label} must be whole Pfennig`);
  return value;
}

export function assertNonNegativePfennig(
  value: unknown,
  label = "amount",
): Pfennig {
  const amount = assertPfennig(value, label);
  if (amount < 0) throw new Error(`${label} must not be negative`);
  return amount;
}

/** Percentages are basis points: 10000 bp is 100 percent. */
export const BASIS_POINTS = 10_000;

export function applyBasisPoints(amountMinor: Pfennig, bp: number): Pfennig {
  if (!Number.isSafeInteger(bp)) throw new Error("basis points must be whole");
  return Math.round((amountMinor * bp) / BASIS_POINTS);
}
