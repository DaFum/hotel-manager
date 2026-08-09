import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROTOCOL_VERSION, type WorkerResponse } from "../domain/protocol";

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
  const send = (message: unknown) =>
    (self.onmessage as (e: MessageEvent) => void)({
      data: message,
    } as MessageEvent);
  return { posted, send };
}

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
    expect(delta?.snapshot.stateVersion).toBe(accepted[0].stateVersion);
  });

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

  it("refuses a message that carries a foreign protocol version", async () => {
    const { posted, send } = await bootWorker();
    send({ protocolVersion: 99, type: "INIT_GAME", seed: 5 });

    expect(of(posted, "SIMULATION_ERROR")).toHaveLength(1);
    expect(of(posted, "READY")).toHaveLength(0);
  });
});
