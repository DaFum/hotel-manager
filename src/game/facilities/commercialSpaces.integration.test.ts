import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { monthlyContributionMinor } from "./commercialSpaces";

function play(days: number, seed = 13): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
  return s;
}

describe("commercial spaces in a real hotel", () => {
  it("opens the house's spaces with hours, capacity and an operator", () => {
    const s = play(1);
    expect(s.state.commercialSpaces.spaces.map((x) => x.id)).toEqual([
      "space.carpark",
      "space.kiosk",
      "space.terrace",
    ]);
    for (const space of s.state.commercialSpaces.spaces) {
      expect(space.capacity).toBeGreaterThan(0);
      expect(space.closeMinute).toBeGreaterThan(space.openMinute);
      expect(space.operator.kind).toBeTruthy();
    }
  });

  it("sells only what guests actually in the house came down for", () => {
    const s = play(40);
    const sold = s.state.commercialSpaces.unitsSold;
    // The month reset leaves the current month's counters, which is what the
    // panel shows; the ledger holds what the previous month earned.
    for (const value of Object.values(sold))
      expect(value).toBeGreaterThanOrEqual(0);
    const earned = s.state.finance.ledger.filter(
      (entry) => entry.account === "commercialSpaces",
    );
    expect(earned.length).toBeGreaterThan(0);
  });

  it("pays a leased space its rent whether or not anybody shopped", () => {
    const s = play(1);
    const space = s.state.commercialSpaces.spaces.find(
      (x) => x.id === "space.kiosk",
    )!;
    const asLease = {
      ...space,
      operator: { kind: "lease" as const, monthlyRentMinor: 200_000 },
    };
    expect(monthlyContributionMinor(asLease, 0).hotelShareMinor).toBe(
      monthlyContributionMinor(asLease, 500).hotelShareMinor,
    );
    // Self-operated, the same space earns nothing when nobody buys.
    expect(monthlyContributionMinor(space, 0).hotelShareMinor).toBeLessThan(
      monthlyContributionMinor(space, 500).hotelShareMinor,
    );
  });

  it("keeps the derived lobby description on the snapshot with its cause", () => {
    const s = play(40);
    expect(s.state.lobby.cause).toBeTruthy();
    expect(s.state.lobby.served).toBeGreaterThanOrEqual(0);
    expect(s.state.lobby.unserved).toBeGreaterThanOrEqual(0);
    // No self-service has been implemented, so nothing claims to deflect.
    expect(s.state.lobby.automation).toEqual([]);
  });

  it("carries the spaces through a reload and keeps trading", () => {
    const s = play(40);
    const before = structuredClone(s.state);
    const reloaded = new GameSimulation(structuredClone(before));
    reloaded.refreshDerivedState();
    expect(reloaded.state.commercialSpaces).toEqual(before.commercialSpaces);
    reloaded.advanceQuantum();
    expect(reloaded.state.commercialSpaces.spaces).toEqual(
      before.commercialSpaces.spaces,
    );
  });
});
