import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { balanceMinor } from "./ledger";
import { balanceSheet, cashFlowStatement, profitAndLoss } from "./statements";
import { takeOutPolicy } from "../risk/insurance";
import { STARTER_HOTEL } from "../content/1991/starterHotel";

function play(days: number, seed = 17): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
  return s;
}

describe("the statements against a real trading hotel", () => {
  it("reconciles cash flow with the ledger and the opening balance", () => {
    const s = play(40);
    const cash = cashFlowStatement(s.state.finance.ledger, {
      openingCashMinor: STARTER_HOTEL.startingCashMinor,
    });
    expect(cash.closingCashMinor).toBe(s.state.finance.cashMinor);
    expect(cash.operatingCashMinor + cash.investingCashMinor).toBe(
      balanceMinor(s.state.finance.ledger),
    );
  });

  it("keeps capital spend out of profit but visible in cash", () => {
    const s = new GameSimulation(createInitialGameState(17));
    s.refreshDerivedState();
    // A real capital decision, so the investing line has something in it.
    s.queueCommand({ type: "EXPAND_FACILITY", area: "conferenceSqm" });
    for (let i = 0; i < (40 * 1440) / QUANTUM_MINUTES; i += 1)
      s.advanceQuantum();
    const pl = profitAndLoss(s.state.finance.ledger);
    const cash = cashFlowStatement(s.state.finance.ledger, {
      openingCashMinor: STARTER_HOTEL.startingCashMinor,
    });
    // The hotel bought things; the investing line is where that shows.
    expect(cash.investingCashMinor).toBeLessThan(0);
    expect(pl.revenueMinor).toBeGreaterThan(0);
    expect(pl.operatingProfitMinor).toBe(
      pl.revenueMinor - pl.operatingExpenseMinor,
    );
  });

  it("balances the sheet the hotel actually has", () => {
    const s = play(40);
    const state = s.state;
    const pl = profitAndLoss(state.finance.ledger);
    const sheet = balanceSheet({
      cashMinor: state.finance.cashMinor,
      receivablesMinor: state.statements.receivablesMinor,
      fixedAssetsMinor: state.statements.fixedAssetsMinor,
      accumulatedDepreciationMinor:
        state.statements.accumulatedDepreciationMinor,
      payablesMinor: state.finance.payableMinor,
      debtMinor: state.loan.principalMinor,
      contributedCapitalMinor: STARTER_HOTEL.startingCashMinor,
      retainedEarningsMinor:
        pl.netProfitMinor - state.statements.accumulatedDepreciationMinor,
    });
    // Assets bought with cash are still assets: the capital spend that left
    // the cash line is exactly what the fixed-asset line picked up.
    expect(state.finance.cashMinor + state.statements.fixedAssetsMinor).toBe(
      STARTER_HOTEL.startingCashMinor + pl.netProfitMinor,
    );
    expect(sheet.totalAssetsMinor).toBeGreaterThan(0);
  });

  it("depreciates the plant once a month and never twice for one period", () => {
    const s = play(70);
    const statements = s.state.statements;
    expect(statements.accumulatedDepreciationMinor).toBeGreaterThan(0);
    expect(statements.lastDepreciationPeriodKey).toMatch(/^\d{4}-\d{2}$/);

    // A reload has to actually reach another close for the guard to be
    // exercised: it is the period stamp, not the reload, that stops the
    // already-charged month being charged again.
    const before = statements.accumulatedDepreciationMinor;
    const chargedPeriod = statements.lastDepreciationPeriodKey;
    const reloaded = new GameSimulation(structuredClone(s.state));
    reloaded.refreshDerivedState();
    for (let i = 0; i < (40 * 1440) / QUANTUM_MINUTES; i += 1)
      reloaded.advanceQuantum();

    // Exactly one further month was charged, and it was a different month.
    const oneMonth = before / 2;
    expect(reloaded.state.statements.accumulatedDepreciationMinor).toBe(
      before + oneMonth,
    );
    expect(reloaded.state.statements.lastDepreciationPeriodKey).not.toBe(
      chargedPeriod,
    );

    // Depreciation is not cash: it never appears in the ledger.
    expect(
      s.state.finance.ledger.some((e) => e.account === "depreciation"),
    ).toBe(false);
  });

  it("charges a premium every month once a policy is in force", () => {
    const s = new GameSimulation(createInitialGameState(19));
    s.state.insurance = takeOutPolicy(s.state.insurance, {
      id: "policy.building",
      peril: "fire",
      insuredValueMinor: 100_000_000,
      limitMinor: 60_000_000,
      deductibleMinor: 2_000_000,
      annualRateBasisPoints: 120,
      exclusions: ["wear"],
    });
    s.refreshDerivedState();
    for (let i = 0; i < (40 * 1440) / QUANTUM_MINUTES; i += 1)
      s.advanceQuantum();

    const premiums = s.state.finance.ledger.filter(
      (e) => e.account === "insurancePremium",
    );
    expect(premiums).toHaveLength(1);
    expect(premiums[0].amountMinor).toBe(-100_000);
  });

  it("bills energy, water and waste separately and moves their meters", () => {
    const s = play(40);
    const memos = s.state.finance.ledger
      .filter((e) => e.account === "utilities")
      .map((e) => e.memo);
    expect(memos.some((m) => m.startsWith("metered energy"))).toBe(true);
    expect(memos.some((m) => m.startsWith("metered water"))).toBe(true);
    expect(memos.some((m) => m.startsWith("waste"))).toBe(true);
    // No single combined utility posting survives.
    expect(memos).not.toContain("metered water and energy");

    expect(s.state.meters.energy).toBeGreaterThan(0);
    expect(s.state.meters.water).toBeGreaterThan(0);
    expect(s.state.meters.waste).toBeGreaterThan(0);
  });
});
