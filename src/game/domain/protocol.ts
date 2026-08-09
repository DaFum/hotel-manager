import type { GameCommand } from "./commands";
import type { DomainEvent } from "./events";
import type { GameSnapshot } from "./snapshot";
import type { StateDelta } from "./stateDelta";

/**
 * Version 2 carries authoritative command identity on COMMAND, an applied
 * state version on COMMAND_ACCEPTED, a real delta on STATE_DELTA, entity
 * answers for REQUEST_DETAILS and structured errors.
 */
export const PROTOCOL_VERSION = 2 as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

/**
 * The whole game as an entity. Asking for its details is how a client whose
 * delta chain has broken asks to be resynchronised, without inventing a
 * request family outside the MASTER protocol.
 */
export const WHOLE_GAME_ENTITY_ID = "game" as const;

/** What went wrong, in a form a caller can branch on. */
export type SimulationErrorCode =
  | "PROTOCOL_MISMATCH"
  | "NOT_INITIALISED"
  | "INVALID_SAVE"
  | "ENTITY_NOT_FOUND"
  | "TICK_FAILED";

export interface SimulationError {
  code: SimulationErrorCode;
  message: string;
  /**
   * Whether the simulation is still usable. A recoverable error refuses one
   * request; a fatal one has stopped the world.
   */
  recoverable: boolean;
  /** Present when the error answers a specific request. */
  requestId?: string;
}

export type WorkerRequest =
  | { protocolVersion: ProtocolVersion; type: "INIT_GAME"; seed: number }
  | { protocolVersion: ProtocolVersion; type: "LOAD_GAME"; saveData: unknown }
  | {
      protocolVersion: ProtocolVersion;
      type: "COMMAND";
      /** Transport correlation only; never the command's identity. */
      requestId: string;
      /** Authoritative command identity, minted by the issuer. */
      commandId: string;
      command: GameCommand;
      /** The state version the issuer believed it was acting on. */
      expectedStateVersion?: number;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "SET_SPEED";
      speed: 0 | 1 | 2 | 4 | 16;
    }
  | { protocolVersion: ProtocolVersion; type: "PAUSE" }
  | { protocolVersion: ProtocolVersion; type: "RESUME" }
  | {
      protocolVersion: ProtocolVersion;
      type: "REQUEST_SAVE";
      requestId: string;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "REQUEST_DETAILS";
      requestId: string;
      /** A stable entity id, or WHOLE_GAME_ENTITY_ID for a resynchronisation. */
      entityId: string;
    };

export type WorkerResponse =
  | {
      protocolVersion: ProtocolVersion;
      type: "READY";
      snapshot: GameSnapshot;
      /** The publication this snapshot is; deltas are numbered against it. */
      publication: number;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "COMMAND_ACCEPTED";
      requestId: string;
      commandId: string;
      /** The state version the command produced; it has already been applied. */
      stateVersion: number;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "COMMAND_REJECTED";
      requestId: string;
      commandId: string;
      reason: string;
    }
  | { protocolVersion: ProtocolVersion; type: "STATE_DELTA"; delta: StateDelta }
  | {
      protocolVersion: ProtocolVersion;
      type: "SNAPSHOT";
      snapshot: GameSnapshot;
      publication: number;
      /** Present when the snapshot answers a REQUEST_DETAILS. */
      requestId?: string;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "ENTITY_DETAILS";
      requestId: string;
      entityId: string;
      /** What kind of thing was found, so the UI can render it. */
      kind: string;
      detail: unknown;
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "DOMAIN_EVENTS";
      events: DomainEvent[];
    }
  | {
      protocolVersion: ProtocolVersion;
      type: "SAVE_DATA";
      requestId: string;
      saveData: unknown;
    }
  | ({
      protocolVersion: ProtocolVersion;
      type: "SIMULATION_ERROR";
    } & SimulationError)
  | {
      protocolVersion: ProtocolVersion;
      type: "PERF_SAMPLE";
      /** Measured wall time of the last tick's work, for reporting only. */
      tickMs: number;
      /** Measured wall time from receiving a command to acknowledging it. */
      commandLatencyMs: number;
      visibleAgents: number;
    };

export function simulationError(
  code: SimulationErrorCode,
  message: string,
  options: { recoverable: boolean; requestId?: string },
): Extract<WorkerResponse, { type: "SIMULATION_ERROR" }> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: "SIMULATION_ERROR",
    code,
    message,
    recoverable: options.recoverable,
    ...(options.requestId === undefined
      ? {}
      : { requestId: options.requestId }),
  };
}
