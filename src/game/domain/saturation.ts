/**
 * A deterministic saturating curve: ceiling * x / (x + halfScale).
 * Inputs may be finite fractional measurements, but the authoritative result
 * is rounded to a whole unit and never exceeds the declared ceiling.
 */
export function saturatingRatio(
  ceiling: number,
  x: number,
  halfScale: number,
): number {
  if (!Number.isFinite(ceiling) || ceiling < 0)
    throw new Error("invalid saturation ceiling");
  if (!Number.isFinite(x)) throw new Error("invalid saturation input");
  if (!Number.isFinite(halfScale) || halfScale <= 0)
    throw new Error("invalid saturation half scale");
  const nonnegative = Math.max(0, x);
  return Math.round((ceiling * nonnegative) / (nonnegative + halfScale));
}
