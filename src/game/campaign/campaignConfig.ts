import { assertBasisPoints, assertMinor } from "../domain/units";

export type DifficultyId = "beginner" | "standard" | "expert";

/**
 * Every lever a difficulty is allowed to pull, all of them disclosed. There is
 * no entry here for hidden AI money or hidden AI knowledge, because a harder
 * game must be a harder world rather than a cheating opponent.
 */
export interface DifficultyInputs {
  readonly startingCapitalBasisPoints: number;
  readonly creditSpreadBasisPoints: number;
  readonly guestToleranceBasisPoints: number;
  readonly forecastAccuracyBasisPoints: number;
  readonly laborScarcityBasisPoints: number;
  readonly crisisBufferBasisPoints: number;
  readonly competitorAggressionBasisPoints: number;
  readonly eventFrequencyBasisPoints: number;
  readonly assistanceBasisPoints: number;
}

export interface SandboxOptions {
  readonly economicVolatilityBasisPoints: number;
  readonly crisisFrequencyBasisPoints: number;
  readonly competitorAggressionBasisPoints: number;
  readonly startingCapitalBasisPoints: number;
  readonly technologySpeedBasisPoints: number;
  readonly constructionVolatilityBasisPoints: number;
  readonly informationAccuracyBasisPoints: number;
}

export interface CampaignConfig {
  readonly startDateKey: "1991-01-01";
  readonly cityId: "city.frankfurt.de";
  readonly hotelId: "hotel.frankfurt.1";
  readonly difficulty: DifficultyId;
  readonly inputs: DifficultyInputs;
  readonly sandbox: SandboxOptions;
}

export const DIFFICULTY_IDS: readonly DifficultyId[] = [
  "beginner",
  "standard",
  "expert",
];

export const DIFFICULTY_PRESETS: Record<DifficultyId, DifficultyInputs> = {
  beginner: {
    startingCapitalBasisPoints: 14000,
    creditSpreadBasisPoints: 7500,
    guestToleranceBasisPoints: 12000,
    forecastAccuracyBasisPoints: 12000,
    laborScarcityBasisPoints: 8000,
    crisisBufferBasisPoints: 13000,
    competitorAggressionBasisPoints: 8500,
    eventFrequencyBasisPoints: 9000,
    assistanceBasisPoints: 14000,
  },
  standard: {
    startingCapitalBasisPoints: 10000,
    creditSpreadBasisPoints: 10000,
    guestToleranceBasisPoints: 10000,
    forecastAccuracyBasisPoints: 10000,
    laborScarcityBasisPoints: 10000,
    crisisBufferBasisPoints: 10000,
    competitorAggressionBasisPoints: 10000,
    eventFrequencyBasisPoints: 10000,
    assistanceBasisPoints: 10000,
  },
  expert: {
    startingCapitalBasisPoints: 7500,
    creditSpreadBasisPoints: 13000,
    guestToleranceBasisPoints: 8500,
    forecastAccuracyBasisPoints: 8000,
    laborScarcityBasisPoints: 12000,
    crisisBufferBasisPoints: 7500,
    competitorAggressionBasisPoints: 11500,
    eventFrequencyBasisPoints: 11500,
    assistanceBasisPoints: 6000,
  },
};

export const DEFAULT_SANDBOX: SandboxOptions = {
  economicVolatilityBasisPoints: 10000,
  crisisFrequencyBasisPoints: 10000,
  competitorAggressionBasisPoints: 10000,
  startingCapitalBasisPoints: 10000,
  technologySpeedBasisPoints: 10000,
  constructionVolatilityBasisPoints: 10000,
  informationAccuracyBasisPoints: 10000,
};

/**
 * Builds the campaign the player agreed to, once. Both nested objects are
 * frozen as well as the wrapper: a difficulty that could be edited mid-career
 * is not a difficulty, it is a cheat, and a replay could not reproduce it.
 */
export function createCampaignConfig(
  difficulty: DifficultyId = "standard",
  sandbox: Partial<SandboxOptions> = {},
): Readonly<CampaignConfig> {
  if (!DIFFICULTY_IDS.includes(difficulty))
    throw new Error(`unknown difficulty ${difficulty}`);
  const merged = { ...DEFAULT_SANDBOX, ...sandbox };
  for (const [key, value] of Object.entries(merged))
    assertBasisPoints(value, `sandbox ${key}`);
  return Object.freeze({
    startDateKey: "1991-01-01",
    cityId: "city.frankfurt.de",
    hotelId: "hotel.frankfurt.1",
    difficulty,
    inputs: Object.freeze({ ...DIFFICULTY_PRESETS[difficulty] }),
    sandbox: Object.freeze(merged),
  } as const);
}

/**
 * Difficulty and sandbox each scale the starting capital, and both are
 * disclosed before the first day. The result is money, so it has to survive
 * the same integer-Pfennig boundary as every other amount.
 */
export function adjustedStartingCapitalMinor(
  base: number,
  config: CampaignConfig,
): number {
  assertMinor(base, "starting capital");
  assertBasisPoints(
    config.inputs.startingCapitalBasisPoints,
    "difficulty starting capital",
  );
  assertBasisPoints(
    config.sandbox.startingCapitalBasisPoints,
    "sandbox starting capital",
  );
  const afterDifficulty =
    (base * config.inputs.startingCapitalBasisPoints) / 10_000;
  if (!Number.isFinite(afterDifficulty))
    throw new Error("invalid starting capital");
  const adjusted = Math.trunc(
    (afterDifficulty * config.sandbox.startingCapitalBasisPoints) / 10_000,
  );
  return assertMinor(adjusted, "adjusted starting capital");
}
