import { assertBasisPoints } from "../domain/units";
import type { DifficultyInputs } from "./campaignConfig";
import { MAX_PRESSURE_BP, MIN_PRESSURE_BP } from "../labor/market";
import { MAX_INFORMATION_QUALITY } from "../marketResearch/forecast";

/**
 * Where a difficulty actually lands.
 *
 * `DifficultyInputs` names nine levers and the presets give all nine a value,
 * but a value nothing reads is a promise the game does not keep: two runs that
 * should differ would play out identically. Every input is read here and
 * nowhere else, so each one can be traced from the preset to the system it
 * pulls, and a preset that grows a tenth lever fails to compile until it is
 * wired up too.
 *
 * Two of the nine are applied where the money is: `startingCapitalBasisPoints`
 * by `adjustedStartingCapitalMinor`, and `creditSpreadBasisPoints` on the
 * opening loan. The other seven are here.
 *
 * All of them are *disclosed* inputs on a world, never a hidden advantage for
 * an opponent: a harder game is a harder city, not a competitor who cheats.
 */

/** 10000 basis points is the standard game; every lever is neutral there. */
const NEUTRAL_BP = 10_000;

/**
 * Scales a value by a lever, truncating toward zero so a whole number stays
 * whole and a replay stays reproducible.
 */
function scaled(value: number, bp: number, label: string): number {
  assertBasisPoints(bp, label);
  return Math.trunc((value * bp) / NEUTRAL_BP);
}

/**
 * Inverts a lever: a value that should fall as the lever rises. Tolerance and
 * a crisis buffer both work this way — more of them means less of what they
 * protect against.
 */
function inverselyScaled(value: number, bp: number, label: string): number {
  assertBasisPoints(bp, label);
  if (bp === 0) throw new Error(`invalid ${label}`);
  return Math.trunc((value * NEUTRAL_BP) / bp);
}

/**
 * How much of a satisfaction knock the guests actually take. A tolerant city
 * forgives a slow check-in; an intolerant one does not, and the same failure
 * costs more. Only penalties are scaled: difficulty must not hand out goodwill
 * the hotel did not earn, so a gain passes through untouched.
 */
export function toleratedSatisfactionDelta(
  delta: number,
  inputs: Pick<DifficultyInputs, "guestToleranceBasisPoints">,
): number {
  if (!Number.isSafeInteger(delta))
    throw new Error("invalid satisfaction delta");
  if (delta >= 0) {
    assertBasisPoints(inputs.guestToleranceBasisPoints, "guest tolerance");
    return delta;
  }
  return -inverselyScaled(
    -delta,
    inputs.guestToleranceBasisPoints,
    "guest tolerance",
  );
}

/**
 * The information quality a forecast is actually drawn at. Research still has
 * to be bought; difficulty decides how much the same report tells you, and the
 * result stays inside the 0-100 scale `forecastBand` expects.
 */
export function adjustedForecastQuality(
  quality: number,
  inputs: Pick<DifficultyInputs, "forecastAccuracyBasisPoints">,
): number {
  if (!Number.isFinite(quality)) throw new Error("invalid quality");
  const bounded = Math.min(MAX_INFORMATION_QUALITY, Math.max(0, quality));
  return Math.min(
    MAX_INFORMATION_QUALITY,
    Math.max(
      0,
      scaled(bounded, inputs.forecastAccuracyBasisPoints, "forecast accuracy"),
    ),
  );
}

/**
 * What the city's wage pressure comes to once labour scarcity is applied. A
 * scarce market bids wages up for everybody, the player and the competitors
 * alike, and the result is clamped to the same bounds the labour market itself
 * enforces so one extreme setting cannot price staff out of the game.
 */
