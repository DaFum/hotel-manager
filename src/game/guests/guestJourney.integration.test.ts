import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import type { RoomCategory } from "../revenue/rates";

function play(days: number, seed = 11): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
  return s;
}

/**
 * One receptionist against a wave of guaranteed same-day arrivals. Ordinary
 * trading never backs the desk up far enough to produce a complaint, so a
 * test about recovery has to put the house in the state that causes one.
 */
function overwhelmedReception(recoveryLimitMinor?: number): GameSimulation {
  const state = createInitialGameState(7);
  if (recoveryLimitMinor !== undefined)
    state.company.managers = state.company.managers.map((manager) => ({
      ...manager,
      authority: { ...manager.authority, recoveryLimitMinor },
    }));
  state.staff = state.staff.filter(
    (m) => m.role !== "reception" || m.id === "staff.reception.1",
  );
  state.reservations = state.hotel.rooms.slice(0, 20).map((room, i) => ({
    id: `booking.wave.${i}`,
    roomsRequested: 1,
    rateMinor: 15_000,
    status: "confirmed" as const,
    channel: "walkIn" as const,
    partySize: 2,
    segmentId: "segment.leisure",
    category: room.category as RoomCategory,
    arrivalDateKey: state.calendar.dateKey,
    nights: 1,
    terms: { guaranteed: true, freeCancellationDays: 1, lateChargeBp: 10000 },
    history: [{ status: "confirmed" as const, atMinutes: 0 }],
    bookingDateKey: state.calendar.dateKey,
    ratePlanId: "flexible",
    commissionBp: 0,
    depositMinor: 0,
    specialRequirements: [],
  }));
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  for (let i = 0; i < (2 * 1440) / QUANTUM_MINUTES; i += 1) s.advanceQuantum();
  return s;
}

describe("the guest journey against a real trading hotel", () => {
  it("opens a party record for everybody who actually checks in", () => {
    const s = play(40);
    const relations = s.state.guestRelations;
    expect(relations.parties.length).toBeGreaterThan(0);
    expect(relations.stays.length).toBeGreaterThan(0);
    for (const party of relations.parties) {
      expect(party.adults).toBeGreaterThan(0);
      expect(party.bookingId).toBeTruthy();
      // The party's id is derived from its booking, so the two can never
      // drift apart even after the reservation itself has been pruned.
      expect(party.id).toBe(`party.${party.bookingId}`);
    }
    for (const stay of relations.stays)
      expect(relations.parties.some((party) => party.id === stay.partyId)).toBe(
        true,
      );
  });

  it("records what check-in was like, with the reason attached", () => {
    const s = play(40);
    for (const stay of s.state.guestRelations.stays) {
      expect(stay.events.length).toBeGreaterThan(0);
      const checkIn = stay.events.find((e) => e.stage === "checkIn");
      expect(checkIn?.cause).toMatch(/reception|without waiting/);
    }
  });

  it("keeps a recovery record whose posted cost matches the ledger", () => {
    const s = overwhelmedReception();
    const accepted = s.state.recoveries.filter(
      (record) => record.status === "accepted",
    );
    // Without this the comparison below is 0 === 0 and proves nothing.
    expect(accepted.length).toBeGreaterThan(0);
    const posted = accepted.reduce(
      (sum, record) => sum + record.postedCostMinor,
      0,
    );
    const ledger = s.state.finance.ledger
      .filter((entry) => entry.account === "serviceRecovery")
      .reduce((sum, entry) => sum - entry.amountMinor, 0);
    expect(posted).toBe(ledger);
    expect(posted).toBeGreaterThan(0);

    // Anything the manager could not authorise posted nothing at all.
    for (const record of s.state.recoveries)
      if (record.status !== "accepted") expect(record.postedCostMinor).toBe(0);
  });

  it("escalates a gesture the manager may not authorise, and posts nothing", () => {
    // The same wave of complaints, but with the delegation taken away.
    const s = overwhelmedReception(0);
    expect(s.state.recoveries.length).toBeGreaterThan(0);
    for (const record of s.state.recoveries) {
      expect(record.status).toBe("escalated");
      expect(record.postedCostMinor).toBe(0);
      expect(record.authorisedBy).toBeNull();
    }
    // A refused authorisation costs the group nothing at all.
    expect(
      s.state.finance.ledger.filter(
        (entry) => entry.account === "serviceRecovery",
      ),
    ).toEqual([]);
  });

  it("carries the guest-relations record through a reload unchanged", () => {
    const s = play(40);
    const before = structuredClone(s.state);
    const reloaded = new GameSimulation(structuredClone(before));
    reloaded.refreshDerivedState();
    expect(reloaded.state.guestRelations).toEqual(before.guestRelations);
    expect(reloaded.state.recoveries).toEqual(before.recoveries);
  });

  it("bounds the guest-relations record so a long campaign stays small", () => {
    const s = play(120);
    expect(s.state.guestRelations.stays.length).toBeLessThanOrEqual(256);
    expect(s.state.recoveries.length).toBeLessThanOrEqual(256);
  });
});
