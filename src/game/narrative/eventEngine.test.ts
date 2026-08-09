import { describe, expect, it } from "vitest";
import { eligibleEvents, selectNarrativeEvent } from "./eventEngine";
const defs = [
  {
    id: "b",
    titleKey: "b",
    bodyKey: "b",
    conditions: [
      { key: "guests", min: 3 },
      { key: "reach", min: 20 },
    ],
    choices: [],
    priority: 1,
    cooldownMonths: 12,
  },
  {
    id: "a",
    titleKey: "a",
    bodyKey: "a",
    conditions: [{ key: "guests", min: 3 }],
    choices: [],
    priority: 1,
    cooldownMonths: 0,
  },
];
describe("narrative event eligibility", () => {
  it("requires conditions, cooldowns and stable ordering", () => {
    expect(
      eligibleEvents(defs, { guests: 4, reach: 10 }).map((x) => x.id),
    ).toEqual(["a"]);
    expect(
      eligibleEvents(
        defs,
        { guests: 4, reach: 30 },
        { b: "1997-01-01" },
        "1997-02-01",
      ).map((x) => x.id),
    ).toEqual(["a"]);
    expect(
      selectNarrativeEvent(eligibleEvents(defs, { guests: 4, reach: 30 }), 1)
        ?.id,
    ).toBe("b");
  });

  it("orders equal-priority ids without locale collation", () => {
    // German collation sorts "ä" next to "a"; ASCII order does not. A replay
    // must not depend on which of those the host happens to implement.
    const collationSensitive = [
      { ...defs[1], id: "ärger-im-haus" },
      { ...defs[1], id: "zimmerbrand" },
      { ...defs[1], id: "abriss" },
    ];
    expect(
      eligibleEvents(collationSensitive, { guests: 4 }).map((x) => x.id),
    ).toEqual(["abriss", "zimmerbrand", "ärger-im-haus"]);
  });

  it("refuses facts and draws that would make a selection meaningless", () => {
    expect(() => eligibleEvents(defs, { guests: Number.NaN })).toThrow();
    expect(() => eligibleEvents(defs, { guests: 3.5 })).toThrow();
    expect(() => eligibleEvents(defs, { guests: Number.MAX_VALUE })).toThrow();
    const eligible = eligibleEvents(defs, { guests: 4, reach: 30 });
    expect(() => selectNarrativeEvent(eligible, -1)).toThrow();
    expect(() => selectNarrativeEvent(eligible, 1.5)).toThrow();
    expect(() => selectNarrativeEvent(eligible, Number.NaN)).toThrow();
  });
});
