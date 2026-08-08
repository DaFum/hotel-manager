export interface Loan {
  principalMinor: number;
  annualRateBasisPoints: number;
  termMonths: number;
}

export function drawLoan(
  principalMinor: number,
  annualRateBasisPoints: number,
  termMonths: number,
): Loan {
  if (!Number.isInteger(principalMinor) || principalMinor <= 0)
    throw new Error("invalid principal");
  if (annualRateBasisPoints < 0) throw new Error("invalid rate");
  if (!Number.isInteger(termMonths) || termMonths <= 0)
    throw new Error("invalid term");
  return { principalMinor, annualRateBasisPoints, termMonths };
}

export function accrueMonthlyInterestMinor(loan: Loan): number {
  return Math.round(
    (loan.principalMinor * loan.annualRateBasisPoints) / 10000 / 12,
  );
}

export function repayLoan(loan: Loan, amountMinor: number): Loan {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0)
    throw new Error("invalid repayment");
  if (amountMinor > loan.principalMinor)
    throw new Error("repayment exceeds principal");
  return { ...loan, principalMinor: loan.principalMinor - amountMinor };
}
