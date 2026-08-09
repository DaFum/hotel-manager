import { compareIds } from "../domain/ids";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
  assertScore,
} from "../domain/units";

/**
 * A party is who actually turns up: a number of people with one budget, one
 * set of needs and one memory of how the stay went. Modelling the party
 * rather than the booking is what lets a family of four be a different
 * problem from four business travellers.
 */
export interface GuestParty {
  id: string;
  segmentId: string;
  adults: number;
  children: number;
  /** What the party will pay per night before it looks elsewhere. */
  budgetPerNightMinor: number;
  /** Things this party actually needs; unmet needs cost satisfaction. */
  needs: string[];
  /** Things it would like; unmet preferences cost nothing but earn nothing. */
  preferences: string[];
  /** 0-100; how much can go wrong before it becomes a complaint. */
  tolerance: number;
  /** 0-100; how attached it already is to this house. */
  loyalty: number;
  /** The booking that brought it here. */
  bookingId: string;
}

export function createParty(input: GuestParty): GuestParty {
  if (!input.id) throw new Error("a party id is required");
  assertCount(input.adults, "adults");
  assertCount(input.children, "children");
  if (input.adults === 0) throw new Error("a party needs at least one adult");
  assertNonNegativeMinor(input.budgetPerNightMinor, "party budget");
  assertScore(input.tolerance, "party tolerance");
  assertScore(input.loyalty, "party loyalty");
  return {
    ...input,
    needs: [...input.needs].sort(),
    preferences: [...input.preferences].sort(),
  };
}

export function partySize(party: GuestParty): number {
  return party.adults + party.children;
}

/**
 * How a party weighs one house against the alternatives. Nothing here is a
 * single quality number: price, fit, availability, reputation, visibility and
 * loyalty each pull separately, and the result carries the reason.
 */
export interface ComparisonInput {
  hotelId: string;
  ratePerNightMinor: number;
  available: boolean;
  /** 0-100 how well the room product suits this party. */
  fit: number;
  /** 0-100 what the party has heard about the house. */
  reputation: number;
  /** 0-100 how visible the house is on the channel the party is using. */
  channelVisibility: number;
  /** Needs the house can actually meet. */
  meetsNeeds: string[];
}

export interface ComparisonResult {
  hotelId: string;
  score: number;
  /** Why it scored what it did, in the order the party weighed them. */
  reasons: string[];
  eligible: boolean;
}

/**
 * Scores one option. Unavailable or over-budget is not a low score, it is a
 * refusal — a party does not book a room it cannot have or afford.
 */
export function compareOption(
  party: GuestParty,
  option: ComparisonInput,
): ComparisonResult {
  const reasons: string[] = [];
  if (!option.available)
    return {
      hotelId: option.hotelId,
      score: 0,
      reasons: ["no room available"],
      eligible: false,
    };
  if (option.ratePerNightMinor > party.budgetPerNightMinor)
    return {
      hotelId: option.hotelId,
      score: 0,
      reasons: [
        `asking ${option.ratePerNightMinor} against a budget of ${party.budgetPerNightMinor}`,
      ],
      eligible: false,
    };

  // Value: what is left of the budget after the rate, as a share of it.
  const valueScore = Math.trunc(
    ((party.budgetPerNightMinor - option.ratePerNightMinor) * 100) /
      Math.max(1, party.budgetPerNightMinor),
  );
  reasons.push(`value ${valueScore}`);

  const unmet = party.needs.filter((need) => !option.meetsNeeds.includes(need));
  const needScore =
    party.needs.length === 0
      ? 100
      : Math.trunc(
          ((party.needs.length - unmet.length) * 100) / party.needs.length,
        );
  reasons.push(
    unmet.length === 0 ? "every need met" : `unmet: ${unmet.join(", ")}`,
  );
  reasons.push(`fit ${option.fit}`);
  reasons.push(`reputation ${option.reputation}`);
  reasons.push(`visibility ${option.channelVisibility}`);
  if (party.loyalty > 0) reasons.push(`loyalty ${party.loyalty}`);

  const score = Math.trunc(
    (valueScore * 25 +
      needScore * 30 +
      option.fit * 15 +
      option.reputation * 15 +
      option.channelVisibility * 10 +
      party.loyalty * 5) /
      100,
  );
  return { hotelId: option.hotelId, score, reasons, eligible: true };
}

/**
 * Which house the party picks. Ties break on hotel id so the same shortlist
 * always produces the same choice, whatever order it was assembled in.
 */
