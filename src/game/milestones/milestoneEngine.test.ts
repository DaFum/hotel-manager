import { describe, expect, it } from "vitest";
import { detectMilestones } from "./milestoneEngine";
describe("milestones", () => {
  it("records state milestones once without stopping at 2026", () =>
    expect(
      detectMilestones({
        annualProfitMinor: 1,
        hotelCount: 2,
        year: 2027,
        achieved: ["second-hotel"],
      }),
    ).toEqual(["first-profitable-year", "career-2026"]));

  it("reads a full year of profit, so a loss-making year earns nothing", () =>
    expect(
      detectMilestones({
        annualProfitMinor: -1,
        hotelCount: 1,
        year: 1994,
        achieved: [],
      }),
    ).toEqual([]));

  it("refuses facts that are not whole", () => {
    expect(() =>
      detectMilestones({
        annualProfitMinor: Number.NaN,
        hotelCount: 1,
        year: 1994,
        achieved: [],
      }),
    ).toThrow();
    expect(() =>
      detectMilestones({
        annualProfitMinor: 1,
        hotelCount: -1,
        year: 1994,
        achieved: [],
      }),
    ).toThrow();
    expect(() =>
      detectMilestones({
        annualProfitMinor: 1,
        hotelCount: 1,
        year: 1994.5,
        achieved: [],
      }),
    ).toThrow();
  });
});
