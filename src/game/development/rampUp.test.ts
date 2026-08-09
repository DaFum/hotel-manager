import { describe, expect, it } from "vitest";
import {
  RAMP_UP_MONTHS,
  monthsOpen,
  rampUpDemandFactorBasisPoints,
} from "./rampUp";

describe("hotel ramp up", () => {
  it("increases market capture gradually after opening", () => {
    expect(rampUpDemandFactorBasisPoints(0)).toBe(3500);
    expect(rampUpDemandFactorBasisPoints(12)).toBeGreaterThan(
      rampUpDemandFactorBasisPoints(1),
    );
    expect(rampUpDemandFactorBasisPoints(36)).toBe(10_000);
  });

  it("never goes backwards and never overshoots a mature house", () => {
    let previous = 0;
    for (let month = 0; month <= RAMP_UP_MONTHS + 12; month += 1) {
      const factor = rampUpDemandFactorBasisPoints(month);
      expect(factor).toBeGreaterThanOrEqual(previous);
      expect(factor).toBeLessThanOrEqual(10_000);
      expect(Number.isSafeInteger(factor)).toBe(true);
      previous = factor;
    }
  });

  it("treats a nonsensical month as opening day rather than throwing", () => {
    expect(rampUpDemandFactorBasisPoints(-5)).toBe(3500);
  });

  it("counts whole calendar months since the house opened", () => {
    expect(monthsOpen("1992-03-05", "1992-03-31")).toBe(0);
    expect(monthsOpen("1992-03-05", "1992-04-04")).toBe(0);
    expect(monthsOpen("1992-03-05", "1992-04-05")).toBe(1);
    expect(monthsOpen("1992-03-31", "1993-03-30")).toBe(11);
    expect(monthsOpen("1992-03-05", "1995-03-05")).toBe(36);
    // A date before opening is not negative experience.
    expect(monthsOpen("1992-03-05", "1992-01-01")).toBe(0);
  });

  it("reaches full capture exactly at the declared horizon", () => {
    expect(rampUpDemandFactorBasisPoints(RAMP_UP_MONTHS - 1)).toBeLessThan(
      10_000,
    );
    expect(rampUpDemandFactorBasisPoints(RAMP_UP_MONTHS)).toBe(10_000);
  });
});
