import { safeProductMinor } from "../domain/units";
import {
  EXPANSION_COST_PER_SQM_MINOR,
  EXPANSION_SQM,
  SPECIALIZATIONS,
} from "../content/1991/classification";

export {
  EXPANSION_COST_PER_SQM_MINOR,
  EXPANSION_SQM,
  SPECIALIZATIONS,
} from "../content/1991/classification";
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

export type ExpandableArea = Specialization["requires"];

export const EXPANDABLE_AREAS: readonly ExpandableArea[] = [
  "conferenceSqm",
  "wellnessSqm",
];

export function expansionCostMinor(sqm: number = EXPANSION_SQM): number {
  return safeProductMinor(sqm, EXPANSION_COST_PER_SQM_MINOR, "expansion");
}
