import { describe, expect, it } from "vitest";
import { commandsForNarrativeChoice } from "./outcomes";
describe("narrative outcomes", () => {
  it("uses finance and reputation commands", () =>
    expect(
      commandsForNarrativeChoice({
        kind: "compensate-displaced-guests",
        costMinor: 200000,
        reputationDelta: 5,
      }),
    ).toEqual([
      { type: "POST_EXPENSE", amountMinor: 200000, category: "guest-recovery" },
      { type: "ADJUST_REPUTATION", dimension: "hotel", delta: 5 },
    ]));

  it("refuses money and reputation a system could not post", () => {
    expect(() =>
      commandsForNarrativeChoice({
        kind: "compensate-displaced-guests",
        costMinor: -1,
        reputationDelta: 5,
      }),
    ).toThrow();
    expect(() =>
      commandsForNarrativeChoice({
        kind: "compensate-displaced-guests",
        costMinor: 1.5,
        reputationDelta: 5,
      }),
    ).toThrow();
    expect(() =>
      commandsForNarrativeChoice({
        kind: "compensate-displaced-guests",
        costMinor: Number.NaN,
        reputationDelta: 5,
      }),
    ).toThrow();
    expect(() =>
      commandsForNarrativeChoice({ kind: "decline", reputationDelta: 101 }),
    ).toThrow();
    expect(() =>
      commandsForNarrativeChoice({ kind: "decline", reputationDelta: 0.5 }),
    ).toThrow();
  });
});
