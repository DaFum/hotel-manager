import { contributionMinor } from "./menu";
import { seatedCovers } from "./seating";

/** Breakfast runs 06:30 to 10:30 local hotel time. */
export const BREAKFAST_OPEN_MINUTE = 390;
export const BREAKFAST_CLOSE_MINUTE = 630;
/** A breakfast guest holds a seat for about half an hour. */
export const BREAKFAST_STAY_MINUTES = 30;

export interface BreakfastInput {
  demand: number;
  seats: number;
  kitchenCovers: number;
  stock: number;
  priceMinor: number;
  minuteOfDay?: number;
  /** Seats a conference or group has blocked for the whole service. */
  reservedSeats?: number;
  /** Recipe cost per cover, in Pfennig. */
  ingredientMinor?: number;
}

export interface BreakfastResult {
  served: number;
  queue: number;
  stockLeft: number;
  revenueMinor: number;
  contributionMinor: number;
}

export function serveBreakfast(x: BreakfastInput): BreakfastResult {
  const minute = x.minuteOfDay ?? 480;
  if (minute < BREAKFAST_OPEN_MINUTE || minute >= BREAKFAST_CLOSE_MINUTE)
    return {
      served: 0,
      queue: 0,
      stockLeft: x.stock,
      revenueMinor: 0,
      contributionMinor: 0,
    };
  // Seats turn over across the service, so the room is not a hard headcount;
  // a group holding tables and the kitchen line are the real constraints.
  const capacity = seatedCovers({
    seats: x.seats,
    reservedSeats: x.reservedSeats ?? 0,
    walkIns: 0,
    serviceMinutes: BREAKFAST_CLOSE_MINUTE - BREAKFAST_OPEN_MINUTE,
    averageStayMinutes: BREAKFAST_STAY_MINUTES,
    kitchenCovers: x.kitchenCovers,
  });
  const served = Math.max(0, Math.min(x.demand, capacity, x.stock));
  return {
    served,
    queue: Math.max(0, x.demand - served),
    stockLeft: x.stock - served,
    revenueMinor: served * x.priceMinor,
    contributionMinor:
      served * contributionMinor(x.priceMinor, x.ingredientMinor ?? 0),
  };
}
