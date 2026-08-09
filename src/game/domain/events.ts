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
  | { type: "FACILITY_EXPANDED"; area: string; addedSqm: number }
  | {
      type: "TECHNOLOGY_ADOPTION_STARTED";
      projectId: string;
      technologyId: string;
      costMinor: number;
    }
  | {
      type: "TECHNOLOGY_ADOPTION_COMPLETED";
      projectId: string;
      technologyId: string;
    }
  // --- the company above the hotels --------------------------------------
  | { type: "HOTEL_ADDED_TO_PORTFOLIO"; hotelId: string; legalEntityId: string }
  | { type: "HOTEL_REBRANDED"; hotelId: string; brandId: string | null }
  | {
      type: "BRAND_AUDIT_COMPLETED";
      hotelId: string;
      brandId: string;
      compliant: boolean;
      failures: readonly string[];
    }
  | { type: "OPERATING_MODEL_CHANGED"; hotelId: string; model: string }
  | {
      type: "HOTEL_BUDGET_SET";
      hotelId: string;
      periodKey: string;
      capexBudgetMinor: number;
    }
  | { type: "MANAGER_AUTHORITY_CHANGED"; hotelId: string; managerId: string }
  | {
      type: "DECISION_ESCALATED";
      escalationId: string;
      hotelId: string;
      reason: string;
    }
  | {
      type: "ESCALATION_RESOLVED";
      escalationId: string;
      hotelId: string;
      approved: boolean;
    }
  | {
      type: "INTERNAL_FUNDING_TRANSFERRED";
      hotelId: string;
      amountMinor: number;
      direction: string;
    }
  | {
      type: "DEVELOPMENT_STARTED";
      developmentId: string;
      rooms: number;
      investmentMinor: number;
    }
  | { type: "PRE_OPENING_TASK_COMPLETED"; developmentId: string; item: string }
  | {
      type: "HOTEL_OPENED";
      developmentId: string;
      hotelId: string;
      rooms: number;
    }
  | {
      type: "DUE_DILIGENCE_COMPLETED";
      targetId: string;
      areas: readonly string[];
      costMinor: number;
    }
  | {
      type: "HOTEL_ACQUIRED";
      targetId: string;
      hotelId: string;
      priceMinor: number;
    }
  | {
      type: "HOTEL_RESULT_PUBLISHED";
      hotelId: string;
      periodKey: string;
      grossOperatingProfitMinor: number;
    };

export type DomainEventType = DomainEventPayload["type"];

/**
 * Every transition the simulation must publish. The coverage test drives a
 * real game and requires each of these to actually appear, so listing a name
 * here is a commitment, not a declaration of intent.
 *
 * One entry per payload variant. A `Record` keyed by the union means adding a
 * variant without listing it here fails to compile, so the coverage test can
 * never silently pass over a transition nobody publishes.
 */
const EVENT_TYPE_REGISTRY: Record<DomainEventType, true> = {
  BOOKING_CONFIRMED: true,
  BOOKING_CANCELLED: true,
  BOOKING_NO_SHOW: true,
  GUEST_CHECKED_IN: true,
  GUEST_CHECKED_OUT: true,
  COMPLAINT_RAISED: true,
  SERVICE_RECOVERY_APPLIED: true,
  ROOM_STATE_CHANGED: true,
  FACILITY_CONSTRAINT_CHANGED: true,
  RENOVATION_STARTED: true,
  RENOVATION_COMPLETED: true,
  ASSET_FAILED: true,
  ASSET_REPAIRED: true,
  ASSET_SERVICED: true,
  STAFF_HIRED: true,
  SUPPLY_ORDERED: true,
  SUPPLY_DELIVERED: true,
  MONTH_CLOSED: true,
  CONFERENCE_BOOKED: true,
  CONFERENCE_COMPLETED: true,
  CITY_MONTH_ADVANCED: true,
  MARKET_RESEARCH_PURCHASED: true,
  COMPETITOR_ENTERED: true,
  COMPETITOR_EXITED: true,
  TRANSPORT_ROUTE_CHANGED: true,
  CLASSIFICATION_CHANGED: true,
  SPECIALIZATION_SET: true,
  FACILITY_EXPANDED: true,
  TECHNOLOGY_ADOPTION_STARTED: true,
  TECHNOLOGY_ADOPTION_COMPLETED: true,
  HOTEL_ADDED_TO_PORTFOLIO: true,
  HOTEL_REBRANDED: true,
  BRAND_AUDIT_COMPLETED: true,
  OPERATING_MODEL_CHANGED: true,
  HOTEL_BUDGET_SET: true,
  MANAGER_AUTHORITY_CHANGED: true,
  DECISION_ESCALATED: true,
  ESCALATION_RESOLVED: true,
  INTERNAL_FUNDING_TRANSFERRED: true,
  DEVELOPMENT_STARTED: true,
  PRE_OPENING_TASK_COMPLETED: true,
  HOTEL_OPENED: true,
  DUE_DILIGENCE_COMPLETED: true,
  HOTEL_ACQUIRED: true,
  HOTEL_RESULT_PUBLISHED: true,
};

export const DOMAIN_EVENT_TYPES: readonly DomainEventType[] = [
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_NO_SHOW",
  "GUEST_CHECKED_IN",
  "GUEST_CHECKED_OUT",
  "COMPLAINT_RAISED",
  "SERVICE_RECOVERY_APPLIED",
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
  "TECHNOLOGY_ADOPTION_STARTED",
  "TECHNOLOGY_ADOPTION_COMPLETED",
  "HOTEL_ADDED_TO_PORTFOLIO",
  "HOTEL_REBRANDED",
  "BRAND_AUDIT_COMPLETED",
  "OPERATING_MODEL_CHANGED",
  "HOTEL_BUDGET_SET",
  "MANAGER_AUTHORITY_CHANGED",
  "DECISION_ESCALATED",
  "ESCALATION_RESOLVED",
  "INTERNAL_FUNDING_TRANSFERRED",
  "DEVELOPMENT_STARTED",
  "PRE_OPENING_TASK_COMPLETED",
  "HOTEL_OPENED",
  "DUE_DILIGENCE_COMPLETED",
  "HOTEL_ACQUIRED",
  "HOTEL_RESULT_PUBLISHED",
];

// Retain the exhaustive record separately from the ordered public list. The
// record makes a new payload variant a compile error; the array keeps the
// established publication/coverage order stable for consumers.
void EVENT_TYPE_REGISTRY;

/**
 * Payloads that are typed and ready but have no reachable transition yet.
 *
 * Empty is the goal, and it is empty: the reservation lifecycle now gives
 * cancellation, no-show and authorised service recovery real causes. The list
 * stays so that a future payload added ahead of its transition has somewhere
 * honest to sit instead of quietly under-stating the coverage contract.
 */
export const AWAITING_TRANSITION: readonly DomainEventType[] = [];

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
