import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../domain/protocol";
import { GameSimulation, type GameCommand } from "./GameSimulation";
import { createInitialGameState, type GameState } from "./initialState";
import { isCompleteRngState } from "../persistence/saveSchema";

/** One real tick is 100 ms; at 1x that is one simulated hour. */
const TICK_MS = 100;
const QUANTA_PER_TICK = 12;

/**
 * Structural guard so a corrupted or foreign save surfaces SIMULATION_ERROR
 * instead of throwing outside the tick handler.
 */
function isRestorableState(value: unknown): value is GameState {
  const s = value as GameState | null;
  return Boolean(
    s &&
    typeof s === "object" &&
    s.calendar &&
    typeof s.calendar.dateKey === "string" &&
    Number.isSafeInteger(s.calendar.minuteOfDay) &&
    s.hotel &&
    Array.isArray(s.hotel.rooms) &&
    s.finance &&
    Number.isSafeInteger(s.finance.cashMinor) &&
    Array.isArray(s.finance.ledger) &&
    s.finance.month &&
    s.rngState &&
    Number.isSafeInteger(s.rngState.guests) &&
    Number.isSafeInteger(s.rngState.AI),
  );
}

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
      if (!isRestorableState(m.saveData)) {
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "SIMULATION_ERROR",
          message: "save data is not a restorable game state",
        });
        return;
      }
      simulation = new GameSimulation(m.saveData);
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
      const command = m.command as GameCommand;
      const verdict = simulation.validateCommand(command);
      if (!verdict.ok) {
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "COMMAND_REJECTED",
          requestId: m.requestId,
          reason: verdict.reason,
        });
        return;
      }
      simulation.queueCommand(command);
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND_ACCEPTED",
        requestId: m.requestId,
      });
      // A paused game applies the command without advancing the calendar.
      if (speed === 0) {
        simulation.applyPendingCommands();
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
    case "REQUEST_DETAILS": {
      // Entity detail lives in the snapshot; answering with it keeps the
      // response inside the MASTER worker-to-UI message families.
      if (simulation)
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "SNAPSHOT",
          snapshot: simulation.snapshot(),
        });
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
