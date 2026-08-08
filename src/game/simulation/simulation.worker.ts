import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../domain/protocol";
import { GameSimulation, type GameCommand } from "./GameSimulation";
import { createInitialGameState, type GameState } from "./initialState";

/** One real tick is 100 ms; at 1x that is one simulated hour. */
const TICK_MS = 100;
const QUANTA_PER_TICK = 12;

let simulation: GameSimulation | null = null;
let speed: 0 | 1 | 2 | 4 | 16 = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function reply(message: WorkerResponse) {
  self.postMessage(message);
}

function tick() {
  if (!simulation || speed === 0) return;
  try {
    for (let i = 0; i < speed * QUANTA_PER_TICK; i++)
      simulation.advanceQuantum();
  } catch (error) {
    speed = 0;
    reply({
      protocolVersion: PROTOCOL_VERSION,
      type: "SIMULATION_ERROR",
      message: (error as Error).message,
    });
    return;
  }
  reply({
    protocolVersion: PROTOCOL_VERSION,
    type: "STATE_DELTA",
    snapshot: simulation.snapshot(),
  });
}

function ensureTimer() {
  timer ??= setInterval(tick, TICK_MS);
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
      ensureTimer();
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "READY",
        snapshot: simulation.snapshot(),
      });
      return;
    }
    case "LOAD_GAME": {
      simulation = new GameSimulation(m.saveData as GameState);
      ensureTimer();
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "SNAPSHOT",
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
      simulation.queueCommand(m.command as GameCommand);
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND_ACCEPTED",
        requestId: m.requestId,
      });
      // A paused game still applies commands so the player sees the effect.
      if (speed === 0) {
        simulation.advanceQuantum();
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "STATE_DELTA",
          snapshot: simulation.snapshot(),
        });
      }
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
