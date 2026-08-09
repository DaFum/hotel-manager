import type { NarrativeDefinition } from "../../narrative/eventTypes";

/**
 * The stories the 1991 world can tell. Each one is data: a set of conditions
 * the simulation must actually reach, and choices whose consequences are
 * ordinary money and reputation. Nothing here decides when it happens.
 */
/** What the digital bet costs, and how long it takes to find out. */
export const OPPORTUNITY_STAKE_MINOR = 2_000_000;
export const OPPORTUNITY_YEARS = 5;

export const NARRATIVE_DEFINITIONS: readonly NarrativeDefinition[] = [
  {
    id: "narrative.overbooking-scandal",
    titleKey: "narrative.overbooking-scandal.title",
    bodyKey: "narrative.overbooking-scandal.body",
    conditions: [
      { key: "occupancyBasisPoints", min: 9500 },
      { key: "mediaReach", min: 12 },
    ],
    choices: [
      {
        id: "compensate",
        labelKey: "narrative.overbooking-scandal.choice.compensate",
      },
      {
        id: "decline",
        labelKey: "narrative.overbooking-scandal.choice.decline",
      },
    ],
    priority: 2,
    cooldownMonths: 12,
  },
  {
    id: "narrative.press-profile",
    titleKey: "narrative.press-profile.title",
    bodyKey: "narrative.press-profile.body",
    conditions: [
      { key: "guestSatisfaction", min: 70 },
      { key: "mediaReach", min: 6 },
    ],
    choices: [
      { id: "compensate", labelKey: "narrative.press-profile.choice.host" },
      { id: "decline", labelKey: "narrative.press-profile.choice.decline" },
    ],
    priority: 1,
    cooldownMonths: 24,
  },
  {
    // The long tail: a bet whose answer arrives years later, and only from
    // how far the technology it bet on actually went.
    id: "narrative.digital-bet",
    titleKey: "narrative.digital-bet.title",
    bodyKey: "narrative.digital-bet.body",
    conditions: [
      { key: "internetAdoptionBp", min: 500 },
      { key: "cashMinor", min: OPPORTUNITY_STAKE_MINOR },
    ],
    choices: [
      { id: "invest", labelKey: "narrative.digital-bet.choice.invest" },
      { id: "decline", labelKey: "narrative.digital-bet.choice.decline" },
    ],
    priority: 3,
    cooldownMonths: 120,
  },
];

/**
 * What each choice costs and what it does to the house's standing. Kept beside
 * the definitions so a content change is a data change.
 */
export interface NarrativeChoiceEffect {
  costMinor: number;
  reputationDelta: number;
  /**
   * The account the cost is booked to. Stated, never inferred from the choice
   * id: a stake in an agency is not a guest-recovery expense, and an account
   * guessed from a label is how it silently became one.
   */
  account: "guest-recovery" | "investment";
}

export const NARRATIVE_CHOICE_EFFECTS: Record<string, NarrativeChoiceEffect> = {
  "narrative.overbooking-scandal:compensate": {
    costMinor: 200_000,
    reputationDelta: 5,
    account: "guest-recovery",
  },
  "narrative.overbooking-scandal:decline": {
    costMinor: 0,
    reputationDelta: -6,
    account: "guest-recovery",
  },
  "narrative.press-profile:compensate": {
    costMinor: 40_000,
    reputationDelta: 4,
    account: "guest-recovery",
  },
  "narrative.press-profile:decline": {
    costMinor: 0,
    reputationDelta: -1,
    account: "guest-recovery",
  },
  "narrative.digital-bet:invest": {
    costMinor: OPPORTUNITY_STAKE_MINOR,
    reputationDelta: 0,
    account: "investment",
  },
  "narrative.digital-bet:decline": {
    costMinor: 0,
    reputationDelta: 0,
    account: "investment",
  },
};

/**
 * Content is cross-checked when the module loads: every declared choice needs
 * an effect, and every effect must belong to a choice that exists. A story
 * whose button does nothing is a content bug, and it should stop the build
 * rather than wait to be discovered by a player.
 */
const declaredKeys = new Set(
  NARRATIVE_DEFINITIONS.flatMap((definition) =>
    definition.choices.map((choice) => `${definition.id}:${choice.id}`),
  ),
);
for (const key of declaredKeys)
  if (!NARRATIVE_CHOICE_EFFECTS[key])
    throw new Error(`narrative choice ${key} has no effect`);
for (const key of Object.keys(NARRATIVE_CHOICE_EFFECTS))
  if (!declaredKeys.has(key))
    throw new Error(`narrative effect ${key} belongs to no choice`);
