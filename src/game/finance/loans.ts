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
  if (!Number.isSafeInteger(principalMinor) || principalMinor <= 0)
    throw new Error("invalid principal");
  if (!Number.isSafeInteger(annualRateBasisPoints) || annualRateBasisPoints < 0)
    throw new Error("invalid rate");
  if (!Number.isSafeInteger(termMonths) || termMonths <= 0)
    throw new Error("invalid term");
  return { principalMinor, annualRateBasisPoints, termMonths };
}

export function accrueMonthlyInterestMinor(loan: Loan): number {
  const numerator = loan.principalMinor * loan.annualRateBasisPoints;
  if (!Number.isSafeInteger(numerator))
    throw new Error("loan interest exceeds the safe integer range");
  return Math.round(numerator / 10000 / 12);
}

export function repayLoan(loan: Loan, amountMinor: number): Loan {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0)
    throw new Error("invalid repayment");
  if (amountMinor > loan.principalMinor)
    throw new Error("repayment exceeds principal");
  return { ...loan, principalMinor: loan.principalMinor - amountMinor };
}
