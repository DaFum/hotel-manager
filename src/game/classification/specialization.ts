/**
 * A specialization is a deliberate profile, not a free label: it pays only
 * against the floor area and facilities the hotel actually built for it.
 */
export interface Specialization {
  id: string;
  name: string;
  /** The segment the profile speaks to. */
  segmentId: string;
  /** The invested area that earns the bonus. */
  requires: "conferenceSqm" | "wellnessSqm";
  /** Square metres before the profile counts at all. */
  thresholdSqm: number;
  /** Demand bonus at the threshold, in basis points. */
  bonusBp: number;
  /** The bonus is capped at this many basis points however large the build. */
  maxBonusBp: number;
}

export const SPECIALIZATIONS: readonly Specialization[] = [
  {
    id: "spec.conference",
    name: "Conference hotel",
    segmentId: "segment.corporate",
    requires: "conferenceSqm",
    thresholdSqm: 300,
    bonusBp: 500,
    maxBonusBp: 2000,
  },
  {
    id: "spec.wellness",
    name: "Wellness hotel",
    segmentId: "segment.leisure",
    requires: "wellnessSqm",
    thresholdSqm: 250,
    bonusBp: 500,
    maxBonusBp: 2000,
  },
];

export function specialization(id: string): Specialization {
  const found = SPECIALIZATIONS.find((s) => s.id === id);
  if (!found) throw new Error(`unknown specialization ${id}`);
  return found;
}

export interface InvestedArea {
  conferenceSqm: number;
  wellnessSqm: number;
}

/** Demand bonus in basis points; below the threshold the profile pays nothing. */
export function specializationBonusBp(
  id: string,
  invested: InvestedArea,
): number {
  const spec = specialization(id);
  const area = Math.max(0, invested[spec.requires]);
  if (area < spec.thresholdSqm) return 0;
  const steps = Math.floor(area / spec.thresholdSqm);
  return Math.min(spec.maxBonusBp, steps * spec.bonusBp);
}

/** Square metres one expansion adds, and what building them costs. */
export const EXPANSION_SQM = 60;
export const EXPANSION_COST_PER_SQM_MINOR = 24_000;

export type ExpandableArea = Specialization["requires"];

export const EXPANDABLE_AREAS: readonly ExpandableArea[] = [
  "conferenceSqm",
  "wellnessSqm",
];

export function expansionCostMinor(sqm: number = EXPANSION_SQM): number {
  return Math.max(0, Math.round(sqm)) * EXPANSION_COST_PER_SQM_MINOR;
}
