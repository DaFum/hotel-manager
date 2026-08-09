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
});
