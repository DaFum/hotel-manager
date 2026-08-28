import type { SaveEnvelope } from "../saveVersions";

export function migrateV16ToV17(save: SaveEnvelope): SaveEnvelope {
  const oldState = save.state as Record<string, any>;
  const oldLoan = oldState.loan;
  const migratedLoan = oldLoan
    ? {
        id: oldLoan.id ?? "loan.starter",
        principalMinor: oldLoan.principalMinor,
        annualRateBasisPoints: oldLoan.annualRateBasisPoints,
        termMonths: oldLoan.termMonths,
        amortisation: oldLoan.amortisation ?? "bullet",
        rateType: oldLoan.rateType ?? "fixed",
        spreadBasisPoints: oldLoan.spreadBasisPoints ?? 0,
        startMonthIndex: oldLoan.startMonthIndex ?? 0,
        collateralValueMinor: oldLoan.collateralValueMinor ?? 0,
      }
    : {
        id: "loan.starter",
        principalMinor: 0,
        annualRateBasisPoints: 0,
        termMonths: 12,
        amortisation: "bullet",
        rateType: "fixed",
        spreadBasisPoints: 0,
        startMonthIndex: 0,
        collateralValueMinor: 0,
      };

  const { loan, ...restState } = oldState;

  const newState = {
    ...restState,
    loans: [migratedLoan],
    finance: {
      ...restState.finance,
      paymentHistory: restState.finance?.paymentHistory ?? {
        onTimePayments: 0,
        missedPayments: 0,
        consecutiveMissedPayments: 0,
      },
    },
  };

  return {
    ...save,
    saveVersion: 17,
    state: newState,
  };
}
