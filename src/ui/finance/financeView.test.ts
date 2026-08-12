import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../game/simulation/initialState";
import { financeView } from "./financeView";

describe("finance view", () => {
  it("derives statements, verified balance fields and deterministic costs", () => {
    const state = createInitialGameState(1);
    state.finance.ledger = [
      { day: 1, account: "roomRevenue", amountMinor: 100_000, memo: "rooms" },
      { day: 1, account: "otherRevenue", amountMinor: 20_000, memo: "other" },
      { day: 1, account: "wages", amountMinor: -60_000, memo: "wages" },
      { day: 1, account: "utilities", amountMinor: -20_000, memo: "power" },
      { day: 1, account: "capex", amountMinor: -10_000, memo: "project" },
    ];
    state.finance.month.openingCashMinor = 1_000_000;
    state.statements.receivablesMinor = 5_000;
    state.statements.fixedAssetsMinor = 200_000;
    state.statements.accumulatedDepreciationMinor = 20_000;
    const view = financeView({
      ...state,
      company: state.company,
      hotelId: state.hotel.id,
      periodKey: state.calendar.dateKey.slice(0, 7),
    });
    expect(view.profitAndLoss).toMatchObject({
      revenueMinor: 120_000,
      operatingExpenseMinor: 80_000,
      operatingProfitMinor: 40_000,
    });
    expect(view.cashFlow.investingCashMinor).toBe(-10_000);
    expect(view.balanceSheet).toMatchObject({
      receivablesMinor: 5_000,
      fixedAssetsNetMinor: 180_000,
      equityMinor: null,
      equityAvailable: false,
    });
    expect(view.costs.map((row) => row.account)).toEqual([
      "wages",
      "utilities",
    ]);
    expect(view.costCause).toMatchObject({
      key: "explanation.profitDown.drivers",
      values: { drivers: "wages (75%) and utilities (25%)" },
    });
  });
});
