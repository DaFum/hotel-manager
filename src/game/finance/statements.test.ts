import { describe, expect, it } from "vitest";
import {
  ACCOUNT_CLASSES,
  balanceSheet,
  cashFlowStatement,
  createStatements,
  depreciationMinor,
  isCapitalAccount,
  postDepreciation,
  profitAndLoss,
  recogniseReceivable,
  settleReceivable,
} from "./statements";
import {
  debtSchedule,
  isInsolvent,
  MAX_LOAN_TERM_MONTHS,
  restructure,
} from "./debt";

const LEDGER = [
  { day: 1, account: "roomRevenue", amountMinor: 1_000_000, memo: "rooms" },
  { day: 1, account: "breakfastRevenue", amountMinor: 200_000, memo: "food" },
  { day: 2, account: "wages", amountMinor: -400_000, memo: "payroll" },
  { day: 2, account: "supplies", amountMinor: -100_000, memo: "linen" },
  { day: 3, account: "capex", amountMinor: -2_000_000, memo: "new lift" },
  { day: 4, account: "interest", amountMinor: -50_000, memo: "loan" },
];

describe("financial statements", () => {
  it("keeps capital spend out of the profit and loss account", () => {
    const pl = profitAndLoss(LEDGER);
    expect(pl.revenueMinor).toBe(1_200_000);
    expect(pl.operatingExpenseMinor).toBe(500_000);
    // The lift is an asset, not a cost of trading this month.
    expect(pl.operatingProfitMinor).toBe(700_000);
    expect(pl.interestMinor).toBe(50_000);
    expect(pl.netProfitMinor).toBe(650_000);
    expect(isCapitalAccount("capex")).toBe(true);
    expect(isCapitalAccount("wages")).toBe(false);
    expect(ACCOUNT_CLASSES.capex).toBe("capital");
  });

  it("shows the same period as cash, where the capital spend does appear", () => {
    const cash = cashFlowStatement(LEDGER, { openingCashMinor: 5_000_000 });
    expect(cash.operatingCashMinor).toBe(650_000);
    expect(cash.investingCashMinor).toBe(-2_000_000);
    expect(cash.closingCashMinor).toBe(3_650_000);
    // Profit and cash differ by exactly the capital spend; that difference is
    // the whole reason both statements exist.
    expect(profitAndLoss(LEDGER).netProfitMinor - cash.operatingCashMinor).toBe(
      0,
    );
    expect(cash.closingCashMinor - cash.openingCashMinor).toBe(
      cash.operatingCashMinor + cash.investingCashMinor,
    );
  });

  it("balances assets against liabilities and equity", () => {
    const sheet = balanceSheet({
      cashMinor: 3_650_000,
      receivablesMinor: 400_000,
      fixedAssetsMinor: 2_000_000,
      accumulatedDepreciationMinor: 100_000,
      payablesMinor: 250_000,
      debtMinor: 10_000_000,
      contributedCapitalMinor: 40_000_000,
      retainedEarningsMinor: -44_300_000,
    });
    expect(sheet.totalAssetsMinor).toBe(5_950_000);
    expect(sheet.totalLiabilitiesMinor).toBe(10_250_000);
    expect(sheet.equityMinor).toBe(-4_300_000);
    expect(sheet.balances).toBe(true);
    expect(sheet.totalAssetsMinor).toBe(
      sheet.totalLiabilitiesMinor + sheet.equityMinor,
    );
  });

  it("reports a sheet that does not balance rather than forcing it", () => {
    const sheet = balanceSheet({
      cashMinor: 1,
      receivablesMinor: 0,
      fixedAssetsMinor: 0,
      accumulatedDepreciationMinor: 0,
      payablesMinor: 0,
      debtMinor: 0,
      contributedCapitalMinor: 0,
      retainedEarningsMinor: 0,
    });
    expect(sheet.balances).toBe(false);
  });

  it("depreciates on a straight line in whole Pfennig", () => {
    expect(
      depreciationMinor({ costMinor: 1_200_000, usefulLifeMonths: 120 }),
    ).toBe(10_000);
    // Never more than remains to depreciate.
    expect(
      depreciationMinor({
        costMinor: 1_200_000,
        usefulLifeMonths: 120,
        accumulatedMinor: 1_195_000,
      }),
    ).toBe(5_000);
    expect(() =>
      depreciationMinor({ costMinor: 1_200_000, usefulLifeMonths: 0 }),
    ).toThrow(/useful life/);
  });

  it("posts depreciation as an expense that moves no cash", () => {
    const statements = postDepreciation(createStatements(), {
      assetId: "asset.lift",
      amountMinor: 10_000,
      periodKey: "1991-02",
    });
    expect(statements.accumulatedDepreciationMinor).toBe(10_000);
    expect(statements.depreciationThisPeriodMinor).toBe(10_000);
  });

  it("recognises revenue before the cash arrives, and settles it later", () => {
    const recognised = recogniseReceivable(createStatements(), {
      id: "receivable.account.1",
      amountMinor: 400_000,
      dueDateKey: "1991-03-01",
    });
    expect(recognised.receivablesMinor).toBe(400_000);
    const settled = settleReceivable(recognised, "receivable.account.1");
    expect(settled.receivablesMinor).toBe(0);
    expect(settled.receivables).toEqual([]);
    expect(() => settleReceivable(settled, "receivable.account.1")).toThrow(
      /unknown receivable/,
    );
  });
});

