import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../simulation/initialState";
import { GameSimulation } from "../simulation/GameSimulation";
import { commandEnvelope } from "../commands/commandEnvelope";

const submit = (
  simulation: GameSimulation,
  payload: Parameters<GameSimulation["queueCommand"]>[0],
) =>
  simulation.submitCommands([
    commandEnvelope({
      commandId: `test.${payload.type}`,
      issuedAtMinutes: simulation.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];

describe("distribution commands", () => {
  it("accepts an allotment, constrains inventory, and changes channel controls", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    expect(
      submit(simulation, {
        type: "ACCEPT_ALLOTMENT",
        allotmentId: "allotment.1",
        partner: "Tour AG",
        category: "single",
        roomsByDate: { "1991-01-03": 3 },
        releaseDateKey: "1991-01-02",
      }).status,
    ).toBe("accepted");
    expect(
      submit(simulation, {
        type: "SET_CHANNEL_INVENTORY",
        channelId: "travelAgency",
        allowedCategories: ["single"],
        allowedRatePlanIds: ["flexible"],
      }).status,
    ).toBe("accepted");
    expect(
      submit(simulation, {
        type: "CLOSE_CHANNEL",
        channelId: "travelAgency",
        closed: true,
      }).status,
    ).toBe("accepted");
    expect(
      simulation.state.distribution.allotments[0].roomsByDate["1991-01-03"],
    ).toBe(3);
    expect(simulation.state.distribution.channelInventory[0].closed).toBe(true);
  });

  it("rejects an allotment above capacity transactionally", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    const version = simulation.state.stateVersion;
    const result = submit(simulation, {
      type: "ACCEPT_ALLOTMENT",
      allotmentId: "too-big",
      partner: "Tour AG",
      category: "single",
      roomsByDate: { "1991-01-03": 999 },
      releaseDateKey: "1991-01-02",
    });
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.reason).toBe("allotment exceeds capacity on 1991-01-03");
    }
    expect(simulation.state.stateVersion).toBe(version);
    expect(simulation.state.distribution.allotments).toEqual([]);
  });

  it("accepts a group contract", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    const initialCash = simulation.state.finance.cashMinor;
    expect(
      submit(simulation, {
        type: "ACCEPT_GROUP_CONTRACT",
        blockId: "block.1",
        category: "single",
        roomsByDate: { "1991-01-03": 5 },
        groupRateMinor: 8000,
        releaseDateKey: "1991-01-02",
        depositMinor: 10000,
        cancellationDaysBeforeArrival: 3,
        cancellationFeeBasisPoints: 5000,
        paymentTermsDays: 14,
      }).status,
    ).toBe("accepted");
    expect(simulation.state.finance.cashMinor).toBe(initialCash + 10000);
    expect(simulation.state.distribution.groupBlocks[0].status).toBe(
      "confirmed",
    );

    const rejection = simulation.submitCommands([
      commandEnvelope({
        commandId: "test.ACCEPT_GROUP_CONTRACT_2",
        issuedAtMinutes: simulation.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "ACCEPT_GROUP_CONTRACT",
          blockId: "block.1",
          category: "single",
          roomsByDate: { "1991-01-04": 5 },
          groupRateMinor: 8000,
          releaseDateKey: "1991-01-02",
          depositMinor: 10000,
          cancellationDaysBeforeArrival: 3,
          cancellationFeeBasisPoints: 5000,
          paymentTermsDays: 14,
        },
      }),
    ])[0];
    expect(rejection.status).toBe("rejected");
    expect(rejection.reason).toBe("group block already exists");
  });

  it("declines a group contract", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    expect(
      submit(simulation, {
        type: "DECLINE_GROUP_CONTRACT",
        blockId: "block.2",
      }).status,
    ).toBe("accepted");
    expect(simulation.state.distribution.groupBlocks[0]).toEqual({
      id: "block.2",
      category: "single",
      roomsByDate: {},
      groupRateMinor: 0,
      releaseDateKey: simulation.state.calendar.dateKey,
      depositMinor: 0,
      cancellationDaysBeforeArrival: 0,
      cancellationFeeBasisPoints: 0,
      paymentTermsDays: 0,
      status: "declined",
    });
  });
});
