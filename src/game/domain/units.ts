/**
 * Boundary validation for the units the simulation is authoritative in. Every
 * value that becomes money, stock, capacity, or persisted state passes through
 * here, so a NaN or a fractional quantity fails at the edge instead of being
 * stored and silently breaking determinism later.
 */

export function assertCount(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label}`);
  return value;
}

/** Integer Pfennig; may be negative, because a posting can be a credit. */
export function assertMinor(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`invalid ${label}`);
  return value;
}

export function assertNonNegativeMinor(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label}`);
  return value;
}

/** Simulated minutes; never negative, never fractional. */
export function assertMinutes(value: number, label: string): number {
  return assertCount(value, label);
}

/** Basis points; bounded well inside the safe-integer range. */
export function assertBasisPoints(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000)
    throw new Error(`invalid ${label}`);
  return value;
}

/** A 0..100 score such as room comfort or condition. */
export function assertScore(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100)
    throw new Error(`invalid ${label}`);
  return value;
}

/**
 * Multiplies a count by a unit price and refuses a result that has left the
 * safe-integer range, so an overflowed total can never reach the ledger.
 */
export function safeProductMinor(
  count: number,
  unitMinor: number,
  label: string,
): number {
  assertCount(count, `${label} count`);
  assertNonNegativeMinor(unitMinor, `${label} unit price`);
  const total = count * unitMinor;
  if (!Number.isSafeInteger(total)) throw new Error(`invalid ${label} total`);
  return total;
}
