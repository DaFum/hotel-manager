export type NarrativeChoice =
  | {
      kind: "compensate-displaced-guests";
      costMinor: number;
      reputationDelta: number;
    }
  | { kind: "decline"; reputationDelta: number };
export type NarrativeOutcomeCommand =
  | { type: "POST_EXPENSE"; amountMinor: number; category: "guest-recovery" }
  | { type: "ADJUST_REPUTATION"; dimension: "hotel"; delta: number };
export function commandsForNarrativeChoice(
  choice: NarrativeChoice,
): NarrativeOutcomeCommand[] {
  if (choice.kind === "decline")
    return [
      {
        type: "ADJUST_REPUTATION",
        dimension: "hotel",
        delta: choice.reputationDelta,
      },
    ];
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
