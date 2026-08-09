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
});
