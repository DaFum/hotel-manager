import { describe, expect, it } from "vitest";
import { GameSimulation, PHASE_ORDER } from "./GameSimulation";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import { createInitialGameState } from "./initialState";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function runQuanta(sim: GameSimulation, quanta: number) {
  for (let i = 0; i < quanta; i++) sim.advanceQuantum();
}

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
    sim.queueCommand({
      type: "SET_RATE",
      dateKey: "1991-01-02",
      category: "single",
      rateMinor: 9500,
    });
    sim.advanceQuantum();
    expect(sim.pendingCommandCount).toBe(0);
    expect(sim.snapshot().rates["1991-01-02/single"]).toBe(9500);
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
      assertInvariants({
        ...state,
        finance: { ...state.finance, cashMinor: -1 },
      }),
    ).toThrow(/cash/);
    expect(() =>
      assertInvariants({
        ...state,
        finance: { ...state.finance, cashMinor: 1.5 },
      }),
    ).toThrow(/cash/);
  });
});

describe("simulated operations", () => {
  it("books, checks in, and earns room revenue within the first week", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 7);
    const s = sim.snapshot();
    expect(s.reservations.length + s.stays.length).toBeGreaterThan(0);
    expect(s.stays.length).toBeGreaterThan(0);
    expect(s.finance.month.roomRevenueMinor).toBeGreaterThan(0);
    expect(s.metrics.adrMinor).toBeGreaterThan(0);
  });

  it("produces a monthly close report once the month rolls over", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 32);
    const s = sim.snapshot();
    expect(s.calendar.dateKey.slice(0, 7)).toBe("1991-02");
    expect(s.lastMonthlyClose).not.toBeNull();
    expect(s.lastMonthlyClose!.revenueMinor).toBeGreaterThan(0);
    expect(s.lastMonthlyClose!.occupancyBasisPoints).toBeGreaterThan(0);
  });

  it("replays bit for bit from the same seed", () => {
    const a = new GameSimulation(createInitialGameState(424242));
    const b = new GameSimulation(createInitialGameState(424242));
    runQuanta(a, QUANTA_PER_DAY * 10);
    runQuanta(b, QUANTA_PER_DAY * 10);
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it("diverges for a different seed", () => {
    const a = new GameSimulation(createInitialGameState(1));
    const b = new GameSimulation(createInitialGameState(2));
    runQuanta(a, QUANTA_PER_DAY * 10);
    runQuanta(b, QUANTA_PER_DAY * 10);
    expect(a.snapshot()).not.toEqual(b.snapshot());
  });

  it("keeps cash whole and never lets the ledger drift from cash", () => {
    const sim = new GameSimulation(createInitialGameState(7));
    runQuanta(sim, QUANTA_PER_DAY * 14);
    const s = sim.snapshot();
    expect(Number.isSafeInteger(s.finance.cashMinor)).toBe(true);
    const ledgerNet = s.finance.ledger.reduce((n, e) => n + e.amountMinor, 0);
    expect(s.finance.cashMinor).toBe(40_000_000 + ledgerNet);
  });

  it("converts the free module into two extra rooms", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    sim.queueCommand({ type: "START_RENOVATION" });
    runQuanta(sim, QUANTA_PER_DAY * 4);
    expect(sim.snapshot().hotel.rooms).toHaveLength(26);
  });
});
