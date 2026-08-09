import { describe, expect, it } from "vitest";
import { resolveInvestmentOutcome } from "./strategicOpportunities";
describe("opportunities", () => {
  it("resolves from simulated value", () => {
    expect(
      resolveInvestmentOutcome({
        investedMinor: 2000000,
        companyValueMultiplierBasisPoints: 0,
      }),
    ).toBe(-2000000);
    expect(
      resolveInvestmentOutcome({
        investedMinor: 2000000,
        companyValueMultiplierBasisPoints: 30000,
      }),
    ).toBe(4000000);
  });

  it("refuses stakes and multipliers that could not be money", () => {
    expect(() =>
      resolveInvestmentOutcome({
        investedMinor: -1,
        companyValueMultiplierBasisPoints: 10000,
      }),
    ).toThrow();
    expect(() =>
      resolveInvestmentOutcome({
        investedMinor: 1.5,
        companyValueMultiplierBasisPoints: 10000,
      }),
    ).toThrow();
    expect(() =>
      resolveInvestmentOutcome({
        investedMinor: 2000000,
        companyValueMultiplierBasisPoints: Number.NaN,
      }),
    ).toThrow();
    expect(() =>
      resolveInvestmentOutcome({
        investedMinor: 2000000,
        companyValueMultiplierBasisPoints: -1,
      }),
    ).toThrow();
  });
});