export function chooseOption(
  party: GuestParty,
  options: readonly ComparisonInput[],
): ComparisonResult | null {
  const scored = options
    .map((option) => compareOption(party, option))
    .filter((result) => result.eligible)
    .sort((a, b) => b.score - a.score || compareIds(a.hotelId, b.hotelId));
  return scored[0] ?? null;
}

/** Every stage of a stay that can go right or wrong on its own. */
export const STAY_STAGES = [
  "arrival",
  "checkIn",
  "room",
  "service",
  "checkOut",
] as const;

export type StayStage = (typeof STAY_STAGES)[number];

/** One thing that happened at one stage, and what it did. */
export interface StayEvent {
  stage: StayStage;
  cause: string;
  /** Satisfaction points, signed. */
  delta: number;
}

export interface StayRecordDetail {
  partyId: string;
  bookingId: string;
  roomId: string | null;
  /** Early arrivals and late departures are handled, not refused silently. */
  earlyArrival: boolean;
  lateDeparture: boolean;
  luggageStored: boolean;
  conciergeRequests: string[];
  roomChanges: number;
  lostAndFound: string[];
  events: StayEvent[];
  /** 0-100, and only what actually happened moves it. */
  satisfaction: number;
}

export function beginStay(input: {
  partyId: string;
  bookingId: string;
  roomId: string | null;
}): StayRecordDetail {
  return {
    ...input,
    earlyArrival: false,
    lateDeparture: false,
    luggageStored: false,
    conciergeRequests: [],
    roomChanges: 0,
    lostAndFound: [],
    events: [],
    satisfaction: 70,
  };
}

/**
 * Records something that happened. The contributor stays on the record: a
 * satisfaction score that cannot name its causes is a number the player can
 * do nothing about.
 */
export function recordStayEvent(
  stay: StayRecordDetail,
  event: StayEvent,
): StayRecordDetail {
  if (!event.cause) throw new Error("a stay event needs a cause");
  return {
    ...stay,
    events: [...stay.events, event],
    satisfaction: Math.max(0, Math.min(100, stay.satisfaction + event.delta)),
  };
}

/** What happened at one stage, for the explanation surfaces. */
export function contributorsForStage(
  stay: StayRecordDetail,
  stage: StayStage,
): StayEvent[] {
  return stay.events.filter((event) => event.stage === stage);
}

/**
 * Whether the party leaves a review, and what it says. Tolerance is the gate:
 * a forgiving party has to be treated much worse before it says anything.
 */
export function reviewScore(
  party: GuestParty,
  stay: StayRecordDetail,
): { leaves: boolean; score: number; reasons: string[] } {
  const worstEvents = [...stay.events]
    .filter((event) => event.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);
  const leaves =
    stay.satisfaction >= 85 || stay.satisfaction <= 100 - party.tolerance;
  return {
    leaves,
    score: stay.satisfaction,
    reasons: worstEvents.map((event) => `${event.stage}: ${event.cause}`),
  };
}

/** How the stay changed the party's attachment to the house. */
export function loyaltyAfterStay(
  party: GuestParty,
  stay: StayRecordDetail,
): number {
  const delta = stay.satisfaction >= 75 ? 5 : stay.satisfaction <= 45 ? -12 : 0;
  return Math.max(0, Math.min(100, party.loyalty + delta));
}

export interface GuestRelationsState {
  parties: GuestParty[];
  stays: StayRecordDetail[];
  /** Items handed in and not yet claimed, oldest first. */
  lostAndFound: { id: string; description: string; foundDateKey: string }[];
}

export function createGuestRelationsState(): GuestRelationsState {
  return { parties: [], stays: [], lostAndFound: [] };
}

export function registerParty(
  state: GuestRelationsState,
  party: GuestParty,
): GuestRelationsState {
  if (state.parties.some((p) => p.id === party.id))
    throw new Error(`party ${party.id} already exists`);
  return {
    ...state,
    parties: [...state.parties, party].sort((a, b) => compareIds(a.id, b.id)),
  };
}

/** Room-night demand a party actually places; children share the room. */
export function roomsNeeded(party: GuestParty, occupancyPerRoom = 2): number {
  assertCount(occupancyPerRoom, "occupancy per room");
  if (occupancyPerRoom === 0) throw new Error("invalid occupancy per room");
  return Math.ceil(partySize(party) / occupancyPerRoom);
}

/** Willingness to pay, adjusted for how attached the party already is. */
export function effectiveBudgetMinor(party: GuestParty): number {
  const loyaltyBp = party.loyalty * 20;
  assertBasisPoints(loyaltyBp, "loyalty premium");
  return Math.trunc(
    (party.budgetPerNightMinor * (10_000 + loyaltyBp)) / 10_000,
  );
}