export function scarcityAdjustedPressureBp(
  pressureBp: number,
  inputs: Pick<DifficultyInputs, "laborScarcityBasisPoints">,
): number {
  assertBasisPoints(pressureBp, "wage pressure");
  return Math.min(
    MAX_PRESSURE_BP,
    Math.max(
      MIN_PRESSURE_BP,
      scaled(pressureBp, inputs.laborScarcityBasisPoints, "labor scarcity"),
    ),
  );
}

/**
 * The risk of a crisis after the buffer. The buffer is resilience, not luck: it
 * lowers how exposed the same balance sheet is, and it can neither remove the
 * risk entirely nor push it past certainty.
 */
export function bufferedCrisisRiskBp(
  riskBp: number,
  inputs: Pick<DifficultyInputs, "crisisBufferBasisPoints">,
): number {
  assertBasisPoints(riskBp, "crisis risk");
  return Math.min(
    NEUTRAL_BP,
    Math.max(
      0,
      inverselyScaled(riskBp, inputs.crisisBufferBasisPoints, "crisis buffer"),
    ),
  );
}

/**
 * How far below the market a rate has to fall before the rivals read it as a
 * price war. Aggressive competitors react to less, so the threshold rises with
 * aggression; it can never exceed the market rate itself, because a house
 * charging the going rate is not undercutting anybody.
 */
export function aggressionAdjustedUndercutBp(
  baseThresholdBp: number,
  inputs: Pick<DifficultyInputs, "competitorAggressionBasisPoints">,
): number {
  assertBasisPoints(baseThresholdBp, "undercut threshold");
  return Math.min(
    NEUTRAL_BP,
    Math.max(
      0,
      scaled(
        baseThresholdBp,
        inputs.competitorAggressionBasisPoints,
        "competitor aggression",
      ),
    ),
  );
}

/**
 * Whether a story is allowed to fire this month, given a fresh draw from the
 * narrative stream.
 *
 * At or above neutral every eligible story fires, because the engine raises at
 * most one a month and there is nothing above that to give. Below neutral the
 * lever is the chance of a quiet month, so a gentler game is a quieter one.
 */
export function firesNarrativeEvent(
  draw: number,
  inputs: Pick<DifficultyInputs, "eventFrequencyBasisPoints">,
): boolean {
  if (!Number.isSafeInteger(draw) || draw < 0)
    throw new Error("invalid narrative draw");
  assertBasisPoints(inputs.eventFrequencyBasisPoints, "event frequency");
  if (inputs.eventFrequencyBasisPoints >= NEUTRAL_BP) return true;
  return draw % NEUTRAL_BP < inputs.eventFrequencyBasisPoints;
}

/**
 * What professional help costs. Assistance is the one lever that makes an
 * easier game cheaper rather than gentler: advice and market research are
 * bought at a discount, and a hard game pays over the odds for the same
 * report. Rounded up to a whole Pfennig so help is never quietly free.
 */
export function assistedCostMinor(
  baseCostMinor: number,
  inputs: Pick<DifficultyInputs, "assistanceBasisPoints">,
): number {
  if (!Number.isSafeInteger(baseCostMinor) || baseCostMinor < 0)
    throw new Error("invalid assisted cost");
  assertBasisPoints(inputs.assistanceBasisPoints, "assistance");
  // No assistance at all would divide by nothing and price help at infinity,
  // which is not a harder game, it is an unpostable amount.
  if (inputs.assistanceBasisPoints === 0) throw new Error("invalid assistance");
  if (baseCostMinor === 0) return 0;
  // Both the scaled product and the rounded result are checked: two individually
  // valid numbers can multiply into an amount no ledger can post precisely.
  const scaledMinor = baseCostMinor * NEUTRAL_BP;
  if (!Number.isSafeInteger(scaledMinor))
    throw new Error("invalid assisted cost");
  const costMinor = Math.ceil(scaledMinor / inputs.assistanceBasisPoints);
  if (!Number.isSafeInteger(costMinor))
    throw new Error("invalid assisted cost");
  return Math.max(1, costMinor);
}
