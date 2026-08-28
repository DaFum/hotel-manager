export type LoanAmortisation = "annuity" | "linear" | "bullet";
export type LoanRateType = "fixed" | "variable";

export interface Loan {
  id: string;
  principalMinor: number;
  annualRateBasisPoints: number;
  termMonths: number;
  amortisation: LoanAmortisation;
  rateType: LoanRateType;
  spreadBasisPoints: number;
  startMonthIndex: number;
  collateralValueMinor: number;
}

export function drawLoan(
  principalMinor: number,
  annualRateBasisPoints: number,
  termMonths: number,
  options: {
    id?: string;
    amortisation?: LoanAmortisation;
    rateType?: LoanRateType;
    spreadBasisPoints?: number;
    startMonthIndex?: number;
    collateralValueMinor?: number;
  } = {},
): Loan {
  if (!Number.isSafeInteger(principalMinor) || principalMinor <= 0)
    throw new Error("invalid principal");
  if (!Number.isSafeInteger(annualRateBasisPoints) || annualRateBasisPoints < 0)
    throw new Error("invalid rate");
  if (!Number.isSafeInteger(termMonths) || termMonths <= 0)
    throw new Error("invalid term");

  const id =
    options.id ??
    `loan.${principalMinor}.${annualRateBasisPoints}.${termMonths}`;
  const amortisation = options.amortisation ?? "bullet";
  const rateType = options.rateType ?? "fixed";
  const spreadBasisPoints = options.spreadBasisPoints ?? 0;
  const startMonthIndex = options.startMonthIndex ?? 0;
  const collateralValueMinor = options.collateralValueMinor ?? 0;

  if (!["annuity", "linear", "bullet"].includes(amortisation))
    throw new Error("invalid amortisation profile");
  if (!["fixed", "variable"].includes(rateType))
    throw new Error("invalid rate type");
  if (!Number.isSafeInteger(spreadBasisPoints) || spreadBasisPoints < 0)
    throw new Error("invalid spread basis points");
  if (!Number.isSafeInteger(startMonthIndex) || startMonthIndex < 0)
    throw new Error("invalid start month index");
  if (!Number.isSafeInteger(collateralValueMinor) || collateralValueMinor < 0)
    throw new Error("invalid collateral value");

  return {
    id,
    principalMinor,
    annualRateBasisPoints,
    termMonths,
    amortisation,
    rateType,
    spreadBasisPoints,
    startMonthIndex,
    collateralValueMinor,
  };
}

export function accrueMonthlyInterestMinor(loan: Loan): number {
  const numerator = loan.principalMinor * loan.annualRateBasisPoints;
  if (!Number.isSafeInteger(numerator))
    throw new Error("loan interest exceeds the safe integer range");
  return Math.round(numerator / 10000 / 12);
}

export function repayLoan(loan: Loan, amountMinor: number): Loan {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
    throw new Error("invalid repayment");
  if (amountMinor === 0) return loan;
  if (amountMinor > loan.principalMinor)
    throw new Error("repayment exceeds principal");
  return { ...loan, principalMinor: loan.principalMinor - amountMinor };
}
