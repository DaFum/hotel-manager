import { availableThroughput } from "../facilities/capacity";
import { seatTurns } from "./seating";

/** The bar and lounge trade from 17:00 to midnight. */
export const BAR_OPEN_MINUTE = 1020;
export const BAR_CLOSE_MINUTE = 1440;
/** A lounge guest holds a seat for about an hour. */
export const BAR_STAY_MINUTES = 60;
/** Covers one barkeeper can pour across the whole service. */
export const COVERS_PER_BARKEEPER = 40;

export interface BarInput {
  seats: number;
  /** Barkeepers on the shift. */
  staffed: number;
  demand: number;
  minuteOfDay: number;
}

/**
 * Bar throughput uses the same tightest-constraint contract as every other
 * facility: room, equipment behind the counter, and staff on the shift.
 */
export function barCovers(x: BarInput): number {
  if (x.minuteOfDay < BAR_OPEN_MINUTE || x.minuteOfDay >= BAR_CLOSE_MINUTE)
    return 0;
  const turns = seatTurns(BAR_CLOSE_MINUTE - BAR_OPEN_MINUTE, BAR_STAY_MINUTES);
  const seatCapacity = Math.max(0, x.seats) * turns;
  const capacity = availableThroughput({
    space: seatCapacity,
    equipment: seatCapacity,
    staffed: Math.max(0, x.staffed) * COVERS_PER_BARKEEPER,
  });
  return Math.max(0, Math.min(x.demand, capacity));
}

export function barRevenueMinor(covers: number, coverMinor: number): number {
  if (!Number.isInteger(coverMinor)) throw new Error("minor units required");
  return Math.max(0, covers) * coverMinor;
}
