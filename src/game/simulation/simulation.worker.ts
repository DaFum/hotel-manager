import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../domain/protocol";
import { GameSimulation } from "./GameSimulation";
import { createInitialGameState } from "./initialState";

let simulation: GameSimulation | null = null;
let speed: 0 | 1 | 2 | 4 | 16 = 0;

function reply(message: WorkerResponse) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const m = event.data;
  if (m.protocolVersion !== PROTOCOL_VERSION) {
    reply({
      protocolVersion: PROTOCOL_VERSION,
      type: "SIMULATION_ERROR",
      message: "protocol mismatch",
    });
    return;
  }
  switch (m.type) {
    case "INIT_GAME": {
      simulation = new GameSimulation(createInitialGameState(m.seed));
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "READY",
        snapshot: simulation.snapshot(),
      });
      return;
    }
    case "COMMAND": {
      if (!simulation) {
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "COMMAND_REJECTED",
          requestId: m.requestId,
          reason: "simulation not initialised",
        });
        return;
      }
      simulation.queueCommand(m.command);
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND_ACCEPTED",
        requestId: m.requestId,
      });
      return;
    }
    case "SET_SPEED": {
      speed = m.speed;
      return;
    }
    case "PAUSE": {
      speed = 0;
      return;
    }
    case "RESUME": {
      speed = speed || 1;
      if (simulation) {
        simulation.advanceQuantum();
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "STATE_DELTA",
          snapshot: simulation.snapshot(),
        });
      }
      return;
    }
    case "REQUEST_SAVE": {
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "SAVE_DATA",
        requestId: m.requestId,
        saveData: simulation?.snapshot() ?? null,
      });
      return;
    }
    default:
      return;
  }
};
