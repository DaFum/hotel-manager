import { describe, expect, it } from "vitest";
import {
  PROTOCOL_VERSION,
  WHOLE_GAME_ENTITY_ID,
  simulationError,
  type WorkerRequest,
  type WorkerResponse,
} from "./protocol";
import {
  DeltaBaseMismatchError,
  applyStateDelta,
  computeStateDelta,
} from "./stateDelta";
import type { GameSnapshot } from "./snapshot";
import { createInitialGameState } from "../simulation/initialState";

const snapshot = (overrides: Partial<GameSnapshot> = {}): GameSnapshot =>
  ({ ...createInitialGameState(3), ...overrides }) as GameSnapshot;

describe("worker protocol", () => {
  it("uses MASTER message names and protocol version", () => {
    const request: WorkerRequest = {
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "r1",
      commandId: "cmd.1",
      command: {
        type: "SET_RATE",
        dateKey: "1991-01-01",
        category: "single",
        rateMinor: 9000,
      },
    };
    expect(request.type).toBe("COMMAND");
    expect(request.protocolVersion).toBe(PROTOCOL_VERSION);
  });

  it("rejects a foreign protocol version as a fatal error", () => {
    const foreign: { protocolVersion: number } = {
      protocolVersion: PROTOCOL_VERSION + 1,
    };
    // The guard every endpoint applies: a message from another protocol is not
    // partially understood, it is refused.
    expect(foreign.protocolVersion === PROTOCOL_VERSION).toBe(false);

    const error = simulationError("PROTOCOL_MISMATCH", "wrong version", {
      recoverable: false,
    });
    expect(error.code).toBe("PROTOCOL_MISMATCH");
    expect(error.recoverable).toBe(false);
  });

  it("reports recoverable and fatal errors as structured codes", () => {
    const recoverable = simulationError("ENTITY_NOT_FOUND", "no entity x", {
      recoverable: true,
      requestId: "req.4",
    });
    expect(recoverable).toMatchObject({
      type: "SIMULATION_ERROR",
      code: "ENTITY_NOT_FOUND",
      recoverable: true,
      requestId: "req.4",
    });

    const fatal = simulationError("TICK_FAILED", "cash drifted", {
      recoverable: false,
    });
    expect(fatal.recoverable).toBe(false);
    // A message that answers nobody in particular carries no correlation id.
    expect("requestId" in fatal).toBe(false);
  });

  it("names the whole game as the entity a resynchronisation asks for", () => {
    const request: WorkerRequest = {
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_DETAILS",
      requestId: "req.1",
      entityId: WHOLE_GAME_ENTITY_ID,
    };
    expect(request.entityId).toBe("game");
  });

  it("carries only changed and removed fields in a state delta", () => {
    const base = snapshot();
    const next = snapshot({
      elapsedMinutes: 5,
      calendar: { dateKey: "1991-01-01", minuteOfDay: 5 },
    });

    const delta = computeStateDelta(base, next, {
      basePublication: 4,
      publication: 5,
    });

    expect(Object.keys(delta.changed).sort()).toEqual([
      "calendar",
      "elapsedMinutes",
    ]);
    expect(delta.removed).toEqual([]);
    // The point of the contract: a delta is a fraction of a snapshot, not a
    // snapshot with a different label on it.
    expect(Object.keys(delta.changed).length).toBeLessThan(
      Object.keys(next).length,
    );

    const rebuilt = applyStateDelta(base, delta, 4) as GameSnapshot;
    expect(rebuilt).toEqual(next);
  });

  it("records a section that has gone away as removed", () => {
    const base = snapshot();
    const next = snapshot();
    delete (next as unknown as Record<string, unknown>).lastMonthlyClose;

    const delta = computeStateDelta(base, next, {
      basePublication: 1,
      publication: 2,
    });

    expect(delta.removed).toEqual(["lastMonthlyClose"]);
    expect(
      "lastMonthlyClose" in
        (applyStateDelta(base, delta, 1) as unknown as Record<string, unknown>),
    ).toBe(false);
  });

  it("refuses a delta whose base is not the state it is offered", () => {
    const delta = computeStateDelta(
      snapshot(),
      snapshot({ elapsedMinutes: 5 }),
      {
        basePublication: 7,
        publication: 8,
      },
    );

    expect(() => applyStateDelta(snapshot(), delta, 6)).toThrow(
      DeltaBaseMismatchError,
    );
  });

  it("requires a correlation id on every answered response", () => {
    // A type-level check, not a check of literals written in this test: if a
    // response family that answers a request stopped declaring a required
    // `requestId`, this stops compiling. Whether the producers actually set it
    // is proven against the running worker in simulation.worker.test.ts.
    type Answered = Extract<
      WorkerResponse,
      {
        type:
          | "ENTITY_DETAILS"
          | "SAVE_DATA"
          | "COMMAND_ACCEPTED"
          | "COMMAND_REJECTED";
      }
    >;
    type HasRequiredRequestId<T> = T extends { requestId: string }
      ? undefined extends T["requestId"]
        ? never
        : T
      : never;
    // Assignable only while every answered variant declares a required id.
    const answered: HasRequiredRequestId<Answered> = {
      protocolVersion: PROTOCOL_VERSION,
      type: "ENTITY_DETAILS",
      requestId: "req.2",
      entityId: "room.101",
      kind: "room",
      detail: {},
    };
    expect(answered.requestId).toBe("req.2");
  });
});
