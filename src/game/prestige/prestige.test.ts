import { describe, expect, it } from "vitest";
import { financingAccessBonusBasisPoints } from "./prestige";
describe("prestige", () => {
  it("only supplies bounded access", () =>
    expect(financingAccessBonusBasisPoints(100)).toBe(1000));
});
