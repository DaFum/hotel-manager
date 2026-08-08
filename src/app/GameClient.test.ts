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

  it("sends commands with a stable request id", () => {
    const worker = fakeWorker();
    const client = new GameClient(worker);
    expect(client.sendCommand(SET_RATE)).toBe("req.1");
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId: "req.1",
      command: SET_RATE,
    });
    expect(client.sendCommand(SET_RATE)).toBe("req.2");
  });
});
