import { assertMinor, assertNonNegativeMinor } from "../domain/units";

/**
 * What a player can decide when a story reaches them, and what that decision
 * costs. A choice never resolves itself: it is translated into effects the
 * ordinary finance and reputation systems carry out, so a narrative decision
 * moves money exactly the way every other decision does.
 */
export type NarrativeChoice =
  | {
      kind: "compensate-displaced-guests";
      costMinor: number;
      reputationDelta: number;
    }
  | { kind: "decline"; reputationDelta: number };

/**
 * The effects a choice produces. These are not `GameCommand`s: a story cannot
 * queue a player command, it can only ask the systems that already own money
 * and reputation to post the consequence. `applyNarrativeEffects` in the
 * simulation is the only executor.
 */
export type NarrativeOutcomeEffect =
  | { type: "POST_EXPENSE"; amountMinor: number; category: "guest-recovery" }
  | { type: "ADJUST_REPUTATION"; dimension: "hotel"; delta: number };

export function commandsForNarrativeChoice(
  choice: NarrativeChoice,
): NarrativeOutcomeEffect[] {
  assertMinor(choice.reputationDelta, "narrative reputation delta");
  if (Math.abs(choice.reputationDelta) > 100)
    throw new Error("invalid narrative reputation delta");
  if (choice.kind === "decline")
    return [
      {
        type: "ADJUST_REPUTATION",
        dimension: "hotel",
        delta: choice.reputationDelta,
      },
    ];
  assertNonNegativeMinor(choice.costMinor, "narrative compensation");
  return [
    {
      type: "POST_EXPENSE",
      amountMinor: choice.costMinor,
      category: "guest-recovery",
    },
    {
      type: "ADJUST_REPUTATION",
      dimension: "hotel",
      delta: choice.reputationDelta,
    },
  ];
}
