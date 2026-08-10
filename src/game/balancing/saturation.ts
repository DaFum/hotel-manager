import { saturatingRatio } from "../domain/saturation";

/** Deterministic 0..10,000 diminishing-return curve. */
export function diminishingImpactBasisPoints(
  capacity: number,
  halfScale: number,
): number {
  if (
    !Number.isSafeInteger(capacity) ||
    !Number.isSafeInteger(halfScale) ||
    halfScale <= 0
  )
    throw new Error("invalid saturation inputs");
  if (capacity <= 0) return 0;
  return saturatingRatio(10_000, capacity, halfScale);
}
