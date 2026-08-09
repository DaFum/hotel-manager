import { describe, expect, it } from "vitest";
import {
  createCampaignConfig,
  adjustedStartingCapitalMinor,
} from "./campaignConfig";
describe("campaign config", () => {
  it("starts in Frankfurt on 1 January 1991 with disclosed orthogonal inputs", () => {
    const c = createCampaignConfig("expert", {
      technologySpeedBasisPoints: 15000,
    });
    expect(c.startDateKey).toBe("1991-01-01");
    expect(c.cityId).toBe("city.frankfurt.de");
    expect(c.sandbox.technologySpeedBasisPoints).toBe(15000);
    expect(adjustedStartingCapitalMinor(10000, c)).toBe(7500);
  });

  it("cannot be edited once the career has started", () => {
    const c = createCampaignConfig("beginner");
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.isFrozen(c.inputs)).toBe(true);
    expect(Object.isFrozen(c.sandbox)).toBe(true);
    expect(() => {
      (
        c.inputs as { startingCapitalBasisPoints: number }
      ).startingCapitalBasisPoints = 99;
    }).toThrow();
  });

  it("refuses a difficulty or a sandbox value it could not replay", () => {
    expect(() => createCampaignConfig("impossible" as "expert")).toThrow();
    expect(() =>
      createCampaignConfig("standard", { crisisFrequencyBasisPoints: -1 }),
    ).toThrow();
    expect(() =>
      createCampaignConfig("standard", {
        economicVolatilityBasisPoints: Number.NaN,
      }),
    ).toThrow();
    expect(() =>
      adjustedStartingCapitalMinor(1.5, createCampaignConfig()),
    ).toThrow();
    expect(() =>
      adjustedStartingCapitalMinor(
        Number.MAX_SAFE_INTEGER,
        createCampaignConfig("beginner"),
      ),
    ).toThrow();
  });
});
