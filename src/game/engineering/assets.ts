/**
 * Plant that supplies the building: boiler, lifts, kitchen extract, laundry
 * machines. Condition is 0..100 and drives how much of the nameplate rating
 * the asset still delivers, which is what the rest of the hotel feels.
 */
export interface EngineeringAsset {
  /** Nameplate throughput in whatever unit the consumer measures. */
  rated: number;
  condition: number;
}

/** Above this condition an asset performs to its rating. */
export const HEALTHY_CONDITION = 80;

export function effectiveCapacity(i: EngineeringAsset): number {
  const condition = Math.max(0, Math.min(100, i.condition));
  // Below the healthy band, output falls linearly to half the rating; plant
  // degrades, it does not switch off.
  const multiplierBp =
    condition >= HEALTHY_CONDITION ? 10000 : 5000 + condition * 50;
  return Math.round((Math.max(0, i.rated) * multiplierBp) / 10000);
}

/** Demand the asset cannot cover in its current condition. */
export function utilityShortfall(
  asset: EngineeringAsset,
  demand: number,
): number {
  return Math.max(0, Math.max(0, demand) - effectiveCapacity(asset));
}
