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
});
