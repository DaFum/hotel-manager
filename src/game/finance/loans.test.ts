import { describe, expect, it } from "vitest";
import { drawLoan, repayLoan } from "./loans";

describe("pure loans domain module", () => {
  it("draws a loan with all new fields and default fallbacks", () => {
    const loan = drawLoan(100_000_00, 500, 24, {
      id: "loan.custom",
      amortisation: "annuity",
      rateType: "variable",
      spreadBasisPoints: 150,
      startMonthIndex: 2,
      collateralValueMinor: 200_000_00,
    });

    expect(loan).toEqual({
      id: "loan.custom",
      principalMinor: 100_000_00,
      annualRateBasisPoints: 500,
      termMonths: 24,
      amortisation: "annuity",
      rateType: "variable",
      spreadBasisPoints: 150,
      startMonthIndex: 2,
      collateralValueMinor: 200_000_00,
    });
  });

  it("validates safe integers and positive/non-negative ranges on drawLoan", () => {
    expect(() => drawLoan(-100, 500, 24)).toThrow("invalid principal");
    expect(() => drawLoan(100_000, -50, 24)).toThrow("invalid rate");
    expect(() => drawLoan(100_000, 500, 0)).toThrow("invalid term");
    expect(() => drawLoan(100_000, 500, 24, { spreadBasisPoints: -10 })).toThrow("invalid spread basis points");
    expect(() => drawLoan(100_000, 500, 24, { collateralValueMinor: -500 })).toThrow("invalid collateral value");
  });

  it("repays loan reducing principal and preserving all other fields", () => {
    const loan = drawLoan(100_000_00, 500, 24, {
      id: "loan.repay",
      amortisation: "linear",
      rateType: "fixed",
    });

    const repaid = repayLoan(loan, 30_000_00);
    expect(repaid.principalMinor).toBe(70_000_00);
    expect(repaid.id).toBe("loan.repay");
    expect(repaid.amortisation).toBe("linear");

    expect(() => repayLoan(loan, 150_000_00)).toThrow("repayment exceeds principal");
  });
});
