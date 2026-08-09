import { describe, expect, it } from "vitest";
import { calculateFeasibility, feasibilityVerdict } from "./feasibility";

const BASE = {
  expectedAdrMinor: 18_000,
  rooms: 120,
  occupancyBasisPoints: 7000,
  uncertaintyBasisPoints: 1200,
};

describe("development feasibility", () => {
  it("returns base, downside, and upside values instead of perfect certainty", () => {
    const result = calculateFeasibility(BASE);
    expect(result.downsideAnnualRoomRevenueMinor).toBeLessThan(
      result.baseAnnualRoomRevenueMinor,
    );
    expect(result.upsideAnnualRoomRevenueMinor).toBeGreaterThan(
      result.baseAnnualRoomRevenueMinor,
    );
  });

  it("keeps every published revenue whole Pfennig", () => {
    const result = calculateFeasibility({
      ...BASE,
      expectedAdrMinor: 18_733,
      occupancyBasisPoints: 6333,
      uncertaintyBasisPoints: 777,
    });
    for (const value of [
      result.downsideAnnualRoomRevenueMinor,
      result.baseAnnualRoomRevenueMinor,
      result.upsideAnnualRoomRevenueMinor,
    ])
      expect(Number.isSafeInteger(value)).toBe(true);
  });

  it("widens the band with the declared uncertainty, not with luck", () => {
    const narrow = calculateFeasibility({
      ...BASE,
      uncertaintyBasisPoints: 500,
    });
    const wide = calculateFeasibility({
      ...BASE,
      uncertaintyBasisPoints: 2500,
    });
    const spread = (r: ReturnType<typeof calculateFeasibility>) =>
      r.upsideAnnualRoomRevenueMinor - r.downsideAnnualRoomRevenueMinor;
    expect(spread(wide)).toBeGreaterThan(spread(narrow));
    // The same input twice is the same answer: feasibility is analysis, not
    // a dice roll, so the uncertainty is reported rather than sampled.
    expect(calculateFeasibility(BASE)).toEqual(calculateFeasibility(BASE));
  });

  it("carries the investment case through to a return on cost", () => {
    const result = calculateFeasibility({
      ...BASE,
      investmentMinor: 4_000_000_000,
      gopMarginBasisPoints: 3500,
    });
    // 18_000 * 120 * 365 * 0.70 = 551_880_000 room revenue.
    expect(result.baseAnnualRoomRevenueMinor).toBe(551_880_000);
    expect(result.baseAnnualGopMinor).toBe(193_158_000);
    expect(result.returnOnCostBasisPoints).toBe(482);
    expect(result.downsideReturnOnCostBasisPoints).toBeLessThan(
      result.returnOnCostBasisPoints as number,
    );
  });

  it("has no return on cost when no investment case was supplied", () => {
    const result = calculateFeasibility(BASE);
    expect(result.baseAnnualGopMinor).toBeNull();
    expect(result.returnOnCostBasisPoints).toBeNull();
  });

  it("judges a scheme against a hurdle rate and names the reason", () => {
    const strong = calculateFeasibility({
      ...BASE,
      investmentMinor: 1_000_000_000,
      gopMarginBasisPoints: 3500,
    });
    expect(feasibilityVerdict(strong, 900)).toEqual({
      proceed: true,
      reason: "return on cost 1931bp clears the 900bp hurdle",
    });
    const weak = calculateFeasibility({
      ...BASE,
      investmentMinor: 9_000_000_000,
      gopMarginBasisPoints: 3500,
    });
    expect(feasibilityVerdict(weak, 900).proceed).toBe(false);
    expect(feasibilityVerdict(weak, 900).reason).toMatch(/hurdle/);
    // Without an investment case there is nothing to judge.
    expect(feasibilityVerdict(calculateFeasibility(BASE), 900)).toEqual({
      proceed: false,
      reason: "no investment case",
    });
  });

  it("refuses inputs that are not whole declared units", () => {
    expect(() => calculateFeasibility({ ...BASE, rooms: 0 })).toThrow(/rooms/);
    expect(() =>
      calculateFeasibility({ ...BASE, expectedAdrMinor: 1.5 }),
    ).toThrow(/adr/i);
    expect(() =>
      calculateFeasibility({ ...BASE, occupancyBasisPoints: 12_000 }),
    ).toThrow(/occupancy/);
    expect(() =>
      calculateFeasibility({ ...BASE, uncertaintyBasisPoints: -1 }),
    ).toThrow(/uncertainty/);
  });
});
