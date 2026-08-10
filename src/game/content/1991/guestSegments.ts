import { CORE_CONTENT_REGISTRY } from "../corePack";

export interface GuestSegment {
  id: string;
  name: string;
  /** Share of baseline demand, in basis points; the four shares sum to 10000. */
  shareBp: number;
  /** Highest nightly rate this segment will accept, in Pfennig. */
  willingnessMinor: number;
  averageNights: number;
  breakfastTakeUpBp: number;
}

export const GUEST_SEGMENTS: readonly GuestSegment[] = [
  ...CORE_CONTENT_REGISTRY.allByKind("guestSegment"),
]
  .sort((a, b) => a.simulationOrder - b.simulationOrder)
  .map((entry) => ({
    id: entry.id,
    name: entry.name,
    shareBp: entry.shareBasisPoints,
    willingnessMinor: entry.willingnessToPayMinor,
    averageNights: entry.averageNights,
    breakfastTakeUpBp: entry.breakfastTakeUpBasisPoints,
  }));

export function pickSegment(rollBp: number): GuestSegment {
  let cumulative = 0;
  for (const segment of GUEST_SEGMENTS) {
    cumulative += segment.shareBp;
    if (rollBp < cumulative) return segment;
  }
  return GUEST_SEGMENTS[GUEST_SEGMENTS.length - 1];
}
