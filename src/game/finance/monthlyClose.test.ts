import { describe, expect, it } from "vitest";
import { closeMonth, deriveMonthlyBriefing } from "./monthlyClose";
import { postEntry, balanceMinor } from "./ledger";
import { drawLoan, accrueMonthlyInterestMinor, repayLoan } from "./loans";

describe("monthly close", () => {
  it("reports profit, cash, occupancy, ADR, and RevPAR from auditable inputs", () => {
    const r = closeMonth({
      periodKey: "1991-01",
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
    expect(r.periodKey).toBe("1991-01");
  });

  it("ranks deterministic monthly contributors and bounds every section", () => {
    const previous = closeMonth({
      periodKey: "1991-01",
      openingCashMinor: 0,
      closingCashMinor: 0,
      roomRevenueMinor: 100_000,
      otherRevenueMinor: 20_000,
      operatingExpenseMinor: 80_000,
      soldRoomNights: 10,
      availableRoomNights: 20,
    });
    const report = closeMonth({
      ...previous,
      periodKey: "1991-02",
      roomRevenueMinor: 150_000,
      otherRevenueMinor: 30_000,
      operatingExpenseMinor: 160_000,
    });
    const result = deriveMonthlyBriefing({
      report,
      previous,
      highWaterMarks: {
        revenueMinor: 120_000,
        operatingProfitMinor: 50_000,
        eventRevenueMinor: 5_000,
      },
      eventRevenueMinor: 10_000,
      previousEventRevenueMinor: 2_000,
      lateRoomReleaseCount: 3,
      previousLateRoomReleaseCount: 0,
      signals: {
        dateKey: "1991-03-01",
        supplierContracts: [{ id: "contract.a", validToDateKey: "1991-03-20" }],
        competitors: [
          {
            id: "competitor.a",
            rooms: 80,
            status: "restructure",
            monthsSinceBuild: 4,
          },
        ],
      },
    });
    expect(result.whatWentWell).toHaveLength(3);
    expect(result.whatWentWell[0].amountMinor).toBe(180_000);
    expect(result.whatWentBadly).toContainEqual(
      expect.objectContaining({
        direction: "adverse",
        values: expect.objectContaining({ count: 3 }),
      }),
    );
    expect(result.whatIsChanging.map((item) => item.labelKey)).toEqual([
      "finance.monthlyClose.causes.competitorDevelopments_one",
      "finance.monthlyClose.causes.supplierExpiries_one",
    ]);
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
