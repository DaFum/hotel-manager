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
});
