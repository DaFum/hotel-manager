import { assertBasisPoints, assertNonNegativeMinor } from "../domain/units";

/**
 * A decision whose answer arrives years later. The opportunity stores what was
 * put in and resolves against what the company turned out to be worth, so
 * there is no pre-decided right answer waiting to be guessed.
 */
export interface StrategicOpportunity {
  id: string;
  openedDateKey: string;
  resolveDateKey: string;
  investedMinor: number;
  companyValueMultiplierBasisPoints: number;
  status: "open" | "invested" | "resolved";
}

export function resolveInvestmentOutcome(input: {
  investedMinor: number;
  companyValueMultiplierBasisPoints: number;
}): number {
  assertNonNegativeMinor(input.investedMinor, "invested amount");
  assertBasisPoints(
    input.companyValueMultiplierBasisPoints,
    "company value multiplier",
  );
  const value = Math.trunc(
    (input.investedMinor * input.companyValueMultiplierBasisPoints) / 10_000,
  );
  if (!Number.isSafeInteger(value))
    throw new Error("invalid opportunity value");
  const outcome = value - input.investedMinor;
  if (!Number.isSafeInteger(outcome))
    throw new Error("invalid opportunity outcome");
  return outcome;
}
