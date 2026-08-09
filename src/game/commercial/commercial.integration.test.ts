import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { marketableGuestIds, repeatGuestIds } from "./crm";
import { POINT_VALUE_MINOR } from "./loyalty";
import { reputationCauses, reputationFor } from "../reputation/dimensions";

function play(days: number, seed = 23): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
  return s;
}

describe("the commercial layer against a real trading hotel", () => {
  it("remembers a guest who actually stayed, and nothing about anybody else", () => {
    const s = play(40);
    const crm = s.state.commercial.crm;
    expect(crm.profiles.length).toBeGreaterThan(0);
    // Nobody consented, so nothing beyond the stay itself is stored, and
    // marketing can reach nobody.
    for (const profile of crm.profiles) {
      expect(profile.consent).toBe("none");
      expect(profile.preferences).toEqual([]);
      expect(profile.stayHistory.length).toBeGreaterThan(0);
    }
    expect(marketableGuestIds(crm)).toEqual([]);
    expect(repeatGuestIds(crm, 1).length).toBe(crm.profiles.length);
  });

  it("carries the loyalty liability the points actually created", () => {
    const s = play(40);
    const loyalty = s.state.commercial.loyalty;
    expect(loyalty.members.length).toBeGreaterThan(0);
    const outstanding = loyalty.members.reduce((sum, m) => sum + m.points, 0);
    // What is owed is what is outstanding, less whatever breakage released.
    expect(loyalty.liabilityMinor).toBeLessThanOrEqual(
      outstanding * POINT_VALUE_MINOR,
    );
    expect(loyalty.liabilityMinor).toBeGreaterThan(0);
  });

  it("releases breakage as income the ledger can name", () => {
    const s = play(40);
    const released = s.state.finance.ledger.filter(
      (e) => e.account === "loyaltyBreakage",
    );
    expect(released.length).toBeGreaterThan(0);
    expect(released[0].amountMinor).toBeGreaterThan(0);
  });

  it("moves hotel and employer reputation for reasons that can be read back", () => {
    const s = play(40);
    const hotel = reputationFor(s.state.reputation, "hotel", s.state.hotel.id);
    const employer = reputationFor(
      s.state.reputation,
      "employer",
      s.state.hotel.id,
    );
    expect(hotel.contributors.length).toBeGreaterThan(0);
    expect(employer.contributors.length).toBeGreaterThan(0);
    expect(
      reputationCauses(s.state.reputation, "hotel", s.state.hotel.id)[0].cause,
    ).toMatch(/guest satisfaction/);
    // The group and channel dimensions are untouched: nothing has happened to
    // them, and they do not inherit the hotel's score.
    expect(Object.keys(s.state.reputation.group)).toEqual([]);
    expect(Object.keys(s.state.reputation.channel)).toEqual([]);
  });

  it("survives a save and reload with its commercial record intact", () => {
    const s = play(40);
    const before = structuredClone(s.state);
    const reloaded = new GameSimulation(structuredClone(before));
    reloaded.refreshDerivedState();
    expect(reloaded.state.commercial).toEqual(before.commercial);
    expect(reloaded.state.reputation).toEqual(before.reputation);
    // Running on does not re-earn the points already earned.
    const pointsBefore = reloaded.state.commercial.loyalty.members.reduce(
      (sum, m) => sum + m.points,
      0,
    );
    reloaded.advanceQuantum();
    expect(
      reloaded.state.commercial.loyalty.members.reduce(
        (sum, m) => sum + m.points,
        0,
      ),
    ).toBe(pointsBefore);
  });
});
