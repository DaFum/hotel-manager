import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { MINUTES_PER_DAY } from "../domain/calendar";
import type { FacilityRecord } from "../simulation/initialState";

export interface HotelDepthScenarioResult {
  days: number;
  /** Conferences that actually moved in during the run. */
  conferences: number;
  /** Breakfast covers demanded on the busiest conference day. */
  breakfastDemand: number;
  /** Conference housekeeping minutes charged on the heaviest day. */
  housekeepingMinutes: number;
  /** Lift trips on that day. */
  elevatorTrips: number;
  /** The facility board as it stood on that day. */
  facilities: FacilityRecord[];
  /** Linen still in circulation at the end of the run. */
  linen: { clean: number; dirty: number };
  stars: number;
}

const QUANTA_PER_DAY = MINUTES_PER_DAY / QUANTUM_MINUTES;

/**
 * Runs the real simulation and records the house on its busiest conference
 * day. The point is causal, not cosmetic: a signed conference has to arrive
 * as breakfast covers, housekeeping minutes and lift trips in the same state.
 */
export function runHotelDepthScenario(
  days: number,
  seed = 424242,
): HotelDepthScenarioResult {
  const sim = new GameSimulation(createInitialGameState(seed));
  // The deep facilities need their own roster before they can absorb a group.
  for (const role of ["wellness", "security", "housekeeping"] as const)
    sim.queueCommand({
      type: "HIRE",
      role,
      shift: "morning",
      monthlyWageMinor: 250_000,
    });

  const seenEvents = new Set<string>();
  // Conference housekeeping is real work: the shift starts eating it in the
  // same quantum it is booked, so the peak is what the event actually cost.
  let peakEventHousekeeping = 0;
  let best: HotelDepthScenarioResult | null = null;

  for (let quantum = 0; quantum < days * QUANTA_PER_DAY; quantum++) {
    sim.advanceQuantum();
    const s = sim.state;
    const running = s.events.filter((e) => e.status === "running");
    if (running.length === 0) continue;
    for (const e of running) seenEvents.add(e.id);
    peakEventHousekeeping = Math.max(
      peakEventHousekeeping,
      s.eventHousekeepingMinutes + s.eventHousekeepingWorkedMinutes,
    );
    const breakfast = s.facilities.find(
      (f) => f.id === "facility.breakfast_room",
    );
    const candidate: HotelDepthScenarioResult = {
      days,
      conferences: seenEvents.size,
      breakfastDemand: breakfast?.demand ?? 0,
      housekeepingMinutes: peakEventHousekeeping,
      elevatorTrips: s.elevatorTrips,
      facilities: structuredClone(s.facilities),
      linen: { ...s.linen },
      stars: s.classification.stars,
    };
    if (
      !best ||
      candidate.breakfastDemand + candidate.elevatorTrips >
        best.breakfastDemand + best.elevatorTrips
    )
      best = candidate;
  }

  const s = sim.state;
  return (
    best ?? {
      days,
      conferences: seenEvents.size,
      breakfastDemand: 0,
      housekeepingMinutes: 0,
      elevatorTrips: 0,
      facilities: structuredClone(s.facilities),
      linen: { ...s.linen },
      stars: s.classification.stars,
    }
  );
}
