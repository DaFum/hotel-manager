import type { NarrativeDefinition } from "../../narrative/eventTypes";
import { CORE_CONTENT_REGISTRY } from "../corePack";

export const OPPORTUNITY_STAKE_MINOR = 2_000_000;
export const OPPORTUNITY_YEARS = 5;
const EVENTS = [...CORE_CONTENT_REGISTRY.allByKind("event")].sort(
  (a, b) => a.simulationOrder - b.simulationOrder,
);
export const NARRATIVE_DEFINITIONS: readonly NarrativeDefinition[] = EVENTS.map(
  (entry) => ({
    id: entry.id,
    titleKey: entry.titleKey,
    bodyKey: entry.bodyKey,
    conditions: entry.conditions,
    choices: entry.choices.map(({ id, labelKey }) => ({ id, labelKey })),
    priority: entry.priority,
    cooldownMonths: entry.cooldownMonths,
  }),
);
export interface NarrativeChoiceEffect {
  costMinor: number;
  reputationDelta: number;
  account: "guest-recovery" | "investment";
}
export const NARRATIVE_CHOICE_EFFECTS: Record<string, NarrativeChoiceEffect> =
  Object.fromEntries(
    EVENTS.flatMap((entry) =>
      entry.choices.map((choice) => [
        `${entry.id}:${choice.id}`,
        {
          costMinor: choice.costMinor,
          reputationDelta: choice.reputationDelta,
          account: choice.account,
        },
      ]),
    ),
  );
