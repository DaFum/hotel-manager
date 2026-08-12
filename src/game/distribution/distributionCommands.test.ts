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
    expect(
      submit(simulation, {
        type: "ACCEPT_ALLOTMENT",
        allotmentId: "too-big",
        partner: "Tour AG",
        category: "single",
        roomsByDate: { "1991-01-03": 999 },
        releaseDateKey: "1991-01-02",
      }).status,
    ).toBe("rejected");
    expect(simulation.state.stateVersion).toBe(version);
    expect(simulation.state.distribution.allotments).toEqual([]);
  });
});
