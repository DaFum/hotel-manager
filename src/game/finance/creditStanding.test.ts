import { describe, expect, it } from "vitest";
import { calculateCreditStanding } from "./creditStanding";

describe("credit standing calculations", () => {
  it("calculates whole-number score (0-100), offered rate, and total borrowing limit", () => {
    const result = calculateCreditStanding({
      operatingCashFlowMinor: 600_000_00,
      totalOutstandingMinor: 100_000_00,
      cashMinor: 500_000_00,
      equityMinor: 1_000_000_00,
      hotelCount: 3,
      reputationScore: 85,
      totalCollateralValueMinor: 200_000_00,
      paymentHistory: {
        onTimePayments: 12,
        missedPayments: 0,
        consecutiveMissedPayments: 0,
      },
      macroInterestBp: 400,
      financingAccessBonusBp: 50,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.score)).toBe(true);
    expect(Number.isInteger(result.spreadBp)).toBe(true);
    expect(Number.isInteger(result.offeredRateBp)).toBe(true);
    expect(result.offeredRateBp).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.borrowingLimitMinor)).toBe(true);
  });

  it("penalizes score on missed payments and high leverage", () => {
    const clean = calculateCreditStanding({
      operatingCashFlowMinor: 100_000_00,
      totalOutstandingMinor: 0,
      cashMinor: 500_000_00,
      equityMinor: 500_000_00,
      hotelCount: 1,
      reputationScore: 50,
      totalCollateralValueMinor: 0,
      paymentHistory: { onTimePayments: 5, missedPayments: 0, consecutiveMissedPayments: 0 },
      macroInterestBp: 300,
    });

    const penalized = calculateCreditStanding({
      operatingCashFlowMinor: -100_000_00,
      totalOutstandingMinor: 2_000_000_00,
      cashMinor: 10_000_00,
      equityMinor: -100_000_00,
      hotelCount: 1,
      reputationScore: 30,
      totalCollateralValueMinor: 0,
      paymentHistory: { onTimePayments: 0, missedPayments: 3, consecutiveMissedPayments: 2 },
      macroInterestBp: 300,
    });

    expect(penalized.score).toBeLessThan(clean.score);
    expect(penalized.offeredRateBp).toBeGreaterThan(clean.offeredRateBp);
    expect(penalized.borrowingLimitMinor).toBeLessThan(clean.borrowingLimitMinor);
  });
});
