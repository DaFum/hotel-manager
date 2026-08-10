import { describe, expect, it } from "vitest";
import { cueForEvent } from "./cues";
describe("semantic cues", () => {
  it("has a semantic label", () => {
    expect(cueForEvent("LIQUIDITY_CRITICAL")).toEqual({
      sound: "alert-critical",
      labelKey: "alerts.liquidityCritical",
    });
  });
});
