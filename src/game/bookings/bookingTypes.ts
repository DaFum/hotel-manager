import type { RoomCategory } from "../revenue/rates";

export type BookingChannel =
  "directPhone" | "travelAgency" | "corporate" | "walkIn";

export type BookingStatus =
  "confirmed" | "cancelled" | "noShow" | "checkedIn" | "completed";

/** One step of a reservation's life, in the order it happened. */
export interface BookingStatusChange {
  status: BookingStatus;
  /** Simulated minutes since the start of the game. */
  atMinutes: number;
}

/**
 * What the hotel promised and what it may charge if the guest does not come.
 * These are the terms the booking was taken on, so they travel with it: a
 * cancellation is free or not according to what was agreed, not according to
 * whatever the policy happens to be on the day it is cancelled.
 */
export interface GuaranteeTerms {
  /** A guaranteed room is held all night; an unguaranteed one is not. */
  guaranteed: boolean;
  /** Days before arrival up to which cancelling costs nothing. */
  freeCancellationDays: number;
  /** Share of the first night charged on a late cancellation or no-show. */
  lateChargeBp: number;
}

/**
 * A reservation with the whole slice context it was taken in. Inventory,
 * explanation and replay all need to know what was sold, to whom, for when
 * and on what terms; reconstructing any of that afterwards from the state it
 * left behind is how a booking system starts lying.
 */
export interface Booking {
  id: string;
  roomsRequested: number;
  rateMinor: number;
  status: BookingStatus;
  /** How the booking reached the hotel. */
  channel: BookingChannel;
  /** People in the party, which is not the same as rooms. */
  partySize: number;
  segmentId: string;
  /** The rate category the rooms were held against. */
  category: RoomCategory;
  arrivalDateKey: string;
  nights: number;
  terms: GuaranteeTerms;
  /** Every status this booking has held, oldest first. */
  history: BookingStatusChange[];
}

export interface ReservationRequest {
  id: string;
  roomsRequested: number;
  rateMinor: number;
  willingnessMinor: number;
  channel: BookingChannel;
  partySize: number;
  segmentId: string;
  category: RoomCategory;
  arrivalDateKey: string;
  nights: number;
  terms: GuaranteeTerms;
  /** Game time the reservation was taken, for the first history entry. */
  atMinutes: number;
}

/** Rooms free in one category, asked date by date. */
export interface StayInventory {
  availableRoomsOn(dateKey: string): number;
}

export interface SameDayInventory {
  cleanRooms: number;
  confirmedArrivals: number;
}
