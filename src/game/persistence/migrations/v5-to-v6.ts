import type { SaveEnvelope } from "../saveVersions";
import {
  createNarrativeState,
  type AnnualProfitAccumulator,
  type NarrativeState,
} from "../../narrative/narrativeState";
import type { CareerFacts } from "../../campaign/careerOutcome";
import { createRngStreams } from "../../domain/rng";
import { CREDIT_LINE_MINOR } from "../../campaign/recovery";
import { STARTER_HOTEL } from "../../content/1991/starterHotel";

/**
 * v6 adds the campaign: its configuration, the story state it accumulates and
 * the seeded stream those stories are drawn from.
 *
 * A v5 save has none of it, and a save written by a development v6 build may
 * have half of it. Both are brought to a complete, valid v6 shape here rather
 * than being trusted, because the loader downstream requires every section.
 */
export function migrateV5ToV6<T extends { saveVersion: 5 }>(
  oldSave: T,
): Omit<T, "saveVersion"> & { saveVersion: 6; narrative: NarrativeState };
export function migrateV5ToV6(oldSave: SaveEnvelope): SaveEnvelope;
export function migrateV5ToV6(
  oldSave: SaveEnvelope | ({ saveVersion: 5 } & Record<string, unknown>),
): SaveEnvelope | ({ saveVersion: 6 } & Record<string, unknown>) {
  if ("state" in oldSave) {
    const state = structuredClone(
      (oldSave.state ?? {}) as Record<string, unknown>,
    );
    const seed = typeof state.seed === "number" ? state.seed : 0;
    const narrativeSeed = createRngStreams(seed).narrative.state;
    const previousRng = record(oldSave.rngState);
    const rngState = {
      ...previousRng,
      narrative: safeInteger(previousRng.narrative, narrativeSeed),
    } as unknown as SaveEnvelope["rngState"];
    state.rngState = { ...rngState };
    return {
      ...oldSave,
      saveVersion: 6,
      contentVersion: "plan-06-v6",
      protocolVersion: 2,
      rngState,
      state: {
        ...state,
        narrative: normaliseNarrative(state.narrative, careerFactsFor(state)),
      },
    };
  }
  return {
    ...oldSave,
    saveVersion: 6,
    narrative: normaliseNarrative(oldSave.narrative, careerFactsFor(oldSave)),
  };
}

/**
 * The career reading a migrated save should have had. Derived from the state
 * being carried forward, never from the optimistic constants a fresh game
 * starts with: a save that was already in trouble must still be in trouble.
 */
function careerFactsFor(state: Record<string, unknown>): CareerFacts {
  const finance = record(state.finance);
  const loan = record(state.loan);
  const company = record(state.company);
  const portfolio = record(company.portfolio);
  const hotel = record(state.hotel);
  const calendar = record(state.calendar);
  const hotelIds = Array.isArray(portfolio.hotelIds)
    ? (portfolio.hotelIds as unknown[]).filter(
        (id): id is string => typeof id === "string",
      )
    : [];
  const workforce = record(state.workforce);
  const employees = Array.isArray(workforce.employees)
    ? (workforce.employees as Record<string, unknown>[])
    : [];
  const dateKey =
    typeof calendar.dateKey === "string" ? calendar.dateKey : "1991-01-01";
  const principal = safeInteger(
    loan.principalMinor,
    STARTER_HOTEL.startingLoan.principalMinor,
  );
  return {
    netLiquidityMinor:
      safeInteger(finance.cashMinor, STARTER_HOTEL.startingCashMinor) -
      safeInteger(finance.payableMinor, 0),
    creditHeadroomMinor: Math.max(0, CREDIT_LINE_MINOR - principal),
    // Whatever is in the portfolio beyond the house being simulated.
    sellableHotelCount: hotelIds.filter((id) => id !== hotel.id).length,
    reducibleStaffCount: Math.max(
      0,
      employees.filter((e) => e.status === "working").length - 1,
    ),
    year: Number(dateKey.slice(0, 4)) || 1991,
  };
}

/**
 * Brings one narrative section to a complete shape. Every field is guarded on
 * its own: a malformed campaign or a career written by an older build is
 * replaced by the bootstrap value rather than being spread through, which is
 * what stops a half-written save from failing validation on load.
 */
export function normaliseNarrative(
  value: unknown,
  career: CareerFacts,
): NarrativeState {
  const defaults = createNarrativeState({ career });
  const partial = isRecord(value) ? (value as Partial<NarrativeState>) : {};
  return {
    chronicle: array(partial.chronicle, defaults.chronicle),
    activeEvents: array(partial.activeEvents, defaults.activeEvents),
    achievedMilestones: array(
      partial.achievedMilestones,
      defaults.achievedMilestones,
    ).filter((id): id is string => typeof id === "string"),
    lastFiredByDefinition: isRecord(partial.lastFiredByDefinition)
      ? partial.lastFiredByDefinition
      : defaults.lastFiredByDefinition,
    annualProfit: annualProfit(partial.annualProfit, defaults.annualProfit),
    rivals: array(partial.rivals, defaults.rivals),
    keyPeople: array(partial.keyPeople, defaults.keyPeople),
    media: isRecord(partial.media) ? partial.media : defaults.media,
    prestige:
      isRecord(partial.prestige) &&
      Number.isSafeInteger((partial.prestige as { personal?: number }).personal)
        ? partial.prestige
        : defaults.prestige,
    opportunities: array(partial.opportunities, defaults.opportunities),
    // Configuration and career reading are the two a wrong value would make
    // the run unreplayable, so both are all-or-nothing.
    campaign: isRecord(partial.campaign) ? partial.campaign : defaults.campaign,
    career: isRecord(partial.career) ? partial.career : defaults.career,
  };
}

function annualProfit(
  value: unknown,
  fallback: AnnualProfitAccumulator,
): AnnualProfitAccumulator {
  if (!isRecord(value)) return fallback;
  const candidate = value as Partial<AnnualProfitAccumulator>;
  return Number.isSafeInteger(candidate.year) &&
    Number.isSafeInteger(candidate.operatingProfitMinor) &&
    Number.isSafeInteger(candidate.lastCompletedYearProfitMinor)
    ? (candidate as AnnualProfitAccumulator)
    : fallback;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const record = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const array = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const safeInteger = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isSafeInteger(value) ? value : fallback;
