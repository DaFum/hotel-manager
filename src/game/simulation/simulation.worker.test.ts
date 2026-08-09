import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROTOCOL_VERSION,
  WHOLE_GAME_ENTITY_ID,
  type WorkerResponse,
} from "../domain/protocol";
import { SAVE_VERSION } from "../persistence/saveVersions";

/**
 * The worker module wires itself to `self` on import, so each test gets a
 * fresh module with its own posted-message log.
 */
async function bootWorker() {
  vi.resetModules();
  const posted: WorkerResponse[] = [];
  vi.spyOn(self, "postMessage").mockImplementation((message: unknown) => {
    posted.push(message as WorkerResponse);
  });
  await import("./simulation.worker");
  const handler = self.onmessage as (e: MessageEvent) => void;
  const send = (message: unknown) =>
    handler({
      data: message,
    } as MessageEvent);
  activeWorkers.push(send);
  return { posted, send };
}

const activeWorkers: ((message: unknown) => void)[] = [];

const of = <T extends WorkerResponse["type"]>(
  posted: readonly WorkerResponse[],
  type: T,
) =>
  posted.filter((m) => m.type === type) as Extract<
    WorkerResponse,
    { type: T }
  >[];

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  for (const send of activeWorkers.splice(0))
    send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed: 0 });
});

