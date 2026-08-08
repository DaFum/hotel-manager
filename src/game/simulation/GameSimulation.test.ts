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

  it("rejects an invalid command before it is queued", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    expect(
      sim.validateCommand({
        type: "SET_RATE",
        dateKey: "1991-01-02",
        category: "single",
        rateMinor: 100,
      }),
    ).toEqual({ ok: false, reason: "rate outside slice bounds" });
    expect(
      sim.validateCommand({
        type: "SET_RATE",
        dateKey: "1991-01-02",
        category: "single",
        rateMinor: 9500,
      }),
    ).toEqual({ ok: true });
  });

  it("applies a paused command without advancing the calendar", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand({
      type: "SET_RATE",
      dateKey: "1991-01-02",
      category: "single",
      rateMinor: 9500,
    });
    sim.applyPendingCommands();
    const s = sim.snapshot();
    expect(s.rates["1991-01-02/single"]).toBe(9500);
    expect(s.calendar).toEqual({ dateKey: "1991-01-01", minuteOfDay: 0 });
  });

  it("keeps the hiring sequence stable across a save and load", () => {
    const hire = {
      type: "HIRE" as const,
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: 250_000,
    };
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand(hire);
    sim.advanceQuantum();
    const saved = sim.snapshot();

    sim.queueCommand(hire);
    sim.advanceQuantum();
    const continued = sim.snapshot().staff.map((m) => m.id);

    const reloaded = new GameSimulation(saved);
    reloaded.queueCommand(hire);
    reloaded.advanceQuantum();
    expect(reloaded.snapshot().staff.map((m) => m.id)).toEqual(continued);
    expect(new Set(continued).size).toBe(continued.length);
  });

  it("posts the final day into the month it belongs to", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 31);
    const s = sim.snapshot();
    const report = s.lastMonthlyClose!;
    // 31 days of a 24 room hotel, and none of February's capacity.
    expect(report.availableRoomNights).toBe(31 * 24);
    expect(s.finance.month.availableRoomNights).toBe(24);
  });

  it("keeps renovation CapEx out of the operating expense line", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    const before = sim.snapshot().finance.month.operatingExpenseMinor;
    sim.queueCommand({ type: "START_RENOVATION" });
    sim.advanceQuantum();
    const after = sim.snapshot();
    expect(after.finance.month.operatingExpenseMinor).toBe(before);
    expect(after.finance.cashMinor).toBe(40_000_000 - 6_000_000);
  });

  it("wears assets down over simulated days", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const before = sim.snapshot().assets[0].condition;
    runQuanta(sim, QUANTA_PER_DAY * 3);
    expect(sim.snapshot().assets[0].condition).toBe(before - 30);
  });

  it("assigns the room category the guest actually booked", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 7);
    const s = sim.snapshot();
    for (const stay of s.stays) {
      const booking = s.reservations.find((b) => b.id === stay.bookingId);
      const room = s.hotel.rooms.find((r) => r.id === stay.roomId)!;
      if (booking) expect(room.category).toBe(booking.category);
    }
  });

  it("converts the free module into two extra rooms", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    sim.queueCommand({ type: "START_RENOVATION" });
    runQuanta(sim, QUANTA_PER_DAY * 4);
    expect(sim.snapshot().hotel.rooms).toHaveLength(26);
  });
});
