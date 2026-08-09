import { addDays } from "../domain/calendar";
import { applyBasisPoints, assertNonNegativePfennig } from "../domain/money";
import type {
  Booking,
  BookingStatus,
  GuaranteeTerms,
  ReservationRequest,
  SameDayInventory,
  StayInventory,
} from "./bookingTypes";

export type {
  Booking,
  BookingChannel,
  BookingStatus,
  GuaranteeTerms,
  StayInventory,
} from "./bookingTypes";

/** Every date a stay occupies a room. Departure day is not one of them. */
export function stayDates(arrivalDateKey: string, nights: number): string[] {
  if (!Number.isSafeInteger(nights) || nights <= 0)
    throw new Error("a stay is at least one night");
  return Array.from({ length: nights }, (_, i) => addDays(arrivalDateKey, i));
}

/**
 * Takes a reservation, or refuses it.
 *
 * Inventory is checked on every date of the stay, not only on the arrival
 * day: a house that is full on the second night has not got the booking, and
 * finding that out on the second night is finding it out too late.
 */
export function reserve(
  inventory: StayInventory,
  r: ReservationRequest,
): Booking {
  if (!Number.isSafeInteger(r.roomsRequested) || r.roomsRequested <= 0)
    throw new Error("invalid rooms requested");
  if (!Number.isSafeInteger(r.partySize) || r.partySize <= 0)
    throw new Error("invalid party size");
  assertNonNegativePfennig(r.rateMinor, "rate");
  assertNonNegativePfennig(r.willingnessMinor, "willingness to pay");
  if (r.rateMinor > r.willingnessMinor) throw new Error("price rejected");
  // The terms are persisted and later drive arithmetic in phases that run
  // outside a command transaction, where a throw would not be rolled back.
  // They are checked here, at the one boundary that creates a booking.
  assertTerms(r.terms);

  for (const dateKey of stayDates(r.arrivalDateKey, r.nights))
    if (r.roomsRequested > inventory.availableRoomsOn(dateKey))
      throw new Error(`no inventory on ${dateKey}`);

  return {
    id: r.id,
    roomsRequested: r.roomsRequested,
    rateMinor: r.rateMinor,
    status: "confirmed",
    channel: r.channel,
    partySize: r.partySize,
    segmentId: r.segmentId,
    category: r.category,
    arrivalDateKey: r.arrivalDateKey,
    nights: r.nights,
    terms: r.terms,
    history: [{ status: "confirmed", atMinutes: r.atMinutes }],
    bookingDateKey: r.bookingDateKey ?? r.arrivalDateKey,
    ratePlanId: r.ratePlanId ?? "flexible",
    commissionBp: r.commissionBp ?? 0,
    depositMinor: r.depositMinor ?? 0,
    specialRequirements: [...(r.specialRequirements ?? [])].sort(),
  };
}

function assertTerms(terms: GuaranteeTerms): void {
  if (typeof terms?.guaranteed !== "boolean")
    throw new Error("a booking must say whether it is guaranteed");
  if (
    !Number.isSafeInteger(terms.freeCancellationDays) ||
    terms.freeCancellationDays < 0
  )
    throw new Error("free cancellation days must be whole and non-negative");
  if (
    !Number.isSafeInteger(terms.lateChargeBp) ||
    terms.lateChargeBp < 0 ||
    terms.lateChargeBp > 10000
  )
    throw new Error("the late charge must be basis points of one night");
}

function transition(
  b: Booking,
  from: readonly BookingStatus[],
  to: BookingStatus,
  atMinutes: number,
): Booking {
  if (!from.includes(b.status))
    throw new Error(`a ${b.status} booking cannot become ${to}`);
  return {
    ...b,
    status: to,
    history: [...b.history, { status: to, atMinutes }],
  };
}

export function cancel(b: Booking, atMinutes: number): Booking {
  return transition(b, ["confirmed"], "cancelled", atMinutes);
}

export function markNoShow(b: Booking, atMinutes: number): Booking {
  return transition(b, ["confirmed"], "noShow", atMinutes);
}

export function checkIn(b: Booking, atMinutes: number): Booking {
  return transition(b, ["confirmed"], "checkedIn", atMinutes);
}

export function checkOut(b: Booking, atMinutes: number): Booking {
  return transition(b, ["checkedIn"], "completed", atMinutes);
}

/**
 * Rooms a booking is holding out of sale. A booking that has ended — however
 * it ended — holds nothing, which is what makes release exact rather than
 * approximate.
 */
export function heldRooms(b: Booking): number {
  return b.status === "confirmed" || b.status === "checkedIn"
    ? b.roomsRequested
    : 0;
}

/** Whether a booking is still holding a room on a given date. */
export function holdsRoomOn(b: Booking, dateKey: string): boolean {
  return (
    heldRooms(b) > 0 &&
    b.arrivalDateKey <= dateKey &&
    addDays(b.arrivalDateKey, b.nights) > dateKey
  );
}

/**
 * What the hotel may charge when the guest does not come. Cancelling inside
 * the agreed window, or not turning up at all, costs the agreed share of the
 * first night; cancelling in good time costs nothing.
 */
export function lateChargeMinor(
  b: Booking,
  cancelledOnDateKey: string,
): number {
  const deadline = addDays(b.arrivalDateKey, -b.terms.freeCancellationDays);
  if (cancelledOnDateKey < deadline) return 0;
  return applyBasisPoints(b.rateMinor, b.terms.lateChargeBp);
}

export function canWalkIn(x: SameDayInventory): boolean {
  return x.cleanRooms - x.confirmedArrivals > 0;
}
