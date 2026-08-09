/**
 * Domain events describe what happened, so unrelated systems can react without
 * importing each other.
 *
 * An event is a completed fact, never an intention: it is emitted after the
 * transition it describes has been written. Everything an event needs to be
 * understood later — when it happened, which entities it touched, and which
 * command, if any, caused it — travels on the envelope rather than being
 * reconstructed from the state it left behind.
 */

export type DomainEventPayload =
  // --- reservations and the guest journey --------------------------------
  | {
      type: "BOOKING_CONFIRMED";
      bookingId: string;
      arrivalDateKey: string;
      nights: number;
      category: string;
      roomsRequested: number;
      rateMinor: number;
      segmentId: string;
    }
  | { type: "BOOKING_CANCELLED"; bookingId: string; releasedRooms: number }
  | { type: "BOOKING_NO_SHOW"; bookingId: string; releasedRooms: number }
  | {
      type: "GUEST_CHECKED_IN";
      bookingId: string;
      roomId: string;
      waitedMinutes: number;
    }
  | { type: "GUEST_CHECKED_OUT"; bookingId: string; roomId: string }
  | { type: "COMPLAINT_RAISED"; complaintId: string; bookingId: string }
  | {
      type: "SERVICE_RECOVERY_APPLIED";
      complaintId: string;
      bookingId: string;
      costMinor: number;
    }
  // --- the physical hotel -------------------------------------------------
  | { type: "ROOM_STATE_CHANGED"; roomId: string; from: string; to: string }
  | { type: "FACILITY_CONSTRAINT_CHANGED"; facilityId: string; cause: string }
  | { type: "RENOVATION_STARTED"; projectId: string; targetModuleId: string }
  | { type: "RENOVATION_COMPLETED"; projectId: string; roomsAdded: number }
  | { type: "ASSET_FAILED"; assetId: string }
  | { type: "ASSET_REPAIRED"; assetId: string }
  | { type: "ASSET_SERVICED"; assetId: string; costMinor: number }
  // --- people, supply and money ------------------------------------------
  | { type: "STAFF_HIRED"; staffId: string; role: string; shift: string }
  | {
      type: "SUPPLY_ORDERED";
      sku: string;
      quantity: number;
      costMinor: number;
    }
  | { type: "SUPPLY_DELIVERED"; sku: string; quantity: number }
  | {
      type: "MONTH_CLOSED";
      periodKey: string;
      /** Operating profit for the closed period. */
      profitMinor: number;
      occupancyBasisPoints: number;
    }
  // --- conferences --------------------------------------------------------
  | {
      type: "CONFERENCE_BOOKED";
      eventId: string;
      guests: number;
      roomsBlocked: number;
      valueMinor: number;
    }
  | { type: "CONFERENCE_COMPLETED"; eventId: string; valueMinor: number }
  // --- the city and its rivals -------------------------------------------
  | { type: "CITY_MONTH_ADVANCED"; periodKey: string; roomNights: number }
  | {
      type: "MARKET_RESEARCH_PURCHASED";
      informationQuality: number;
      costMinor: number;
    }
  | { type: "COMPETITOR_ENTERED"; competitorId: string; rooms: number }
  | { type: "COMPETITOR_EXITED"; competitorId: string; releasedRooms: number }
  | {
      type: "TRANSPORT_ROUTE_CHANGED";
      mode: string;
      from: number;
      to: number;
    }
  // --- how the house is judged -------------------------------------------
  | { type: "CLASSIFICATION_CHANGED"; from: number; to: number }
  | { type: "SPECIALIZATION_SET"; specializationId: string | null }
  | { type: "FACILITY_EXPANDED"; area: string; addedSqm: number };

export type DomainEventType = DomainEventPayload["type"];

/**
 * Every transition the simulation must publish. The coverage test drives a
 * real game and requires each of these to actually appear, so adding a name
 * here is a commitment, not a declaration of intent.
 */
export const DOMAIN_EVENT_TYPES: readonly DomainEventType[] = [
  "BOOKING_CONFIRMED",
  "GUEST_CHECKED_IN",
  "GUEST_CHECKED_OUT",
  "COMPLAINT_RAISED",
  "ROOM_STATE_CHANGED",
  "FACILITY_CONSTRAINT_CHANGED",
  "RENOVATION_STARTED",
  "RENOVATION_COMPLETED",
  "ASSET_FAILED",
  "ASSET_REPAIRED",
  "ASSET_SERVICED",
  "STAFF_HIRED",
  "SUPPLY_ORDERED",
  "SUPPLY_DELIVERED",
  "MONTH_CLOSED",
  "CONFERENCE_BOOKED",
  "CONFERENCE_COMPLETED",
  "CITY_MONTH_ADVANCED",
  "MARKET_RESEARCH_PURCHASED",
  "COMPETITOR_ENTERED",
  "COMPETITOR_EXITED",
  "TRANSPORT_ROUTE_CHANGED",
  "CLASSIFICATION_CHANGED",
  "SPECIALIZATION_SET",
  "FACILITY_EXPANDED",
];

/**
 * Payloads that are typed and ready but have no reachable transition yet.
 *
 * All three belong to the reservation lifecycle. Cancellation and authorised
 * service recovery have no code path at all; the no-show emitter exists but
 * cannot currently fire, because a party that reaches the reception queue
 * never leaves it again unserved. The lifecycle task owns all three, and they
 * join DOMAIN_EVENT_TYPES in the commit that gives them a real cause.
 *
 * Naming them here keeps the gap visible instead of letting the coverage list
 * quietly under-state the contract.
 */
export const AWAITING_TRANSITION: readonly DomainEventType[] = [
  "BOOKING_CANCELLED",
  "BOOKING_NO_SHOW",
  "SERVICE_RECOVERY_APPLIED",
];

/** A completed fact, with everything needed to order and explain it. */
export interface DomainEvent {
  /** Stable identity derived from the monotonic sequence. */
  eventId: string;
  /** Emission order; never repeats and never goes backwards. */
  sequence: number;
  /** Simulated minutes since the start of the game. */
  atMinutes: number;
  /** Stable ids of the entities the transition touched, in a fixed order. */
  entities: readonly string[];
  /** The command that caused it, when a command did. */
  causedBy?: string;
  payload: DomainEventPayload;
}
