/**
 * The building plant the starter hotel runs on. Nameplate ratings live here so
 * every new game starts from the same authoritative values.
 */
export interface PlantAsset {
  id: string;
  /** Nameplate throughput, in the unit its consumer measures. */
  rated: number;
  replacementMinor: number;
  /** Condition at the start of the campaign, in basis points. */
  startingCondition: number;
}

export const STARTER_PLANT: readonly PlantAsset[] = [
  {
    id: "asset.boiler",
    rated: 120,
    replacementMinor: 4_500_000,
    startingCondition: 9000,
  },
  {
    id: "asset.lift",
    rated: 180,
    replacementMinor: 6_000_000,
    startingCondition: 9500,
  },
];

/** Nameplate values for an asset a save carries that content no longer names. */
export const UNKNOWN_PLANT_DEFAULTS = {
  rated: 100,
  replacementMinor: 2_000_000,
} as const;

export function plantAsset(id: string): PlantAsset | undefined {
  return STARTER_PLANT.find((a) => a.id === id);
}
