import { describe, expect, it } from "vitest";
import { occupancyContributors } from "./demand";
import { createInitialGameState } from "../simulation/initialState";
import { GameSimulation } from "../simulation/GameSimulation";
import { QUANTUM_MINUTES } from "../simulation/clock";

describe("occupancy attribution", () => {
  it("reconciles named integer marginals exactly to occupancy movement", () => {
    const rows = occupancyContributors({
      occupancyMovementBp: -800,
      businessDemandChangeBp: -120,
      competitorRoomSupplyChangeBp: 240,
      ownPriceDeltaBp: 500,
      eventUpliftBp: 100,
    });
    expect(rows.reduce((sum, row) => sum + row.weight, 0)).toBe(-800);
    expect(rows.map((row) => row.factor)).toEqual([
      "businessDemandChange",
      "competitorRoomSupplyChange",
      "ownPriceVsMarket",
      "eventUplift",
      "reputationEffect",
    ]);
  });

  it("refuses unsafe numeric attribution state", () => {
    expect(() =>
      occupancyContributors({
        occupancyMovementBp: Number.MAX_VALUE,
        businessDemandChangeBp: 0,
        competitorRoomSupplyChangeBp: 0,
        ownPriceDeltaBp: 0,
        eventUpliftBp: 0,
      }),
    ).toThrow(/invalid occupancy attribution/);
  });

  it("records the same reconciled ordering for a fixed simulation seed", () => {
    const run = () => {
      const simulation = new GameSimulation(createInitialGameState(73));
      for (let index = 0; index < (32 * 1440) / QUANTUM_MINUTES; index += 1)
        simulation.advanceQuantum();
      return simulation.state.cityMarket.occupancyAttribution;
    };
    const first = run();
    const second = run();
    expect(second).toEqual(first);
    expect(first.contributors.reduce((sum, row) => sum + row.weight, 0)).toBe(
      first.occupancyMovementBp,
    );
  }, 30_000);
});
