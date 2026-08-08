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
