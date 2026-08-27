import { assertBasisPoints } from "../domain/units";
import { MAX_INFORMATION_QUALITY } from "../marketResearch/forecast";
import type { SandboxOptions } from "./campaignConfig";
import { scaled } from "./difficultyEffects";

/** Every sandbox lever is read here and nowhere else. */

export function volatilityScaledRange(
  width: number,
  sandbox: Pick<SandboxOptions, "economicVolatilityBasisPoints">,
): number {
  if (!Number.isSafeInteger(width) || width < 0)
    throw new Error("invalid macro range width");
  return Math.max(
    0,
    scaled(width, sandbox.economicVolatilityBasisPoints, "economic volatility"),
  );
}

export function frequencyScaledCrisisRiskBp(
  riskBp: number,
  sandbox: Pick<SandboxOptions, "crisisFrequencyBasisPoints">,
): number {
  assertBasisPoints(riskBp, "crisis risk");
  return Math.min(
    10_000,
    Math.max(
      0,
      scaled(riskBp, sandbox.crisisFrequencyBasisPoints, "crisis frequency"),
    ),
  );
}

export function aggressionScaledDiscountBp(
  discountBp: number,
  sandbox: Pick<SandboxOptions, "competitorAggressionBasisPoints">,
): number {
  assertBasisPoints(discountBp, "discount appetite");
  return Math.min(
    10_000,
    Math.max(
      0,
      scaled(
        discountBp,
        sandbox.competitorAggressionBasisPoints,
        "competitor aggression",
      ),
    ),
  );
}

export function speedScaledProgressMonths(
  months: number,
  sandbox: Pick<SandboxOptions, "technologySpeedBasisPoints">,
): number {
  if (!Number.isSafeInteger(months) || months < 0)
    throw new Error("invalid technology progress");
  return Math.max(
    0,
    scaled(months, sandbox.technologySpeedBasisPoints, "technology speed"),
  );
}

export function volatilityScaledCostMinor(
  costMinor: number,
  sandbox: Pick<SandboxOptions, "constructionVolatilityBasisPoints">,
): number {
  if (!Number.isSafeInteger(costMinor) || costMinor < 0)
    throw new Error("invalid construction cost");
  const result = scaled(
    costMinor,
    sandbox.constructionVolatilityBasisPoints,
    "construction volatility",
  );
  if (!Number.isSafeInteger(result))
    throw new Error("invalid construction cost");
  return result;
}

export function startingCapitalScaledMinor(
  capitalMinor: number,
  sandbox: Pick<SandboxOptions, "startingCapitalBasisPoints">,
): number {
  if (!Number.isSafeInteger(capitalMinor) || capitalMinor < 0)
    throw new Error("invalid starting capital");
  const result = scaled(
    capitalMinor,
    sandbox.startingCapitalBasisPoints,
    "sandbox starting capital",
  );
  if (!Number.isSafeInteger(result))
    throw new Error("invalid starting capital");
  return result;
}

export function volatilityScaledUncertaintyBp(
  uncertaintyBp: number,
  sandbox: Pick<SandboxOptions, "constructionVolatilityBasisPoints">,
): number {
  assertBasisPoints(uncertaintyBp, "construction uncertainty");
  return Math.min(
    10_000,
    Math.max(
      0,
      scaled(
        uncertaintyBp,
        sandbox.constructionVolatilityBasisPoints,
        "construction volatility",
      ),
    ),
  );
}

export function accuracyScaledForecastQuality(
  quality: number,
  sandbox: Pick<SandboxOptions, "informationAccuracyBasisPoints">,
): number {
  if (!Number.isFinite(quality)) throw new Error("invalid forecast quality");
  const bounded = Math.min(MAX_INFORMATION_QUALITY, Math.max(0, quality));
  return Math.min(
    MAX_INFORMATION_QUALITY,
    Math.max(
      0,
      scaled(
        bounded,
        sandbox.informationAccuracyBasisPoints,
        "information accuracy",
      ),
    ),
  );
}

/** Traceability map used by the exhaustive campaign test. */
export const SANDBOX_EFFECT_BY_LEVER: Record<keyof SandboxOptions, Function> = {
  economicVolatilityBasisPoints: volatilityScaledRange,
  crisisFrequencyBasisPoints: frequencyScaledCrisisRiskBp,
  competitorAggressionBasisPoints: aggressionScaledDiscountBp,
  startingCapitalBasisPoints: startingCapitalScaledMinor,
  technologySpeedBasisPoints: speedScaledProgressMonths,
  constructionVolatilityBasisPoints: volatilityScaledCostMinor,
  informationAccuracyBasisPoints: accuracyScaledForecastQuality,
};
