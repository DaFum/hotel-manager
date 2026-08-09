import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";

function play(days: number, seed = 11): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
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
    const s = play(90);
    const posted = s.state.recoveries
      .filter((record) => record.status === "accepted")
      .reduce((sum, record) => sum + record.postedCostMinor, 0);
    const ledger = s.state.finance.ledger
      .filter((entry) => entry.account === "serviceRecovery")
      .reduce((sum, entry) => sum - entry.amountMinor, 0);
    expect(posted).toBe(ledger);

    // Anything the manager could not authorise posted nothing at all.
    for (const record of s.state.recoveries)
      if (record.status !== "accepted") expect(record.postedCostMinor).toBe(0);
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
    const s = play(180);
    expect(s.state.guestRelations.stays.length).toBeLessThanOrEqual(256);
    expect(s.state.recoveries.length).toBeLessThanOrEqual(256);
  });
});