describe("simulation worker", () => {
  it("acknowledges a command only after it has been applied", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    const initialVersion = of(posted, "READY")[0].snapshot.stateVersion;
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.1",
      commandId: "cmd.applied.1",
      command: {
        type: "SET_RATE",
        dateKey: "1991-01-04",
        category: "double",
        rateMinor: 17_000,
      },
    });

    const accepted = of(posted, "COMMAND_ACCEPTED");
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toMatchObject({
      requestId: "req.1",
      commandId: "cmd.applied.1",
    });
    // The acknowledgement names the version the command produced, and the
    // snapshot published alongside it is already at that version: an
    // acknowledgement here means applied, not queued.
    expect(accepted[0].stateVersion).toBe(initialVersion + 1);
    const delta = of(posted, "STATE_DELTA").at(-1);
    expect(
      (delta?.delta.changed as { stateVersion?: number }).stateVersion,
    ).toBe(accepted[0].stateVersion);
  }, 15_000);

  it("reports a refused command against the same correlation id", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.9",
      commandId: "cmd.refused.1",
      command: { type: "SET_SPECIALIZATION", specializationId: "not-real" },
    });

    const rejected = of(posted, "COMMAND_REJECTED");
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      requestId: "req.9",
      commandId: "cmd.refused.1",
    });
    expect(of(posted, "COMMAND_ACCEPTED")).toHaveLength(0);
  });

  it("refuses a command decided against a stale state version", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    const rate = (
      commandId: string,
      requestId: string,
      expectedStateVersion?: number,
    ) =>
      send({
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND",
        requestId,
        commandId,
        command: {
          type: "SET_RATE",
          dateKey: "1991-01-04",
          category: "double",
          rateMinor: 17_000,
        },
        ...(expectedStateVersion === undefined ? {} : { expectedStateVersion }),
      });

    // Move the world on, so the version the second command names is behind.
    rate("cmd.first", "req.first");
    const applied = of(posted, "COMMAND_ACCEPTED")[0].stateVersion;
    posted.length = 0;

    rate("cmd.stale", "req.stale", applied - 1);

    const rejected = of(posted, "COMMAND_REJECTED");
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      requestId: "req.stale",
      commandId: "cmd.stale",
    });
    expect(rejected[0].reason).toMatch(/state version/i);
    expect(of(posted, "COMMAND_ACCEPTED")).toHaveLength(0);
    // Nothing about the hotel moved, so the version the client holds stands.
    const delta = of(posted, "STATE_DELTA").at(-1)?.delta;
    expect(delta?.changed).not.toHaveProperty("stateVersion");

    // The same command against the version that is actually current is taken.
    posted.length = 0;
    rate("cmd.fresh", "req.fresh", applied);
    expect(of(posted, "COMMAND_ACCEPTED")[0].stateVersion).toBe(applied + 1);
  });

  it("answers both callers when two requests share a command id", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    posted.length = 0;
    const rate = (requestId: string) =>
      send({
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND",
        requestId,
        commandId: "cmd.retried",
        command: {
          type: "SET_RATE",
          dateKey: "1991-01-06",
          category: "double",
          rateMinor: 16_000,
        },
      });

    rate("req.original");
    rate("req.retry");

    // The original is answered with its acceptance and the retry with the
    // duplicate rejection; neither caller is left waiting on the other's id.
    expect(of(posted, "COMMAND_ACCEPTED")[0]).toMatchObject({
      requestId: "req.original",
      commandId: "cmd.retried",
    });
    const rejected = of(posted, "COMMAND_REJECTED");
    expect(rejected).toHaveLength(1);
    expect(rejected[0].requestId).toBe("req.retry");
    expect(rejected[0].reason).toMatch(/duplicate/i);
  });

  it("publishes the domain events a command caused", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.2",
      commandId: "cmd.hire.1",
      command: {
        type: "HIRE",
        role: "reception",
        shift: "night",
        monthlyWageMinor: 400_000,
      },
    });

    const published = of(posted, "DOMAIN_EVENTS").flatMap((m) => m.events);
    const hired = published.find((e) => e.payload.type === "STAFF_HIRED");
    expect(hired?.causedBy).toBe("cmd.hire.1");
  });

  it("answers entity details by stable id or a typed not-found error", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    const roomId = of(posted, "READY")[0].snapshot.hotel.rooms[0].id;
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_DETAILS",
      requestId: "req.room",
      entityId: roomId,
    });
    const details = of(posted, "ENTITY_DETAILS");
    expect(details).toHaveLength(1);
    expect(details[0]).toMatchObject({
      requestId: "req.room",
      entityId: roomId,
      kind: "room",
    });
    // The answer is the room, not the hotel with the room somewhere inside it.
    expect(of(posted, "SNAPSHOT")).toHaveLength(0);
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_DETAILS",
      requestId: "req.ghost",
      entityId: "room.does-not-exist",
    });
    const errors = of(posted, "SIMULATION_ERROR");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "ENTITY_NOT_FOUND",
      recoverable: true,
      requestId: "req.ghost",
    });
  });

  it("resynchronises a client that asks for the whole game", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_DETAILS",
      requestId: "req.sync",
      entityId: WHOLE_GAME_ENTITY_ID,
    });

    const snapshots = of(posted, "SNAPSHOT");
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].requestId).toBe("req.sync");
    expect(snapshots[0].publication).toBeGreaterThan(0);
  });

  it("publishes a delta rather than a snapshot once a game is running", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    const ready = of(posted, "READY")[0];
    posted.length = 0;

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.1",
      commandId: "cmd.delta.1",
      command: {
        type: "SET_RATE",
        dateKey: "1991-01-04",
        category: "double",
        rateMinor: 17_000,
      },
    });

    const delta = of(posted, "STATE_DELTA").at(-1)!.delta;
    expect(delta.basePublication).toBe(ready.publication);
    expect(delta.publication).toBe(ready.publication + 1);
    // Only the sections the command touched travel.
    expect(Object.keys(delta.changed).length).toBeLessThan(
      Object.keys(ready.snapshot).length,
    );
    expect(Object.keys(delta.changed)).toContain("rates");
  });

  it("emits measured performance samples without feeding game logic", async () => {
    const { posted, send } = await bootWorker();
    vi.useFakeTimers();
    try {
      send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
      send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed: 1 });
      posted.length = 0;
      vi.advanceTimersByTime(250);

      const samples = of(posted, "PERF_SAMPLE");
      expect(samples.length).toBeGreaterThan(0);
      for (const sample of samples) {
        expect(Number.isFinite(sample.tickMs)).toBe(true);
        expect(sample.tickMs).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(sample.commandLatencyMs)).toBe(true);
        expect(Number.isSafeInteger(sample.visibleAgents)).toBe(true);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("validates a save envelope before replacing simulation state", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_SAVE",
      requestId: "req.save",
    });
    const envelope = of(posted, "SAVE_DATA")[0].saveData as {
      saveVersion: number;
      protocolVersion: number;
      contentVersion: string;
      rngState: Record<string, number>;
      state: { elapsedMinutes: number; rngState: Record<string, number> };
    };
    // What the worker hands out is a versioned envelope prepared from
    // authoritative state, not a bare snapshot.
    expect(envelope.saveVersion).toBe(SAVE_VERSION);
    expect(envelope.protocolVersion).toBe(PROTOCOL_VERSION);
    // The header and the state carry the same streams; a save where they
    // disagree would replay as a different hotel depending on which is read.
    expect(envelope.rngState).toEqual(envelope.state.rngState);

    // Move the game on, then offer it a save it must refuse.
    send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed: 1 });
    posted.length = 0;
    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "LOAD_GAME",
      saveData: { ...envelope, contentVersion: "some-other-game" },
    });
    const refused = of(posted, "SIMULATION_ERROR");
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({
      code: "INVALID_SAVE",
      recoverable: true,
    });
    // Refused means nothing was replaced: no snapshot was published.
    expect(of(posted, "SNAPSHOT")).toHaveLength(0);

    posted.length = 0;
    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "LOAD_GAME",
      saveData: envelope,
    });
    const restored = of(posted, "SNAPSHOT");
    expect(restored).toHaveLength(1);
    expect(restored[0].snapshot.elapsedMinutes).toBe(
      envelope.state.elapsedMinutes,
    );
  });

  it("rejects every command still waiting when a load replaces the game", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed: 5 });
    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_SAVE",
      requestId: "req.save.pending",
    });
    const envelope = of(posted, "SAVE_DATA")[0].saveData;
    send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed: 1 });
    posted.length = 0;
    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.pending",
      commandId: "cmd.pending",
      command: {
        type: "SET_RATE",
        dateKey: "1991-01-04",
        category: "double",
        rateMinor: 17000,
      },
    });
    expect(of(posted, "COMMAND_ACCEPTED")).toHaveLength(0);

    send({
      protocolVersion: PROTOCOL_VERSION,
      type: "LOAD_GAME",
      saveData: envelope,
    });

    expect(of(posted, "COMMAND_REJECTED")).toContainEqual(
      expect.objectContaining({
        requestId: "req.pending",
        commandId: "cmd.pending",
        reason: "simulation replaced by load",
      }),
    );
  });

  it("refuses a message that carries a foreign protocol version", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: 99, type: "INIT_GAME", seed: 5 });

    expect(of(posted, "SIMULATION_ERROR")).toHaveLength(1);
    expect(of(posted, "SIMULATION_ERROR")[0]).toMatchObject({
      code: "PROTOCOL_MISMATCH",
      recoverable: false,
    });
    expect(of(posted, "READY")).toHaveLength(0);
  });
});
