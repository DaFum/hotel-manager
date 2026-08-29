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

  it("declines a group contract and emits event", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    const result = submit(simulation, {
      type: "DECLINE_GROUP_CONTRACT",
      blockId: "block.2",
    });
    expect(result.status).toBe("accepted");
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

    const emitted = simulation.state.eventJournal.pending.filter(
      (e) => e.payload.type === "GROUP_CONTRACT_DECLINED",
    );
    expect(emitted).toHaveLength(1);
    expect(emitted[0].payload).toEqual({
      type: "GROUP_CONTRACT_DECLINED",
      blockId: "block.2",
    });
  });

  it("handles RENEW_CORPORATE_ACCOUNT and emits domain events", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    submit(simulation, {
      type: "OFFER_CORPORATE_ACCOUNT",
      leadId: "lead.renew",
      accountName: "RenewCorp",
      segmentId: "segment.business",
      expectedRoomNights: 200,
    });

    const result = submit(simulation, {
      type: "RENEW_CORPORATE_ACCOUNT",
      leadId: "lead.renew",
      stage: "proposed",
    });
    expect(result.status).toBe("accepted");

    const lead = simulation.state.commercial.sales.leads.find(
      (l) => l.id === "lead.renew",
    );
    expect(lead?.stage).toBe("proposed");

    const events = simulation.state.eventJournal.pending.map((e) => e.payload.type);
    expect(events).toContain("CORPORATE_ACCOUNT_OFFERED");
    expect(events).toContain("CORPORATE_ACCOUNT_RENEWED");
  });

  it("does not advance stateVersion or RNG state when a command is rejected", () => {
    const simulation = new GameSimulation(createInitialGameState(5));
    const versionBefore = simulation.state.stateVersion;
    const rngBefore = structuredClone(simulation.state.rngState);

    // Submit command with stale expectedStateVersion (99 when stateVersion is 0)
    const result = simulation.submitCommands([
      commandEnvelope({
        commandId: "test.stale",
        issuedAtMinutes: simulation.state.elapsedMinutes,
        actor: "player",
        expectedStateVersion: 99, // stale
        payload: {
          type: "CLOSE_CHANNEL",
          channelId: "walkIn",
          closed: true,
        },
      }),
    ])[0];

    expect(result.status).toBe("rejected");
    expect(result.reason).toContain("expected state version");
    expect(simulation.state.stateVersion).toBe(versionBefore);
    expect(simulation.state.rngState).toEqual(rngBefore);
  });
});
