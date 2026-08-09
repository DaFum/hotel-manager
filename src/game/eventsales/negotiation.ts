import { addDays } from "../domain/calendar";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";
import { contractValueMinor, type ContractLines } from "./contracts";

/**
 * Selling a conference is a negotiation, not a price list. What the deposit
 * is, when the client may still walk away, and what the house keeps if they
 * do are all terms — and the city hears about a good congress long after it
 * has gone home.
 */
export interface EventTerms {
  /** Share of the contract taken up front, in basis points. */
  depositBasisPoints: number;
  /** Days before the event the client may cancel without penalty. */
  freeCancellationDays: number;
  /** Share of the contract kept on a late cancellation, in basis points. */
  cancellationFeeBasisPoints: number;
}

export const STANDARD_TERMS: EventTerms = {
  depositBasisPoints: 2500,
  freeCancellationDays: 30,
  cancellationFeeBasisPoints: 5000,
};

export function depositMinor(
  lines: ContractLines,
  terms: EventTerms = STANDARD_TERMS,
): number {
  assertBasisPoints(terms.depositBasisPoints, "deposit share");
  return Math.trunc(
    (contractValueMinor(lines) * terms.depositBasisPoints) / 10_000,
  );
}

/**
 * What the house keeps when the client cancels. Inside the free window it is
 * the deposit back and nothing kept; outside it, the agreed fee — which is
 * what makes the free window worth negotiating over.
 */
export function cancellationSettlementMinor(input: {
  lines: ContractLines;
  terms?: EventTerms;
  startDateKey: string;
  cancelledOnDateKey: string;
}): { keptMinor: number; refundedMinor: number; cause: string } {
  const terms = input.terms ?? STANDARD_TERMS;
  assertBasisPoints(terms.cancellationFeeBasisPoints, "cancellation fee");
  const value = contractValueMinor(input.lines);
  const deposit = depositMinor(input.lines, terms);
  const freeUntil = addDays(input.startDateKey, -terms.freeCancellationDays);
  if (input.cancelledOnDateKey <= freeUntil)
    return {
      keptMinor: 0,
      refundedMinor: deposit,
      cause: `cancelled on or before ${freeUntil}, inside the free window`,
    };
  const keptMinor = Math.min(
    deposit,
    Math.trunc((value * terms.cancellationFeeBasisPoints) / 10_000),
  );
  return {
    keptMinor,
    refundedMinor: deposit - keptMinor,
    cause: `cancelled after ${freeUntil}, ${terms.cancellationFeeBasisPoints}bp fee applies`,
  };
}

/**
 * How hard the day itself hits. An event is not a flat load: it peaks at
 * arrival, at the coffee breaks and at the dinner, and the peak is what the
 * house has to be staffed for.
 */
export function executionPeaks(input: {
  guests: number;
  sessionCount: number;
}): { minuteOfDay: number; covers: number; cause: string }[] {
  assertCount(input.guests, "event guests");
  assertCount(input.sessionCount, "sessions");
  const peaks = [
    { minuteOfDay: 510, covers: input.guests, cause: "delegate arrival" },
    { minuteOfDay: 630, covers: input.guests, cause: "morning coffee" },
    { minuteOfDay: 750, covers: input.guests, cause: "lunch" },
  ];
  // Each further session adds an afternoon break of its own.
  for (let session = 1; session < input.sessionCount; session += 1)
    peaks.push({
      minuteOfDay: 900 + session * 60,
      covers: Math.trunc(input.guests / 2),
      cause: `break after session ${session}`,
    });
  return peaks;
}

/**
 * What a congress does for the city, and when. A successful event brings
 * business back months later, which is why an event's value is never fully
 * visible in the month it ran.
 */
export const CITY_EFFECT_LAG_DAYS = 120;

export function delayedCityEffect(input: {
  guests: number;
  satisfaction: number;
  startDateKey: string;
}): { fromDateKey: string; extraRoomNights: number; cause: string } {
  assertCount(input.guests, "event guests");
  // Only an event the delegates enjoyed brings anybody back.
  const extraRoomNights =
    input.satisfaction < 60
      ? 0
      : Math.trunc((input.guests * (input.satisfaction - 60)) / 100);
  return {
    fromDateKey: addDays(input.startDateKey, CITY_EFFECT_LAG_DAYS),
    extraRoomNights,
    cause:
      extraRoomNights === 0
        ? "the congress left no impression worth returning for"
        : `${input.guests} delegates rated the congress ${input.satisfaction}`,
  };
}

/** What the technology line has to actually provide for the money. */
export function technologyRequirements(input: {
  guests: number;
  sessionCount: number;
}): { item: string; quantity: number }[] {
  assertCount(input.guests, "event guests");
  return [
    { item: "microphone", quantity: Math.max(1, input.sessionCount) },
    { item: "projector", quantity: Math.max(1, input.sessionCount) },
    { item: "interpreter-booth", quantity: input.guests >= 150 ? 2 : 0 },
  ].filter((line) => line.quantity > 0);
}

/**
 * The rate the house will actually take. A bigger booking earns a discount,
 * and the floor stops a salesperson giving the hall away to fill a diary.
 */
export function negotiatedRateMinor(input: {
  listRateMinor: number;
  guests: number;
  floorBasisPoints: number;
}): { rateMinor: number; discountBasisPoints: number } {
  assertNonNegativeMinor(input.listRateMinor, "list rate");
  assertBasisPoints(input.floorBasisPoints, "negotiation floor");
  const earned = Math.min(2500, Math.trunc(input.guests / 4) * 100);
  const discountBasisPoints = Math.min(
    earned,
    Math.max(0, 10_000 - input.floorBasisPoints),
  );
  return {
    rateMinor: Math.trunc(
      (input.listRateMinor * (10_000 - discountBasisPoints)) / 10_000,
    ),
    discountBasisPoints,
  };
}
