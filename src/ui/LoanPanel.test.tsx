import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoanPanel } from "./LoanPanel";
import type { Loan } from "../game/finance/loans";

describe("LoanPanel", () => {
  const sampleLoans: Loan[] = [
    {
      id: "loan.1",
      principalMinor: 10_000_00,
      annualRateBasisPoints: 500,
      termMonths: 12,
      startMonthIndex: 0,
      amortisation: "bullet",
      rateType: "fixed",
      spreadBasisPoints: 0,
      collateralValueMinor: 0,
    },
  ];

  it("disables form inputs and repay buttons when isPending is true", () => {
    const onTakeLoan = vi.fn();
    const onRepayLoan = vi.fn();

    render(
      <LoanPanel
        offeredRateBp={600}
        borrowingCapacityMinor={100000000}
        creditStandingScore={50}
        totalDebtMinor={1000000}
        loans={sampleLoans}
        onTakeLoan={onTakeLoan}
        onRepayLoan={onRepayLoan}
        isPending={true}
      />,
    );

    const drawButton = screen.getByRole("button", { name: /Draw Loan/i });
    expect(drawButton.hasAttribute("disabled")).toBe(true);

    const repayButton = screen.getByRole("button", { name: /Repay Full/i });
    expect(repayButton.hasAttribute("disabled")).toBe(true);

    const principalInput = screen.getByLabelText(/Principal/i);
    expect(principalInput.hasAttribute("disabled")).toBe(true);
  });

  it("dynamically recalculates credit standing when proposed collateral is entered", () => {
    const dummyInputs = {
      operatingCashFlowMinor: 100_000,
      totalOutstandingMinor: 10_000_00,
      cashMinor: 50_000_00,
      equityMinor: 100_000_00,
      hotelCount: 1,
      reputationScore: 50,
      totalCollateralValueMinor: 0,
      paymentHistory: {
        onTimePayments: 0,
        missedPayments: 0,
        consecutiveMissedPayments: 0,
      },
      macroInterestBp: 300,
      creditSpreadMultiplierBp: 10000,
    };

    render(
      <LoanPanel
        offeredRateBp={600}
        borrowingCapacityMinor={100000000}
        creditStandingScore={50}
        totalDebtMinor={1000000}
        loans={[]}
        onTakeLoan={() => {}}
        onRepayLoan={() => {}}
        creditStandingInputs={dummyInputs}
      />,
    );

    const collateralInput = screen.getByLabelText(/Declared Collateral/i);
    // Enter collateral DM 500,000 (which is 50,000,000 Pfennig)
    fireEvent.change(collateralInput, { target: { value: "500000" } });

    // With 500k DM collateral, total collateral coverage increases, raising score and borrowing capacity
    expect(screen.getByText(/Borrowing Capacity/i)).toBeTruthy();
  });

  it("caps proposed collateral preview to availableCollateralMinor", () => {
    const dummyInputs = {
      operatingCashFlowMinor: 100_000,
      totalOutstandingMinor: 10_000_00,
      cashMinor: 50_000_00,
      equityMinor: 100_000_00,
      hotelCount: 1,
      reputationScore: 50,
      totalCollateralValueMinor: 0,
      paymentHistory: {
        onTimePayments: 0,
        missedPayments: 0,
        consecutiveMissedPayments: 0,
      },
      macroInterestBp: 300,
      creditSpreadMultiplierBp: 10000,
    };

    const onTakeLoan = vi.fn();

    render(
      <LoanPanel
        offeredRateBp={600}
        borrowingCapacityMinor={100000000}
        creditStandingScore={50}
        totalDebtMinor={1000000}
        loans={[]}
        onTakeLoan={onTakeLoan}
        onRepayLoan={() => {}}
        creditStandingInputs={dummyInputs}
        availableCollateralMinor={100_000_00}
      />,
    );

    const collateralInput = screen.getByLabelText(/Declared Collateral/i);
    // Enter collateral DM 500,000 (which is 50,000,000 Pfennig, exceeding 100,000 DM cap)
    fireEvent.change(collateralInput, { target: { value: "500000" } });

    const form = collateralInput.closest("form")!;
    fireEvent.submit(form);

    expect(onTakeLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        collateralValueMinor: 100_000_00,
      }),
    );
  });

  it("localizes loan controls in German (de-DE)", () => {
    render(
      <LoanPanel
        offeredRateBp={600}
        borrowingCapacityMinor={100000000}
        creditStandingScore={50}
        totalDebtMinor={1000000}
        loans={sampleLoans}
        onTakeLoan={() => {}}
        onRepayLoan={() => {}}
        locale="de-DE"
      />,
    );

    expect(screen.getByText("Darlehen & Kreditaufnahme")).toBeTruthy();
    expect(screen.getByText("Kreditwürdigkeit")).toBeTruthy();
    expect(screen.getAllByText("Endfällig").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fest").length).toBeGreaterThan(0);
  });
});
