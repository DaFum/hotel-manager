import { describe, expect, it } from "vitest";
import { DEFAULT_SANDBOX, type SandboxOptions } from "./campaignConfig";
import {
  accuracyScaledForecastQuality,
  aggressionScaledDiscountBp,
  frequencyScaledCrisisRiskBp,
  SANDBOX_EFFECT_BY_LEVER,
  speedScaledProgressMonths,
  startingCapitalScaledMinor,
  volatilityScaledCostMinor,
  volatilityScaledRange,
  volatilityScaledUncertaintyBp,
} from "./sandboxEffects";

export const SANDBOX_LEVERS: readonly (keyof SandboxOptions)[] = [
  "economicVolatilityBasisPoints",
  "crisisFrequencyBasisPoints",
  "competitorAggressionBasisPoints",
  "startingCapitalBasisPoints",
  "technologySpeedBasisPoints",
  "constructionVolatilityBasisPoints",
  "informationAccuracyBasisPoints",
];

describe("sandbox effects consumption matrix", () => {
  it("(a) keeps every sandbox lever neutral at 10000bp", () => {
    for (const lever of SANDBOX_LEVERS)
      expect(DEFAULT_SANDBOX[lever]).toBe(10_000);
    expect(
      volatilityScaledRange(500, { economicVolatilityBasisPoints: 10_000 }),
    ).toBe(500);
    expect(
      frequencyScaledCrisisRiskBp(4_000, {
        crisisFrequencyBasisPoints: 10_000,
      }),
    ).toBe(4_000);
    expect(
      aggressionScaledDiscountBp(2_000, {
        competitorAggressionBasisPoints: 10_000,
      }),
    ).toBe(2_000);
    expect(
      startingCapitalScaledMinor(1_000, { startingCapitalBasisPoints: 10_000 }),
    ).toBe(1_000);
    expect(
      speedScaledProgressMonths(1, { technologySpeedBasisPoints: 10_000 }),
    ).toBe(1);
    expect(
      volatilityScaledCostMinor(1_000, {
        constructionVolatilityBasisPoints: 10_000,
      }),
    ).toBe(1_000);
    expect(
      volatilityScaledUncertaintyBp(2_000, {
        constructionVolatilityBasisPoints: 10_000,
      }),
    ).toBe(2_000);
    expect(
      accuracyScaledForecastQuality(50, {
        informationAccuracyBasisPoints: 10_000,
      }),
    ).toBe(50);
  });

  it("(b) scales low and high settings within consumer bounds", () => {
    expect(
      volatilityScaledRange(500, { economicVolatilityBasisPoints: 5_000 }),
    ).toBe(250);
    expect(
      volatilityScaledRange(500, { economicVolatilityBasisPoints: 20_000 }),
    ).toBe(1_000);
    expect(
      frequencyScaledCrisisRiskBp(8_000, {
        crisisFrequencyBasisPoints: 20_000,
      }),
    ).toBe(10_000);
    expect(
      aggressionScaledDiscountBp(8_000, {
        competitorAggressionBasisPoints: 20_000,
      }),
    ).toBe(10_000);
    expect(
      speedScaledProgressMonths(1, { technologySpeedBasisPoints: 5_000 }),
    ).toBe(0);
    expect(
      speedScaledProgressMonths(1, { technologySpeedBasisPoints: 20_000 }),
    ).toBe(2);
    expect(
      volatilityScaledCostMinor(1_000, {
        constructionVolatilityBasisPoints: 5_000,
      }),
    ).toBe(500);
    expect(
      volatilityScaledUncertaintyBp(8_000, {
        constructionVolatilityBasisPoints: 20_000,
      }),
    ).toBe(10_000);
    expect(
      accuracyScaledForecastQuality(80, {
        informationAccuracyBasisPoints: 20_000,
      }),
    ).toBe(100);
    expect(
      accuracyScaledForecastQuality(80, {
        informationAccuracyBasisPoints: 5_000,
      }),
    ).toBe(40);
  });

  it("refuses invalid inputs with the human-readable lever label", () => {
    expect(() =>
      volatilityScaledRange(1, { economicVolatilityBasisPoints: -1 }),
    ).toThrow(/economic volatility/);
    expect(() =>
      frequencyScaledCrisisRiskBp(1, { crisisFrequencyBasisPoints: -1 }),
    ).toThrow(/crisis frequency/);
    expect(() =>
      aggressionScaledDiscountBp(1, { competitorAggressionBasisPoints: -1 }),
    ).toThrow(/competitor aggression/);
    expect(() =>
      speedScaledProgressMonths(1, { technologySpeedBasisPoints: -1 }),
    ).toThrow(/technology speed/);
    expect(() =>
      volatilityScaledCostMinor(1, { constructionVolatilityBasisPoints: -1 }),
    ).toThrow(/construction volatility/);
    expect(() =>
      accuracyScaledForecastQuality(1, { informationAccuracyBasisPoints: -1 }),
    ).toThrow(/information accuracy/);
  });

  it("(c) has an exported effect for every declared sandbox lever", () => {
    expect(Object.keys(SANDBOX_EFFECT_BY_LEVER).sort()).toEqual(
      [...SANDBOX_LEVERS].sort(),
    );
    for (const lever of SANDBOX_LEVERS)
      expect(SANDBOX_EFFECT_BY_LEVER[lever]).toBeTypeOf("function");
  });
});
