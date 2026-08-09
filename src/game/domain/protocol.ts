import type { GameCommand } from "./commands";
import type { DomainEvent } from "./events";
import type { GameSnapshot } from "./snapshot";
export const PROTOCOL_VERSION = 1 as const;
export type WorkerRequest =
  | { protocolVersion: 1; type: "INIT_GAME"; seed: number }
  | { protocolVersion: 1; type: "LOAD_GAME"; saveData: unknown }
  | {
      protocolVersion: 1;
      type: "COMMAND";
      /** Transport correlation only; never the command's identity. */
      requestId: string;
      /** Authoritative command identity, minted by the issuer. */
      commandId: string;
      command: GameCommand;
      /** The state version the issuer believed it was acting on. */
      expectedStateVersion?: number;
    }
  | { protocolVersion: 1; type: "SET_SPEED"; speed: 0 | 1 | 2 | 4 | 16 }
  | { protocolVersion: 1; type: "PAUSE" }
  | { protocolVersion: 1; type: "RESUME" }
  | { protocolVersion: 1; type: "REQUEST_SAVE"; requestId: string }
  | {
      protocolVersion: 1;
      type: "REQUEST_DETAILS";
      requestId: string;
      entityId: string;
    };
export type WorkerResponse =
  | { protocolVersion: 1; type: "READY"; snapshot: GameSnapshot }
  | {
      protocolVersion: 1;
      type: "COMMAND_ACCEPTED";
      requestId: string;
      commandId: string;
      /** The state version the command produced; it has already been applied. */
      stateVersion: number;
    }
  | {
      protocolVersion: 1;
      type: "COMMAND_REJECTED";
      requestId: string;
      commandId: string;
      reason: string;
    }
  | { protocolVersion: 1; type: "STATE_DELTA"; snapshot: GameSnapshot }
  | { protocolVersion: 1; type: "SNAPSHOT"; snapshot: GameSnapshot }
  | { protocolVersion: 1; type: "DOMAIN_EVENTS"; events: DomainEvent[] }
  | {
      protocolVersion: 1;
      type: "SAVE_DATA";
      requestId: string;
      saveData: unknown;
    }
  | { protocolVersion: 1; type: "SIMULATION_ERROR"; message: string }
  | {
      protocolVersion: 1;
      type: "PERF_SAMPLE";
      tickMs: number;
      visibleAgents: number;
    };