describe("debt, collateral and insolvency", () => {
  it("splits each instalment into interest and principal", () => {
    const schedule = debtSchedule({
      principalMinor: 12_000_000,
      annualRateBasisPoints: 900,
      termMonths: 12,
    });
    expect(schedule).toHaveLength(12);
    expect(schedule[0].interestMinor).toBe(90_000);
    expect(schedule[0].principalMinor).toBe(1_000_000);
    expect(schedule[0].closingPrincipalMinor).toBe(11_000_000);
    expect(schedule.at(-1)?.closingPrincipalMinor).toBe(0);
    // Interest falls as the balance does; it is never a flat fee.
    expect(schedule.at(-1)!.interestMinor).toBeLessThan(
      schedule[0].interestMinor,
    );
  });

  it("rejects debt interest and restructured terms outside safe bounds", () => {
    expect(() =>
      debtSchedule({
        principalMinor: Number.MAX_SAFE_INTEGER,
        annualRateBasisPoints: 1_000_000,
        termMonths: 1,
      }),
    ).toThrow(/interest/);
    expect(() =>
      restructure(
        {
          principalMinor: 1,
          annualRateBasisPoints: 100,
          termMonths: MAX_LOAN_TERM_MONTHS,
        },
        { extraMonths: 1 },
      ),
    ).toThrow(/term exceeds maximum/);
  });

  it("never restructures into a loan that cannot be scheduled", () => {
    // Extending a thirty-year loan by twenty-five years used to be accepted
    // against a 1200-month bound while debtSchedule refused anything over 600,
    // leaving a loan nobody could draw up a payment plan for.
    expect(() =>
      restructure(
        {
          principalMinor: 1_000_000,
          annualRateBasisPoints: 800,
          termMonths: 360,
        },
        { extraMonths: 300 },
      ),
    ).toThrow(/term exceeds maximum/);
    const extended = restructure(
      {
        principalMinor: 1_000_000,
        annualRateBasisPoints: 800,
        termMonths: 360,
      },
      { extraMonths: 120 },
    );
    expect(extended.termMonths).toBe(480);
    expect(debtSchedule(extended)).toHaveLength(480);
  });

  it("calls a house insolvent on the balance sheet, not on a bad month", () => {
    expect(
      isInsolvent({
        cashMinor: 0,
        payablesMinor: 500_000,
        equityMinor: -1,
      }),
    ).toBe(true);
    // Negative equity alone is survivable while the bills are being paid.
    expect(
      isInsolvent({
        cashMinor: 5_000_000,
        payablesMinor: 500_000,
        equityMinor: -1,
      }),
    ).toBe(false);
  });

  it("restructures by extending the term rather than forgiving the debt", () => {
    const before = {
      principalMinor: 12_000_000,
      annualRateBasisPoints: 900,
      termMonths: 12,
    };
    const after = restructure(before, {
      extraMonths: 12,
      penaltyBasisPoints: 200,
    });
    expect(after.principalMinor).toBe(12_000_000);
    expect(after.termMonths).toBe(24);
    expect(after.annualRateBasisPoints).toBe(1100);
    expect(() => restructure(before, { extraMonths: 0 })).toThrow(/extra/);
  });

  it("says how much of a loan the collateral actually covers", () => {
    const schedule = debtSchedule({
      principalMinor: 10_000_000,
      annualRateBasisPoints: 900,
      termMonths: 10,
    });
    expect(schedule[0].openingPrincipalMinor).toBe(10_000_000);
  });
});
