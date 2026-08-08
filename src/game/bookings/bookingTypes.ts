export type BookingChannel =
  "directPhone" | "travelAgency" | "corporate" | "walkIn";

export type BookingStatus =
  "confirmed" | "cancelled" | "noShow" | "checkedIn" | "completed";

export interface Booking {
  id: string;
  roomsRequested: number;
  rateMinor: number;
  status: BookingStatus;
}

export interface ReservationRequest {
  id: string;
  roomsRequested: number;
  rateMinor: number;
  willingnessMinor: number;
}

export interface RoomInventory {
  availableRooms: number;
}

export interface SameDayInventory {
  cleanRooms: number;
  confirmedArrivals: number;
}
