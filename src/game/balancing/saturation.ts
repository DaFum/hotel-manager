import { saturatingRatio } from "../domain/saturation";

/** Deterministic 0..10,000 diminishing-return curve. */
export function diminishingImpactBasisPoints(
  capacity: number,
  halfScale: number,
): number {
  if (Number.isSafeInteger(capacity) && capacity <= 0) return 0;
  if (
    !Number.isSafeInteger(capacity) ||
    !Number.isSafeInteger(halfScale) ||
    halfScale <= 0
  )
    throw new Error("invalid saturation inputs");
  return saturatingRatio(10_000, capacity, halfScale);
}

export function diminishingImpact(capacity: number, halfScale: number): number {
  return diminishingImpactBasisPoints(capacity, halfScale) / 10_000;
}
