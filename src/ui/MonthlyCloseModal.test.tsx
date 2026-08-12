import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { closeMonth } from "../game/finance/monthlyClose";
import { MonthlyCloseModal } from "./MonthlyCloseModal";

const report = () => ({
  ...closeMonth({
    periodKey: "1991-01",
    openingCashMinor: 100_000,
    closingCashMinor: 120_000,
    roomRevenueMinor: 90_000,
    otherRevenueMinor: 10_000,
    operatingExpenseMinor: 80_000,
    soldRoomNights: 10,
    availableRoomNights: 20,
  }),
  whatWentWell: [
    {
      labelKey: "finance.monthlyClose.causes.eventRevenueMinorRecord",
      values: { amountMinor: 10_000 },
      amountMinor: 10_000,
      direction: "favourable" as const,
    },
  ],
});

describe("MonthlyCloseModal", () => {
  it("is absent without a report and presents the three questions with KPIs", () => {
    const { rerender } = render(
      <MonthlyCloseModal report={null} onDismiss={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<MonthlyCloseModal report={report()} onDismiss={vi.fn()} />);
    expect(
      screen.getByRole("dialog", { hidden: true }).getAttribute("aria-label"),
    ).toMatch(/monthly close/i);
    expect(screen.getByText("What went well?")).toBeTruthy();
    expect(screen.getByText("What went badly?")).toBeTruthy();
    expect(screen.getByText("What is changing?")).toBeTruthy();
    expect(
      screen.getByText(/Conference business set a new record/),
    ).toBeTruthy();
    expect(screen.getByText("ADR")).toBeTruthy();
  });

  it("renders a dedicated empty state for every empty section", () => {
    render(
      <MonthlyCloseModal
        report={{ ...report(), whatWentWell: [] }}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/No standout positive/)).toBeTruthy();
    expect(screen.getByText(/No standout adverse/)).toBeTruthy();
    expect(screen.getByText(/No material near-term/)).toBeTruthy();
  });
});
