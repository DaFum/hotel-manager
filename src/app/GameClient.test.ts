import { describe, expect, it, vi } from "vitest";
import { GameClient } from "./GameClient";
import { PROTOCOL_VERSION } from "../game/domain/protocol";

function fakeWorker() {
  const worker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null as ((e: MessageEvent) => void) | null,
  };
  return worker as unknown as Worker & {
    postMessage: ReturnType<typeof vi.fn>;
  };
}

const SET_RATE = {
  type: "SET_RATE",
  dateKey: "1991-01-02",
  category: "single",
  rateMinor: 9500,
} as const;

describe("GameClient protocol", () => {
  it("sends versioned INIT_GAME", () => {
    const worker = fakeWorker();
    new GameClient(worker).init(42);
    expect(worker.postMessage).toHaveBeenCalledWith({
      protocolVersion: PROTOCOL_VERSION,
      type: "INIT_GAME",
      seed: 42,
    });
  });

  it("delivers snapshots from matching protocol responses", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    const seen: unknown[] = [];
    client.onSnapshot((s) => seen.push(s));
    worker.onmessage!({
      data: {
        protocolVersion: PROTOCOL_VERSION,
        type: "READY",
        snapshot: { cashMinor: 5 },
      },
    } as MessageEvent);
    expect(seen).toEqual([{ cashMinor: 5 }]);
  });

  it("rejects responses that carry the wrong protocol version", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    const errors: string[] = [];
    const seen: unknown[] = [];
    client.onSnapshot((s) => seen.push(s));
    client.onError((m) => errors.push(m));
    worker.onmessage!({
      data: { protocolVersion: 99, type: "READY", snapshot: {} },
    } as MessageEvent);
    expect(seen).toEqual([]);
    expect(errors).toEqual(["protocol mismatch"]);
  });

  it("sends commands with a stable request id and a separate command id", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    expect(client.sendCommand(SET_RATE)).toBe("req.1");
    const sent = worker.postMessage.mock.lastCall![0];
    expect(sent).toMatchObject({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.1",
      command: SET_RATE,
    });
    // Correlation and identity are different things and must not be the same
    // value: the worker logs one of them for ever and forgets the other.
    expect(sent.commandId).not.toBe(sent.requestId);
    expect(client.sendCommand(SET_RATE)).toBe("req.2");
    expect(worker.postMessage.mock.lastCall![0].commandId).not.toBe(
      sent.commandId,
    );
  });

  it("delivers accepted commands and domain events to their listeners", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    const accepted: unknown[] = [];
    const events: unknown[] = [];
    client.onCommandAccepted((a) => accepted.push(a));
    client.onDomainEvents((e) => events.push(...e));

    worker.onmessage!({
      data: {
        protocolVersion: PROTOCOL_VERSION,
        type: "COMMAND_ACCEPTED",
        requestId: "req.1",
        commandId: "cmd.1.1",
        stateVersion: 7,
      },
    } as MessageEvent);
    worker.onmessage!({
      data: {
        protocolVersion: PROTOCOL_VERSION,
        type: "DOMAIN_EVENTS",
        events: [{ eventId: "evt.1", sequence: 1 }],
      },
    } as MessageEvent);

    expect(accepted).toEqual([
      { requestId: "req.1", commandId: "cmd.1.1", stateVersion: 7 },
    ]);
    expect(events).toEqual([{ eventId: "evt.1", sequence: 1 }]);
  });

  it("stops delivering events to unsubscribed and disposed listeners", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    const events: unknown[] = [];
    const snapshots: unknown[] = [];
    const unsubscribe = client.onDomainEvents((e) => events.push(...e));
    client.onSnapshot((s) => snapshots.push(s));

    const deliverEvent = () =>
      worker.onmessage!({
        data: {
          protocolVersion: PROTOCOL_VERSION,
          type: "DOMAIN_EVENTS",
          events: [{ eventId: "evt.1" }],
        },
      } as MessageEvent);
    const deliverSnapshot = () =>
      worker.onmessage!({
        data: {
          protocolVersion: PROTOCOL_VERSION,
          type: "SNAPSHOT",
          snapshot: { cashMinor: 1 },
        },
      } as MessageEvent);

    deliverEvent();
    unsubscribe();
    deliverEvent();
    // Unsubscribing twice is safe and leaves the other listeners alone.
    unsubscribe();
    deliverSnapshot();
    expect(events).toHaveLength(1);
    expect(snapshots).toHaveLength(1);

    client.dispose();
    deliverSnapshot();
    deliverEvent();
    expect(snapshots).toHaveLength(1);
    expect(events).toHaveLength(1);
  });

  it("passes an expected state version through when the caller declares one", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    client.sendCommand(SET_RATE, { expectedStateVersion: 12 });
    expect(worker.postMessage.mock.lastCall![0].expectedStateVersion).toBe(12);
  });
});
