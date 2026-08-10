import { describe, expect, it } from "vitest";
import { seedsForSweep } from "../../scripts/invariant-sweep";
describe("invariant seed sweep", () => {
  it("uses a stable broad seed set", () => {
    expect(seedsForSweep()).toHaveLength(100);
    expect(new Set(seedsForSweep()).size).toBe(100);
    expect(seedsForSweep()).toEqual([...seedsForSweep()].sort((a, b) => a - b));
  });
});
