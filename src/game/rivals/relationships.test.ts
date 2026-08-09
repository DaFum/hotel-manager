import { describe, expect, it } from "vitest";
import { applyRivalInteraction } from "./relationships";
describe("rival memory", () => {
  it("remembers hostility", () =>
    expect(
      applyRivalInteraction(
        { trust: 0, rivalry: 0, memories: [] },
        { kind: "outbid-property", year: 1997 },
      ),
    ).toEqual({
      trust: -5,
      rivalry: 10,
      memories: [{ kind: "outbid-property", year: 1997 }],
    }));

  it("keeps its own copy of what happened", () => {
    const event = { kind: "poach-staff" as const, year: 1997 };
    const next = applyRivalInteraction(
      { trust: 0, rivalry: 0, memories: [] },
      event,
    );
    event.year = 2001;
    expect(next.memories).toEqual([{ kind: "poach-staff", year: 1997 }]);
  });

  it("refuses a relationship or a year that could not have been recorded", () => {
    expect(() =>
      applyRivalInteraction(
        { trust: 0, rivalry: 101, memories: [] },
        { kind: "cooperate", year: 1997 },
      ),
    ).toThrow();
    expect(() =>
      applyRivalInteraction(
        { trust: Number.NaN, rivalry: 0, memories: [] },
        { kind: "cooperate", year: 1997 },
      ),
    ).toThrow();
    expect(() =>
      applyRivalInteraction(
        { trust: 0, rivalry: 0, memories: [] },
        { kind: "cooperate", year: 1997.5 },
      ),
    ).toThrow();
  });
});
