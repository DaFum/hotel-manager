import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../game/simulation/initialState";
import { financeView } from "./finance/financeView";
import { FinanceDashboard } from "./FinanceDashboard";

describe("FinanceDashboard", () => {
  it("renders every controlling section, signed cues and empty states", () => {
    const state = createInitialGameState(2);
    state.loan.principalMinor = 0;
    state.finance.ledger = [
      { day: 1, account: "roomRevenue", amountMinor: 100_000, memo: "rooms" },
      { day: 1, account: "wages", amountMinor: -40_000, memo: "wages" },
    ];
    const view = financeView({
      ...state,
      company: state.company,
      hotelId: state.hotel.id,
      periodKey: state.calendar.dateKey.slice(0, 7),
    });
    render(<FinanceDashboard view={view} />);
    for (const name of [
      "Profit and loss",
      "Cashflow",
      "Balance sheet",
      "Loans",
      "Investments",
      "Cost analysis",
      "Insurance",
    ])
      expect(screen.getByRole("region", { name })).toBeTruthy();
    expect(
      screen.getAllByText(/\+DEM.600\.00.*gain/)[0].getAttribute("data-trend"),
    ).toBe("gain");
    expect(
      screen.getByText(/Operating profit fell because Wages/),
    ).toBeTruthy();
    expect(screen.getByText(/No loans are outstanding/)).toBeTruthy();
    expect(screen.getByText(/No insurance policies/)).toBeTruthy();
  });

  it("localizes cost drivers, renovation phases, perils, and claim statuses", () => {
    const state = createInitialGameState(4);
    state.finance.ledger = [
      { day: 1, account: "wages", amountMinor: -60_000, memo: "wages" },
      { day: 1, account: "utilities", amountMinor: -20_000, memo: "power" },
    ];
    const view = financeView({
      ...state,
      company: state.company,
      hotelId: state.hotel.id,
      periodKey: state.calendar.dateKey.slice(0, 7),
    });
    view.investments.renovation = {
      id: "renovation.1",
      phase: "construction",
      targetModuleId: "module.1",
    };
    view.policies = [
      {
        id: "policy.1",
        peril: "fire",
        insuredValueMinor: 1_000,
        limitMinor: 1_000,
        deductibleMinor: 100,
        annualRateBasisPoints: 100,
        exclusions: [],
      },
    ];
    view.claims = [
      {
        id: "claim.1",
        policyId: "policy.1",
        perilId: "fire",
        lossMinor: 500,
        filedAtMinutes: 0,
        assessmentMinutes: 5,
        status: "filed",
        settlementMinor: 0,
        settledAtMinutes: null,
      },
    ];
    render(<FinanceDashboard view={view} locale="de-DE" />);
    expect(
      screen.getByText(/Das Betriebsergebnis sank wegen Löhne \(75%\)/),
    ).toBeTruthy();
    expect(screen.getByText(/renovation.1: Bau, Ziel module.1/)).toBeTruthy();
    expect(screen.getByText(/Feuer:/)).toBeTruthy();
    expect(screen.getByText(/claim.1: eingereicht/)).toBeTruthy();
  });
});
