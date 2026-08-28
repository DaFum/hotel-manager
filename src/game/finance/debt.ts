import {
  assertBasisPoints,
  assertMinor,
  assertNonNegativeMinor,
} from "../domain/units";
import type { Loan } from "./loans";

/**
 * Debt as a schedule rather than a balance. What matters to a hotel is not
 * how much it owes but when it has to pay, and how much of each payment is
 * interest that buys nothing.
 */
/** The longest a lender will ever write; fifty years, in months. */
export const MAX_TERM_MONTHS = 600;

export interface DebtInstalment {
  month: number;
  openingPrincipalMinor: number;
  interestMinor: number;
  principalMinor: number;
  closingPrincipalMinor: number;
}

/**
 * One bound, under two names. A restructuring that was allowed to run past
 * what `debtSchedule` will write would produce a loan nobody can draw up a
 * payment plan for, so both gates have to be the same number.
 */
export const MAX_LOAN_TERM_MONTHS = MAX_TERM_MONTHS;

function gcdBigInt(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function annuityTargetInstalment(
  principalMinor: number,
  annualRateBasisPoints: number,
  termMonths: number,
): number {
  if (annualRateBasisPoints <= 0) {
    return Math.trunc(principalMinor / termMonths);
  }
  const rNum = BigInt(annualRateBasisPoints);
  const rDen = 120000n;
  const n0 = rDen + rNum;
  const d0 = rDen;
  const g = gcdBigInt(n0, d0);
  const n = n0 / g;
  const d = d0 / g;
  const exponent = BigInt(termMonths);
  const nPow = n ** exponent;
  const dPow = d ** exponent;
  const p = BigInt(principalMinor);

  const num = p * rNum * nPow;
  const den = rDen * (nPow - dPow);
  return Number((num + den / 2n) / den);
}

/**
 * Amortisation of principal with interest on the balance outstanding.
 * Supports "linear", "annuity", and "bullet" profiles.
 * Integer arithmetic throughout; the last instalment absorbs the remainder so
 * the schedule always closes at exactly zero.
 */
export function debtSchedule(loan: Loan): DebtInstalment[] {
  assertNonNegativeMinor(loan.principalMinor, "loan principal");
  assertBasisPoints(loan.annualRateBasisPoints, "loan rate");
  if (
    !Number.isSafeInteger(loan.termMonths) ||
    loan.termMonths <= 0 ||
    loan.termMonths > MAX_TERM_MONTHS
  )
    throw new Error("invalid loan term");

  const schedule: DebtInstalment[] = [];
  let outstanding = loan.principalMinor;

  if (loan.amortisation === "bullet") {
    for (let month = 1; month <= loan.termMonths; month += 1) {
      const interestMinor = roundedRateMinor(
        outstanding,
        loan.annualRateBasisPoints,
      );
      const principalMinor = month === loan.termMonths ? outstanding : 0;
      schedule.push({
        month,
        openingPrincipalMinor: outstanding,
        interestMinor,
        principalMinor,
        closingPrincipalMinor: outstanding - principalMinor,
      });
      outstanding -= principalMinor;
    }
  } else if (loan.amortisation === "annuity") {
    const targetInstalment = annuityTargetInstalment(
      loan.principalMinor,
      loan.annualRateBasisPoints,
      loan.termMonths,
    );

    for (let month = 1; month <= loan.termMonths; month += 1) {
      const interestMinor = roundedRateMinor(
        outstanding,
        loan.annualRateBasisPoints,
      );
      let principalMinor = 0;
      if (month === loan.termMonths) {
        principalMinor = outstanding;
      } else {
        const calculatedPrincipal = Math.max(
          0,
          targetInstalment - interestMinor,
        );
        principalMinor = Math.min(calculatedPrincipal, outstanding);
      }

      schedule.push({
        month,
        openingPrincipalMinor: outstanding,
        interestMinor,
        principalMinor,
        closingPrincipalMinor: outstanding - principalMinor,
      });
      outstanding -= principalMinor;
    }
  } else {
    // Default / "linear": straight-line equal principal per month
    const perMonth = Math.trunc(loan.principalMinor / loan.termMonths);
    for (let month = 1; month <= loan.termMonths; month += 1) {
      const interestMinor = roundedRateMinor(
        outstanding,
        loan.annualRateBasisPoints,
      );
      const principalMinor =
        month === loan.termMonths
          ? outstanding
          : Math.min(perMonth, outstanding);
      schedule.push({
        month,
        openingPrincipalMinor: outstanding,
        interestMinor,
        principalMinor,
        closingPrincipalMinor: outstanding - principalMinor,
      });
      outstanding -= principalMinor;
    }
  }

  return schedule;
}

function roundedRateMinor(
  outstandingMinor: number,
  annualRateBasisPoints: number,
): number {
  const divisor = 120_000;
  const quotient = Math.trunc(outstandingMinor / divisor);
  if (
    annualRateBasisPoints > 0 &&
    quotient > Math.trunc(Number.MAX_SAFE_INTEGER / annualRateBasisPoints)
  )
    throw new Error("invalid monthly interest");
  const remainder = outstandingMinor % divisor;
  return assertNonNegativeMinor(
    quotient * annualRateBasisPoints +
      Math.round((remainder * annualRateBasisPoints) / divisor),
    "monthly interest",
  );
}

/** What the lender would actually get back if it took the security today. */
export function collateralCoverageBasisPoints(input: {
  outstandingMinor: number;
  collateralValueMinor: number;
}): number {
  assertNonNegativeMinor(input.outstandingMinor, "outstanding debt");
  assertNonNegativeMinor(input.collateralValueMinor, "collateral value");
  if (input.outstandingMinor === 0) return 10_000;
  return Math.trunc(
    (input.collateralValueMinor * 10_000) / input.outstandingMinor,
  );
}

/**
 * Insolvency is being unable to pay, not having had a bad month. Negative
 * equity on its own is survivable for a long time; an unpayable bill is not.
 */
export function isInsolvent(input: {
  cashMinor: number;
  payablesMinor: number;
  equityMinor: number;
}): boolean {
  assertMinor(input.cashMinor, "cash");
  assertNonNegativeMinor(input.payablesMinor, "payables");
  return input.cashMinor < input.payablesMinor && input.equityMinor < 0;
}

/**
 * Buys time, at a price. Restructuring never forgives principal: the lender
 * spreads the same money over longer and charges more for the privilege.
 */
export function restructure(
  loan: Loan,
  terms: { extraMonths: number; penaltyBasisPoints?: number },
): Loan {
  if (!Number.isSafeInteger(terms.extraMonths) || terms.extraMonths <= 0)
    throw new Error("a restructuring must add extra months");
  const penalty = terms.penaltyBasisPoints ?? 0;
  assertBasisPoints(penalty, "restructuring penalty");
  const annualRateBasisPoints = assertBasisPoints(
    loan.annualRateBasisPoints + penalty,
    "restructured rate",
  );
  const termMonths = loan.termMonths + terms.extraMonths;
  if (!Number.isSafeInteger(termMonths)) throw new Error("invalid loan term");
  if (termMonths > MAX_LOAN_TERM_MONTHS)
    throw new Error("loan term exceeds maximum");
  return {
    ...loan,
    annualRateBasisPoints,
    termMonths,
  };
}
