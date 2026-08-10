import { describe, expect, it } from "vitest";
import {
  adjustedForecastQuality,
  aggressionAdjustedUndercutBp,
  assistedCostMinor,
  bufferedCrisisRiskBp,
  firesNarrativeEvent,
  scarcityAdjustedPressureBp,
  toleratedSatisfactionDelta,
} from "./difficultyEffects";
import { DIFFICULTY_PRESETS, type DifficultyInputs } from "./campaignConfig";
import { MAX_PRESSURE_BP, MIN_PRESSURE_BP } from "../labor/market";
import { MAX_INFORMATION_QUALITY } from "../marketResearch/forecast";

const beginner = DIFFICULTY_PRESETS.beginner;
const standard = DIFFICULTY_PRESETS.standard;
const expert = DIFFICULTY_PRESETS.expert;

/** Every lever the presets declare, so a new one cannot be left unread. */
const LEVERS: readonly (keyof DifficultyInputs)[] = [
  "startingCapitalBasisPoints",
  "creditSpreadBasisPoints",
  "guestToleranceBasisPoints",
  "forecastAccuracyBasisPoints",
  "laborScarcityBasisPoints",
  "crisisBufferBasisPoints",
  "competitorAggressionBasisPoints",
  "eventFrequencyBasisPoints",
  "assistanceBasisPoints",
];

describe("difficulty effects", () => {
  it("leaves every lever neutral on the standard game", () => {
    for (const lever of LEVERS) expect(standard[lever]).toBe(10_000);
    expect(toleratedSatisfactionDelta(-8, standard)).toBe(-8);
    expect(adjustedForecastQuality(60, standard)).toBe(60);
    expect(scarcityAdjustedPressureBp(9_000, standard)).toBe(9_000);
    expect(bufferedCrisisRiskBp(4_000, standard)).toBe(4_000);
    expect(aggressionAdjustedUndercutBp(8_500, standard)).toBe(8_500);
    expect(assistedCostMinor(150_000, standard)).toBe(150_000);
    expect(firesNarrativeEvent(9_999, standard)).toBe(true);
  });

  it("forgives a failure on an easy world and punishes it on a hard one", () => {
    // The same slow check-in, read by more and less tolerant guests.
    const easy = toleratedSatisfactionDelta(-12, beginner);
    const hard = toleratedSatisfactionDelta(-12, expert);
    expect(easy).toBeGreaterThan(-12);
    expect(hard).toBeLessThan(-12);
    // Goodwill the hotel actually earned is never scaled by difficulty.
    expect(toleratedSatisfactionDelta(5, beginner)).toBe(5);
    expect(toleratedSatisfactionDelta(5, expert)).toBe(5);
    expect(toleratedSatisfactionDelta(0, expert)).toBe(0);
  });

  it("keeps a forecast inside the scale the band expects", () => {
    expect(adjustedForecastQuality(80, beginner)).toBeGreaterThan(80);
    expect(adjustedForecastQuality(80, expert)).toBeLessThan(80);
    // A generous lever cannot buy certainty beyond the top of the scale.
    expect(adjustedForecastQuality(100, beginner)).toBe(
      MAX_INFORMATION_QUALITY,
    );
    expect(adjustedForecastQuality(0, beginner)).toBe(0);
  });

  it("keeps wage pressure inside the labour market's own bounds", () => {
    expect(scarcityAdjustedPressureBp(12_000, expert)).toBeGreaterThan(12_000);
    expect(scarcityAdjustedPressureBp(12_000, beginner)).toBeLessThan(12_000);
    // One extreme setting cannot price staff out of the game either way.
    expect(scarcityAdjustedPressureBp(MAX_PRESSURE_BP, expert)).toBe(
      MAX_PRESSURE_BP,
    );
    expect(scarcityAdjustedPressureBp(MIN_PRESSURE_BP, beginner)).toBe(
      MIN_PRESSURE_BP,
    );
  });

  it("buffers a crisis without removing it or making it certain", () => {
    expect(bufferedCrisisRiskBp(5_000, beginner)).toBeLessThan(5_000);
    expect(bufferedCrisisRiskBp(5_000, expert)).toBeGreaterThan(5_000);
    expect(bufferedCrisisRiskBp(10_000, expert)).toBe(10_000);
    expect(bufferedCrisisRiskBp(0, expert)).toBe(0);
  });

  it("makes aggressive rivals react to a smaller undercut", () => {
    expect(aggressionAdjustedUndercutBp(8_500, expert)).toBeGreaterThan(8_500);
    expect(aggressionAdjustedUndercutBp(8_500, beginner)).toBeLessThan(8_500);
    // Charging the going rate is not undercutting anybody, however aggressive
    // the competitors are.
    expect(
      aggressionAdjustedUndercutBp(10_000, {
        competitorAggressionBasisPoints: 10_000,
      }),
    ).toBe(10_000);
  });

  it("turns a lower event frequency into quieter months, not other stories", () => {
    // At or above neutral every eligible story fires: the engine raises at
    // most one a month and there is nothing above that to give.
    for (const draw of [0, 5_000, 9_999])
      expect(firesNarrativeEvent(draw, expert)).toBe(true);
    // Beginner runs at 9000, so the top tenth of the draw range is a quiet
    // month and everything below it still tells its story.
    expect(firesNarrativeEvent(8_999, beginner)).toBe(true);
    expect(firesNarrativeEvent(9_000, beginner)).toBe(false);
    expect(firesNarrativeEvent(9_999, beginner)).toBe(false);
  });

  it("discounts professional help without ever making it free", () => {
    expect(assistedCostMinor(150_000, beginner)).toBeLessThan(150_000);
    expect(assistedCostMinor(150_000, expert)).toBeGreaterThan(150_000);
    // Rounded up, so a report always costs something a ledger can post.
    expect(assistedCostMinor(1, beginner)).toBe(1);
    expect(assistedCostMinor(0, beginner)).toBe(0);
  });

  it("refuses a lever that is not a basis point", () => {
    expect(() =>
      assistedCostMinor(1_000, { assistanceBasisPoints: -1 }),
    ).toThrow(/assistance/);
    // Zero assistance would divide by nothing rather than cost infinitely.
    expect(() =>
      assistedCostMinor(1_000, { assistanceBasisPoints: 0 }),
    ).toThrow(/assistance/);
    expect(() =>
      toleratedSatisfactionDelta(-1, { guestToleranceBasisPoints: 0 }),
    ).toThrow(/guest tolerance/);
  });
});
