import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope } from "../commands/commandEnvelope";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { addDays } from "../domain/calendar";

function submit(
  simulation: GameSimulation,
  payload: Parameters<GameSimulation["queueCommand"]>[0],
) {
  const sequence = simulation.state.commandSequence + 1;
  return simulation.submitCommands([
    commandEnvelope({
      commandId: `cmd.${sequence}`,
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

    // 2. Accept corporate account contract with 14-day payment terms
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

    // Advance simulation to generate corporate demand and create stay/reservation
    advanceDays(sim, 2);

    // Assert booking created for corporate contract
    const corpBookings = sim.state.reservations.filter(
      (b) => b.ratePlanId === "corporate" && b.channel === "corporate",
    );
    expect(corpBookings.length).toBeGreaterThan(0);
    expect(corpBookings[0].rateMinor).toBe(7500);

    // Advance to stay departure so stay is completed and receivable recognised
    advanceDays(sim, 2);
    expect(sim.state.statements.receivables.length).toBeGreaterThan(0);
    const targetReceivable = sim.state.statements.receivables[0];
    const initialCash = sim.state.finance.cashMinor;

    // Advance past due date (14 days payment terms) to trigger settlement in daily tick
    advanceDays(sim, 16);

    // Verify receivable has been settled and cash collection recorded
    expect(
      sim.state.statements.receivables.some((r) => r.id === targetReceivable.id),
    ).toBe(false);
    expect(sim.state.finance.cashMinor).toBeGreaterThan(initialCash);
    expect(
      sim.state.finance.ledger.some(
        (e) =>
          e.account === "receivableCollection" && e.memo === targetReceivable.id,
      ),
    ).toBe(true);
  });

  it("handles allotment acceptance, inventory hold, and expiry release", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    const targetDate = addDays(sim.state.calendar.dateKey, 3); // 1991-01-04
    const availableBefore = sim.availableRooms(targetDate, "single");

    // 1. Accept allotment holding 5 single rooms on 1991-01-04 with releaseDateKey on day 3
    const allotmentRes = submit(sim, {
      type: "ACCEPT_ALLOTMENT",
      allotmentId: "allot.b1",
      partner: "Tour operator",
      category: "single",
      roomsByDate: { [targetDate]: 5 },
      releaseDateKey: "1991-01-03",
    });
    expect(allotmentRes.status).toBe("accepted");

    // Available rooms on targetDate must immediately reflect allotment hold
    const availableDuringHold = sim.availableRooms(targetDate, "single");
    expect(availableDuringHold).toBe(availableBefore - 5);

    // Advance until release date key ("1991-01-03") is reached/passed
    advanceDays(sim, 3);

    // Allotment should be released (removed) and rooms returned to available inventory
    expect(sim.state.distribution.allotments).toHaveLength(0);
    const availableAfterRelease = sim.availableRooms(targetDate, "single");
    // Other reservations may have been booked during those 3 days, but inventory is 5 higher than if held
    expect(availableAfterRelease).toBeGreaterThan(availableDuringHold);
  });

  it("enforces channel closure and restrictions during demand generation", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    // Restrict travelAgency channel to only allow suite category
    const inventoryRes = submit(sim, {
      type: "SET_CHANNEL_INVENTORY",
      channelId: "travelAgency",
      allowedCategories: ["suite"],
      allowedRatePlanIds: ["flexible"],
    });
    expect(inventoryRes.status).toBe("accepted");

    // Close travelAgency channel
    const closeRes = submit(sim, {
      type: "CLOSE_CHANNEL",
      channelId: "travelAgency",
      closed: true,
    });
    expect(closeRes.status).toBe("accepted");

    expect(
      sim.state.distribution.channelInventory.find(
        (c) => c.channelId === "travelAgency",
      )?.closed,
    ).toBe(true);

    // Advance 5 days and verify no travelAgency bookings are generated
    advanceDays(sim, 5);
    const travelAgencyBookings = sim.state.reservations.filter(
      (b) => b.channel === "travelAgency",
    );
    expect(travelAgencyBookings).toHaveLength(0);
  });

  it("generates group bookings with channel group and specified group rate for confirmed group blocks", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.refreshDerivedState();

    const arrivalDateKey = addDays(sim.state.calendar.dateKey, 1);

    const groupRes = submit(sim, {
      type: "ACCEPT_GROUP_CONTRACT",
      blockId: "group.tour1",
      category: "single",
      roomsByDate: { [arrivalDateKey]: 3 },
      groupRateMinor: 5500,
      releaseDateKey: addDays(arrivalDateKey, 5),
      depositMinor: 0,
      cancellationDaysBeforeArrival: 3,
      cancellationFeeBasisPoints: 1000,
      paymentTermsDays: 14,
    });
    expect(groupRes.status).toBe("accepted");

    // Advance 1 day to run demand phase
    advanceDays(sim, 1);

    const groupBookings = sim.state.reservations.filter(
      (b) => b.channel === "group" && b.ratePlanId === "group",
    );
    expect(groupBookings.length).toBeGreaterThan(0);
    expect(groupBookings[0].rateMinor).toBe(5500);
    expect(groupBookings[0].roomsRequested).toBe(3);
  });
});
