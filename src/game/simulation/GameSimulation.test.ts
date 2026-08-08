import { describe, expect, it } from "vitest";
import { GameSimulation, PHASE_ORDER } from "./GameSimulation";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import { createInitialGameState } from "./initialState";

describe("simulation order", () => {
  it("matches the MASTER deterministic phase contract exactly", () => {
    expect(PHASE_ORDER).toEqual([
      "commands",
      "time",
      "arrivalsDepartures",
      "roomState",
      "staffService",
      "facilityThroughput",
      "inventory",
      "maintenanceFailures",
      "satisfaction",
      "finance",
      "demandBookings",
      "events",
      "snapshot",
    ]);
  });

  it("advances the clock by one five minute quantum and rolls the day over", () => {
    expect(QUANTUM_MINUTES).toBe(5);
    expect(advanceClock({ dateKey: "1991-01-01", minuteOfDay: 0 })).toEqual({
      dateKey: "1991-01-01",
      minuteOfDay: 5,
    });
    expect(advanceClock({ dateKey: "1991-01-01", minuteOfDay: 1435 })).toEqual({
      dateKey: "1991-01-02",
      minuteOfDay: 0,
    });
  });

  it("drains queued commands and moves simulation time each quantum", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand({ type: "SET_RATE" });
    sim.advanceQuantum();
    expect(sim.pendingCommandCount).toBe(0);
    expect(sim.snapshot().calendar).toEqual({
      dateKey: "1991-01-01",
      minuteOfDay: 5,
    });
  });

  it("produces snapshots that are detached from live state", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const snap = sim.snapshot();
    sim.advanceQuantum();
    expect(snap.calendar.minuteOfDay).toBe(0);
  });

  it("rejects states that violate cash or room invariants", () => {
    const state = createInitialGameState(42);
    expect(() => assertInvariants(state)).not.toThrow();
    expect(() =>
      assertInvariants({ ...state, finance: { cashMinor: -1 } }),
    ).toThrow(/cash/);
    expect(() =>
      assertInvariants({
        ...state,
        finance: { cashMinor: 1.5 },
      }),
    ).toThrow(/cash/);
  });
});
