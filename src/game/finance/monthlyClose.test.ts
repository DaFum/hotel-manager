import { describe, expect, it } from "vitest";
import { closeMonth } from "./monthlyClose";
import { postEntry, balanceMinor } from "./ledger";
import { drawLoan, accrueMonthlyInterestMinor, repayLoan } from "./loans";

describe("monthly close", () => {
  it("reports profit, cash, occupancy, ADR, and RevPAR from auditable inputs", () => {
    const r = closeMonth({
      openingCashMinor: 1_000_000,
      closingCashMinor: 1_100_000,
      roomRevenueMinor: 240_000,
      otherRevenueMinor: 60_000,
      operatingExpenseMinor: 200_000,
      soldRoomNights: 24,
      availableRoomNights: 48,
    });
    expect(r.operatingProfitMinor).toBe(100_000);
    expect(r.occupancyBasisPoints).toBe(5000);
    expect(r.adrMinor).toBe(10000);
    expect(r.revParMinor).toBe(5000);
  });
});

describe("ledger", () => {
  it("keeps an append only running balance in Pfennig", () => {
    const l = postEntry([], {
      day: 1,
      account: "roomRevenue",
      amountMinor: 9000,
      memo: "room 101",
    });
    const l2 = postEntry(l, {
      day: 1,
      account: "wages",
      amountMinor: -4000,
      memo: "reception",
    });
    expect(l).toHaveLength(1);
    expect(balanceMinor(l2)).toBe(5000);
  });
});

describe("loans", () => {
  it("draws one bank loan and accrues integer monthly interest", () => {
    const loan = drawLoan(500_000, 900, 60);
    expect(loan.principalMinor).toBe(500_000);
    expect(accrueMonthlyInterestMinor(loan)).toBe(3750);
  });

  it("reduces the principal on repayment and never goes negative", () => {
    const loan = drawLoan(500_000, 900, 60);
    expect(repayLoan(loan, 100_000).principalMinor).toBe(400_000);
    expect(() => repayLoan(loan, 600_000)).toThrow(/principal/);
  });
});
