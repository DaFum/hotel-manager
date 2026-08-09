import type { StarStandard } from "../../classification/quality";
import type { Specialization } from "../../classification/specialization";

/** The 1991 German classification bands. Content, never conditionals. */
export const STAR_STANDARDS: readonly StarStandard[] = [
  {
    stars: 1,
    required: { room: 25, reception: 25, maintenance: 25, facilities: 0 },
  },
  {
    stars: 2,
    required: { room: 40, reception: 40, maintenance: 40, facilities: 15 },
  },
  {
    stars: 3,
    required: { room: 60, reception: 60, maintenance: 60, facilities: 40 },
  },
  {
    stars: 4,
    required: { room: 75, reception: 75, maintenance: 75, facilities: 65 },
  },
  {
    stars: 5,
    required: { room: 88, reception: 90, maintenance: 88, facilities: 85 },
  },
];

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

/** What one build step of profile floor area adds, and what it costs. */
export const EXPANSION_SQM = 60;
export const EXPANSION_COST_PER_SQM_MINOR = 24_000;
