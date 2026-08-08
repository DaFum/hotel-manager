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
  {
    id: "segment.business",
    name: "Business",
    shareBp: 4500,
    willingnessMinor: 16000,
    averageNights: 2,
    breakfastTakeUpBp: 9000,
  },
  {
    id: "segment.corporate",
    name: "Corporate contract",
    shareBp: 2000,
    willingnessMinor: 13000,
    averageNights: 3,
    breakfastTakeUpBp: 9500,
  },
  {
    id: "segment.leisure",
    name: "Leisure",
    shareBp: 2500,
    willingnessMinor: 10000,
    averageNights: 2,
    breakfastTakeUpBp: 6000,
  },
  {
    id: "segment.budget",
    name: "Budget",
    shareBp: 1000,
    willingnessMinor: 7500,
    averageNights: 1,
    breakfastTakeUpBp: 3000,
  },
];

/**
 * Picks a segment by its declared share of baseline demand. `rollBp` is a
 * basis-point roll in [0, 10000) from the guests stream.
 */
export function pickSegment(rollBp: number): GuestSegment {
  let cumulative = 0;
  for (const segment of GUEST_SEGMENTS) {
    cumulative += segment.shareBp;
    if (rollBp < cumulative) return segment;
  }
  return GUEST_SEGMENTS[GUEST_SEGMENTS.length - 1];
}
