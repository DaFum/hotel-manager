export type DifficultyId = "beginner" | "standard" | "expert";
export interface DifficultyInputs {
  startingCapitalBasisPoints: number;
  creditSpreadBasisPoints: number;
  guestToleranceBasisPoints: number;
  forecastAccuracyBasisPoints: number;
  laborScarcityBasisPoints: number;
  crisisBufferBasisPoints: number;
  competitorAggressionBasisPoints: number;
  eventFrequencyBasisPoints: number;
  assistanceBasisPoints: number;
}
export interface SandboxOptions {
  economicVolatilityBasisPoints: number;
  crisisFrequencyBasisPoints: number;
  competitorAggressionBasisPoints: number;
  startingCapitalBasisPoints: number;
  technologySpeedBasisPoints: number;
  constructionVolatilityBasisPoints: number;
  informationAccuracyBasisPoints: number;
}
export interface CampaignConfig {
  startDateKey: "1991-01-01";
  cityId: "city.frankfurt.de";
  hotelId: "hotel.frankfurt.1";
  difficulty: DifficultyId;
  inputs: DifficultyInputs;
  sandbox: SandboxOptions;
}
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
export function createCampaignConfig(
  difficulty: DifficultyId = "standard",
  sandbox: Partial<SandboxOptions> = {},
): Readonly<CampaignConfig> {
  return Object.freeze({
    startDateKey: "1991-01-01",
    cityId: "city.frankfurt.de",
    hotelId: "hotel.frankfurt.1",
    difficulty,
    inputs: { ...DIFFICULTY_PRESETS[difficulty] },
    sandbox: { ...DEFAULT_SANDBOX, ...sandbox },
  });
}
export function adjustedStartingCapitalMinor(
  base: number,
  config: CampaignConfig,
): number {
  return Math.trunc(
    (((base * config.inputs.startingCapitalBasisPoints) / 10000) *
      config.sandbox.startingCapitalBasisPoints) /
      10000,
  );
}
