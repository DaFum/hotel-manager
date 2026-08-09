import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../domain/protocol";
import { GameSimulation } from "./GameSimulation";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
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
/** Command id to the request that carried it, so replies can be correlated. */
const correlation = new Map<string, string>();

function reply(message: WorkerResponse) {
  self.postMessage(message);
}

/** Hands the completed facts recorded since the last drain to the UI. */
function publishDomainEvents() {
  if (!simulation) return;
  const events = simulation.takeDomainEvents();
  if (events.length === 0) return;
  reply({
    protocolVersion: PROTOCOL_VERSION,
    type: "DOMAIN_EVENTS",
    events,
  });
}

/**
 * Publishes the verdicts of commands the simulation has actually decided.
 * COMMAND_ACCEPTED therefore means applied, not queued.
 */
function publishCommandResults() {
  if (!simulation) return;
  for (const result of simulation.takeCommandResults()) {
    const requestId = correlation.get(result.commandId);
    correlation.delete(result.commandId);
    // A verdict the UI never asked for — a standing order, say — has nothing
    // to correlate against and is reported through domain events instead.
    if (requestId === undefined) continue;
    reply(
      result.status === "accepted"
        ? {
            protocolVersion: PROTOCOL_VERSION,
            type: "COMMAND_ACCEPTED",
            requestId,
            commandId: result.commandId,
            stateVersion: result.stateVersion,
          }
        : {
            protocolVersion: PROTOCOL_VERSION,
            type: "COMMAND_REJECTED",
            requestId,
            commandId: result.commandId,
            reason: result.reason ?? "the command was refused",
          },
    );
  }
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
  publishCommandResults();
  publishDomainEvents();
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
      simulation.refreshDerivedState();
      ensureTimer();
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "READY",
        snapshot: simulation.snapshot(),
      });
      publishDomainEvents();
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
      simulation.refreshDerivedState();
      ensureTimer();
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "SNAPSHOT",
        snapshot: simulation.snapshot(),
      });
      publishDomainEvents();
      return;
    }
    case "COMMAND": {
      if (!simulation) {
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "COMMAND_REJECTED",
          requestId: m.requestId,
          commandId: m.commandId,
          reason: "simulation not initialised",
        });
        return;
      }
      let envelope;
      try {
        envelope = commandEnvelope({
          commandId: m.commandId,
          // Game time is the Worker's to state; the issuer does not get to
          // decide when, in the simulation, its command was issued.
          issuedAtMinutes: simulation.state.elapsedMinutes,
          actor: "player",
          payload: m.command as GameCommand,
          expectedStateVersion: m.expectedStateVersion,
        });
      } catch (error) {
        reply({
          protocolVersion: PROTOCOL_VERSION,
          type: "COMMAND_REJECTED",
          requestId: m.requestId,
          commandId: m.commandId,
          reason: (error as Error).message,
        });
        return;
      }
      // The correlation id is remembered, not stored on the envelope: it is a
      // transport concern and must not become the command's identity.
      correlation.set(envelope.commandId, m.requestId);
      simulation.queueEnvelope(envelope);
      // A paused game applies the command without advancing the calendar; a
      // running one decides it in the next commands phase. Either way the
      // acknowledgement waits until it has actually been applied.
      if (speed === 0) {
        simulation.applyPendingCommands();
        publishCommandResults();
        publishDomainEvents();
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
