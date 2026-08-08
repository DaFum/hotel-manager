import type {
  Booking,
  ReservationRequest,
  RoomInventory,
  SameDayInventory,
} from "./bookingTypes";

export type { Booking, BookingChannel, BookingStatus } from "./bookingTypes";

export function reserve(inv: RoomInventory, r: ReservationRequest): Booking {
  if (!Number.isInteger(r.roomsRequested) || r.roomsRequested <= 0)
    throw new Error("invalid rooms requested");
  if (r.rateMinor > r.willingnessMinor) throw new Error("price rejected");
  if (r.roomsRequested > inv.availableRooms) throw new Error("no inventory");
  return {
    id: r.id,
    roomsRequested: r.roomsRequested,
    rateMinor: r.rateMinor,
    status: "confirmed",
  };
}

export function cancel(b: Booking): Booking {
  if (b.status !== "confirmed") throw new Error("not cancellable");
  return { ...b, status: "cancelled" };
}

export function markNoShow(b: Booking): Booking {
  if (b.status !== "confirmed") throw new Error("not a pending arrival");
  return { ...b, status: "noShow" };
}

export function canWalkIn(x: SameDayInventory): boolean {
  return x.cleanRooms - x.confirmedArrivals > 0;
}
