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
      screen.getByText(/Operating profit fell because wages/),
    ).toBeTruthy();
    expect(screen.getByText(/No loans are outstanding/)).toBeTruthy();
    expect(screen.getByText(/No insurance policies/)).toBeTruthy();
  });
});
