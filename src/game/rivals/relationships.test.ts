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
});
