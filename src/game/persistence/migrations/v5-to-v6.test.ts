import { describe, expect, it } from "vitest";
import { migrateV5ToV6 } from "./v5-to-v6";
describe("v5 to v6", () => {
  it("adds complete narrative state without changing hotels", () => {
    const old = { saveVersion: 5 as const, hotels: { h1: { cashMinor: 5 } } };
    const next = migrateV5ToV6(old);
    expect(next.saveVersion).toBe(6);
    expect(next.hotels).toEqual(old.hotels);
    expect(next.narrative.chronicle).toEqual([]);
    expect(next.narrative.campaign.difficulty).toBe("standard");
  });
});
