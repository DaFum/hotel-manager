import { assertCount, assertMinutes } from "../domain/units";
import { availableSeats } from "./menu";

/** How often a seat can be sold again during one service. */
export function seatTurns(
  serviceMinutes: number,
  averageStayMinutes: number,
): number {
  assertMinutes(serviceMinutes, "service minutes");
  assertMinutes(averageStayMinutes, "average stay minutes");
  if (averageStayMinutes <= 0) return 0;
  return Math.max(0, Math.floor(serviceMinutes / averageStayMinutes));
}

export interface SeatingInput {
  seats: number;
  /** Seats held for reservations for the whole service. */
  reservedSeats: number;
  /** Walk-ins already seated. */
  walkIns: number;
  serviceMinutes: number;
  averageStayMinutes: number;
  /** Covers the kitchen can actually plate in the service. */
  kitchenCovers: number;
}

/**
 * Covers an outlet can serve in one service. Room, turnover, and kitchen are
 * separate constraints, and the tightest one wins — the same contract the
 * facility capacity primitives use everywhere else.
 */
export function seatedCovers(x: SeatingInput): number {
  assertCount(x.kitchenCovers, "kitchen covers");
  const seatCapacity =
    availableSeats(x.seats, x.reservedSeats, x.walkIns) *
    seatTurns(x.serviceMinutes, x.averageStayMinutes);
  return Math.max(0, Math.min(seatCapacity, x.kitchenCovers));
}

/** Demand the outlet had to refuse; the number the player needs to see. */
export function turnedAwayCovers(demand: number, capacity: number): number {
  assertCount(demand, "demand covers");
  assertCount(capacity, "capacity covers");
  return Math.max(0, demand - capacity);
}

export function seatService(
  x: SeatingInput & { demand: number; isOpen: boolean },
) {
  assertCount(x.demand, "demand covers");
  const capacity = x.isOpen ? seatedCovers(x) : 0;
  const seated = Math.min(x.demand, capacity);
  return { seated, waitlisted: Math.max(0, x.demand - seated), capacity };
}
