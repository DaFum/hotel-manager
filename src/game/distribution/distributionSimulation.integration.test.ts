import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope } from "../commands/commandEnvelope";
import { QUANTUM_MINUTES } from "../simulation/clock";

function submit(
  simulation: GameSimulation,
  payload: Parameters<GameSimulation["queueCommand"]>[0],
) {
  return simulation.submitCommands([
    commandEnvelope({
      commandId: `cmd.${Math.random().toString(36).substring(2, 9)}`,
      issuedAtMinutes: simulation.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];
}

function advanceDays(simulation: GameSimulation, days: number) {
  const steps = (days * 1440) / QUANTUM_MINUTES;
  for (let i = 0; i < steps; i++) {
    simulation.advanceQuantum();
  }
}

describe("distribution and corporate integration in simulation loop", () => {
  it("processes corporate contract offer, accept, demand generation, and receivables settlement", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    // 1. Offer corporate account lead
    const offerRes = submit(sim, {
      type: "OFFER_CORPORATE_ACCOUNT",
      leadId: "lead.corp1",
      accountName: "TechCorp",
      segmentId: "segment.business",
      expectedRoomNights: 365,
    });
    expect(offerRes.status).toBe("accepted");

    // 2. Accept corporate account contract
    const acceptRes = submit(sim, {
      type: "ACCEPT_CORPORATE_ACCOUNT",
      leadId: "lead.corp1",
      contractId: "contract.corp1",
      negotiatedRateMinor: 7500,
      expectedRoomNights: 365,
      concessions: ["late-checkout"],
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      blackoutDateKeys: [],
      paymentTermsDays: 14,
      cancellationDaysBeforeArrival: 3,
      cancellationFeeBasisPoints: 1000,
    });
    expect(acceptRes.status).toBe("accepted");

    // Advance simulation to generate demand
    advanceDays(sim, 2);

    // Assert booking created for corporate contract
    const corpBookings = sim.state.reservations.filter(
      (b) => b.ratePlanId === "corporate" && b.channel === "corporate",
    );
    expect(corpBookings.length).toBeGreaterThan(0);
    expect(corpBookings[0].rateMinor).toBe(7500);

    // Verify receivables recognised
    expect(sim.state.statements.receivables.length).toBeGreaterThan(0);
  });

  it("handles allotment acceptance, inventory hold, and expiry release", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    // 1. Accept allotment with releaseDateKey on day 3
    const allotmentRes = submit(sim, {
      type: "ACCEPT_ALLOTMENT",
      allotmentId: "allot.b1",
      partner: "Tour operator",
      category: "single",
      roomsByDate: { "1991-01-04": 5, "1991-01-05": 5 },
      releaseDateKey: "1991-01-03",
    });
    expect(allotmentRes.status).toBe("accepted");

    // Advance 1 day
    advanceDays(sim, 1);

    // Allotment is still active
    expect(sim.state.distribution.allotments).toHaveLength(1);

    // Advance until release date key ("1991-01-03") is reached/passed
    advanceDays(sim, 3);

    // Allotment should be released (removed from allotments array) and ALLOTMENT_RELEASED emitted
    expect(sim.state.distribution.allotments).toHaveLength(0);
  });

  it("enforces channel closure and restrictions", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    // Close walkIn channel
    const closeRes = submit(sim, {
      type: "CLOSE_CHANNEL",
      channelId: "walkIn",
      closed: true,
    });
    expect(closeRes.status).toBe("accepted");

    expect(
      sim.state.distribution.channelInventory.find(
        (c) => c.channelId === "walkIn",
      )?.closed,
    ).toBe(true);
  });
});
