import {
  PROTOCOL_VERSION,
  WHOLE_GAME_ENTITY_ID,
  simulationError,
  type WorkerRequest,
  type WorkerResponse,
} from "../domain/protocol";
import { computeStateDelta } from "../domain/stateDelta";
import { GameSimulation } from "./GameSimulation";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
import { createInitialGameState, type GameState } from "./initialState";
import type { GameSnapshot } from "../domain/snapshot";
import { entityDetail } from "./entityDetail";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  migrateEnvelope,
  validateEnvelope,
  type SaveEnvelope,
} from "../persistence/saveSchema";

/** One real tick is 100 ms; at 1x that is one simulated hour. */
const TICK_MS = 100;
const QUANTA_PER_TICK = 12;

/**
 * Brings a stored envelope forward and checks it before anything is replaced.
 * A save that cannot be trusted must fail here, with the running game intact,
 * rather than half-way through becoming the game.
 */
function acceptEnvelope(
  value: unknown,
): { ok: true; state: GameState } | { ok: false; reason: string } {
  if (!value || typeof value !== "object")
    return { ok: false, reason: "save data is not a save envelope" };
  let migrated: SaveEnvelope;
  try {
    migrated = migrateEnvelope(value as SaveEnvelope);
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
  const problems = validateEnvelope(migrated);
  if (problems.length > 0) return { ok: false, reason: problems.join("; ") };
  return { ok: true, state: migrated.state as GameState };
}

/** The envelope this build writes, prepared from authoritative state. */
function prepareEnvelope(state: GameState): SaveEnvelope {
  return {
    saveVersion: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    rngState: state.rngState,
    state,
  };
}

let simulation: GameSimulation | null = null;
let speed: 0 | 1 | 2 | 4 | 16 = 0;
let timer: ReturnType<typeof setInterval> | null = null;
/**
 * Command id to the requests that carried it, oldest first.
 *
 * Two requests can share a command id — a retry, say — and both are waiting
 * for an answer. Keeping only the newest would answer the retry with the
 * original's verdict and leave the original caller waiting for ever.
 */
const correlation = new Map<string, string[]>();
/** When each in-flight command arrived, for latency reporting only. */
const arrivedAt = new Map<string, number>();
/** The last snapshot the UI was given, and which publication it was. */
let published: GameSnapshot | null = null;
let publication = 0;
let lastTickMs = 0;
let lastCommandLatencyMs = 0;

function reply(message: WorkerResponse) {
  self.postMessage(message);
}

/**
 * Wall time, for measurement only. It is never read by simulation code: a slow
 * machine must produce the same hotel as a fast one.
 */
const now = () => (typeof performance === "undefined" ? 0 : performance.now());

/** Publishes a full snapshot and starts a fresh delta chain from it. */
function publishSnapshot(requestId?: string) {
  if (!simulation) return;
  published = simulation.snapshot();
  publication += 1;
  reply({
    protocolVersion: PROTOCOL_VERSION,
    type: "SNAPSHOT",
    snapshot: published,
    publication,
    ...(requestId === undefined ? {} : { requestId }),
  });
}

/**
 * Publishes what actually changed since the last publication. A quiet quantum
 * therefore costs a handful of sections rather than the whole hotel.
 */
function publishDelta() {
  if (!simulation) return;
  const next = simulation.snapshot();
  if (!published) {
    published = next;
    publication += 1;
    reply({
      protocolVersion: PROTOCOL_VERSION,
      type: "SNAPSHOT",
      snapshot: next,
      publication,
    });
    return;
  }
  const delta = computeStateDelta(published, next, {
    basePublication: publication,
    publication: publication + 1,
  });
  published = next;
  publication += 1;
  reply({ protocolVersion: PROTOCOL_VERSION, type: "STATE_DELTA", delta });
}

/** Hands the completed facts recorded since the last drain to the UI. */
function publishDomainEvents() {
  if (!simulation) return;
  const events = simulation.takeDomainEvents();
  if (events.length === 0) return;
  reply({ protocolVersion: PROTOCOL_VERSION, type: "DOMAIN_EVENTS", events });
}

/**
 * Publishes the verdicts of commands the simulation has actually decided.
 * COMMAND_ACCEPTED therefore means applied, not queued.
 */
function publishCommandResults() {
  if (!simulation) return;
  for (const result of simulation.takeCommandResults()) {
    const waiting = correlation.get(result.commandId) ?? [];
    // Each verdict answers the oldest request still waiting on that id, so a
    // duplicate's rejection reaches the caller that sent the duplicate.
    const requestId = waiting.shift();
    if (waiting.length === 0) correlation.delete(result.commandId);
    const arrived = arrivedAt.get(result.commandId);
    if (arrived !== undefined) lastCommandLatencyMs = now() - arrived;
    if (waiting.length === 0) arrivedAt.delete(result.commandId);
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

function publishPerfSample() {
  if (!simulation) return;
  reply({
    protocolVersion: PROTOCOL_VERSION,
    type: "PERF_SAMPLE",
    tickMs: lastTickMs,
    commandLatencyMs: lastCommandLatencyMs,
    visibleAgents: simulation.state.stays.length,
  });
}

function tick() {
  if (!simulation || speed === 0) return;
  const started = now();
  try {
    for (let i = 0; i < speed * QUANTA_PER_TICK; i++)
      simulation.advanceQuantum();
  } catch (error) {
    speed = 0;
    reply(
      simulationError("TICK_FAILED", (error as Error).message, {
        recoverable: false,
      }),
    );
    return;
  }
  lastTickMs = now() - started;
  publishCommandResults();
  publishDomainEvents();
  publishDelta();
  publishPerfSample();
}

function ensureTimer() {
  timer ??= setInterval(tick, TICK_MS);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const m = event.data;
  if (m.protocolVersion !== PROTOCOL_VERSION) {
    reply(
      simulationError(
        "PROTOCOL_MISMATCH",
        `this worker speaks protocol ${PROTOCOL_VERSION}`,
        { recoverable: false },
      ),
    );
    return;
  }
  switch (m.type) {
    case "INIT_GAME": {
      simulation = new GameSimulation(createInitialGameState(m.seed));
      simulation.refreshDerivedState();
      ensureTimer();
      published = simulation.snapshot();
      publication += 1;
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "READY",
        snapshot: published,
        publication,
      });
      publishDomainEvents();
      return;
    }
    case "LOAD_GAME": {
      const accepted = acceptEnvelope(m.saveData);
      if (!accepted.ok) {
        // The running game is untouched: an invalid load is refused, never
        // half-applied.
        reply(
          simulationError("INVALID_SAVE", accepted.reason, {
            recoverable: true,
          }),
        );
        return;
      }
      // Built in full before it becomes the game, so a state that throws while
      // deriving cannot leave the worker holding half a hotel.
      const restored = new GameSimulation(accepted.state);
      restored.refreshDerivedState();
      simulation = restored;
      ensureTimer();
      publishSnapshot();
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
      correlation.set(envelope.commandId, [
        ...(correlation.get(envelope.commandId) ?? []),
        m.requestId,
      ]);
      if (!arrivedAt.has(envelope.commandId))
        arrivedAt.set(envelope.commandId, now());
      simulation.queueEnvelope(envelope);
      // A paused game applies the command without advancing the calendar; a
      // running one decides it in the next commands phase. Either way the
      // acknowledgement waits until it has actually been applied.
      if (speed === 0) {
        simulation.applyPendingCommands();
        publishCommandResults();
        publishDomainEvents();
        publishDelta();
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
      if (!simulation) {
        reply(
          simulationError("NOT_INITIALISED", "no game is running", {
            recoverable: true,
            requestId: m.requestId,
          }),
        );
        return;
      }
      // The whole game is an entity too: this is how a client whose delta
      // chain has broken asks to be put back in step.
      if (m.entityId === WHOLE_GAME_ENTITY_ID) {
        publishSnapshot(m.requestId);
        return;
      }
      const found = entityDetail(simulation.state, m.entityId);
      if (!found) {
        reply(
          simulationError("ENTITY_NOT_FOUND", `no entity ${m.entityId}`, {
            recoverable: true,
            requestId: m.requestId,
          }),
        );
        return;
      }
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "ENTITY_DETAILS",
        requestId: m.requestId,
        entityId: m.entityId,
        kind: found.kind,
        detail: found.detail,
      });
      return;
    }
    case "REQUEST_SAVE": {
      if (!simulation) {
        reply(
          simulationError("NOT_INITIALISED", "no game is running", {
            recoverable: true,
            requestId: m.requestId,
          }),
        );
        return;
      }
      const envelope = prepareEnvelope(simulation.snapshot());
      const problems = validateEnvelope(envelope);
      if (problems.length > 0) {
        // A save the worker would not accept back is not a save; refusing to
        // hand it out beats storing a file that cannot be loaded.
        reply(
          simulationError("INVALID_SAVE", problems.join("; "), {
            recoverable: true,
            requestId: m.requestId,
          }),
        );
        return;
      }
      reply({
        protocolVersion: PROTOCOL_VERSION,
        type: "SAVE_DATA",
        requestId: m.requestId,
        saveData: envelope,
      });
      return;
    }
    default:
      return;
  }
};
