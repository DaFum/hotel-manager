import { isChronicleEntry, type ChronicleEntry } from "../chronicle/chronicle";
import { MEDIA_CHANNELS, type MediaLandscape } from "../media/mediaLandscape";
import {
  DIFFICULTY_IDS,
  type CampaignConfig,
} from "../campaign/campaignConfig";
import type { CareerOutcomeState } from "../campaign/careerOutcome";
import type { PrestigeState } from "../prestige/prestige";
import type { KeyPerson } from "../people/careerProgression";
import type { AnnualProfitAccumulator } from "./narrativeState";

/**
 * What a persisted narrative section has to look like to be usable.
 *
 * `validateEnvelope` uses these guards before a save reaches simulation
 * arithmetic, so every persisted narrative is judged by one shape definition.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const wholeScore = (value: unknown): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 100;

const wholeBasisPoints = (value: unknown): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 1_000_000;

export function isValidChronicle(value: unknown): value is ChronicleEntry[] {
  return Array.isArray(value) && value.every(isChronicleEntry);
}

export function isValidMedia(value: unknown): value is MediaLandscape {
  return (
    isRecord(value) &&
    MEDIA_CHANNELS.every(
      (channel) =>
        typeof value[channel] === "number" &&
        Number.isSafeInteger(value[channel]) &&
        (value[channel] as number) >= 0 &&
        (value[channel] as number) <= 10_000,
    )
  );
}

export function isValidPrestige(value: unknown): value is PrestigeState {
  return (
    isRecord(value) &&
    wholeScore(value.personal) &&
    wholeScore(value.company) &&
    Array.isArray(value.causes)
  );
}

export function isValidCampaign(value: unknown): value is CampaignConfig {
  if (!isRecord(value)) return false;
  const { inputs, sandbox, difficulty } = value;
  return (
    (DIFFICULTY_IDS as readonly string[]).includes(difficulty as string) &&
    typeof value.startDateKey === "string" &&
    typeof value.cityId === "string" &&
    isRecord(inputs) &&
    Object.values(inputs).every(wholeBasisPoints) &&
    isRecord(sandbox) &&
    Object.values(sandbox).every(wholeBasisPoints)
  );
}

export function isValidCareer(value: unknown): value is CareerOutcomeState {
  if (!isRecord(value)) return false;
  return (
    ["healthy", "recoverable", "terminal"].includes(value.distress as string) &&
    Array.isArray(value.availableRecoveryPaths) &&
    typeof value.careerMilestone2026 === "boolean" &&
    typeof value.continueEndless === "boolean" &&
    typeof value.ended === "boolean"
  );
}

export function isValidAnnualProfit(
  value: unknown,
): value is AnnualProfitAccumulator {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.year) &&
    Number.isSafeInteger(value.operatingProfitMinor) &&
    Number.isSafeInteger(value.lastCompletedYearProfitMinor)
  );
}

/** A key person whose months in the job can still be counted upward. */
export function isValidKeyPerson(value: unknown): value is KeyPerson {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.staffId === "string" &&
    typeof value.role === "string" &&
    wholeScore(value.experience) &&
    wholeScore(value.leadership) &&
    typeof value.monthsInRole === "number" &&
    Number.isSafeInteger(value.monthsInRole) &&
    value.monthsInRole >= 0 &&
    Array.isArray(value.careerHistory)
  );
}
