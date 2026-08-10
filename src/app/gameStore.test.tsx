import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROTOCOL_VERSION, type WorkerResponse } from "../game/domain/protocol";
import { useGameStore } from "./gameStore";

class FakeWorker {
  static current: FakeWorker;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.current = this;
  }
  reply(message: WorkerResponse) {
    this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>);
  }
}

describe("useGameStore resume control", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["accepted", "COMMAND_ACCEPTED", 1],
    ["rejected", "COMMAND_REJECTED", 0],
  ] as const)("handles a %s resume response", async (status, type, speed) => {
    vi.stubGlobal("Worker", FakeWorker);
    const { result, unmount } = renderHook(() => useGameStore(7));
    await waitFor(() => expect(FakeWorker.current).toBeTruthy());

    act(() => result.current.requestResume());
    const request = FakeWorker.current.postMessage.mock.calls
      .map(([message]) => message)
      .find((message) => message.type === "RESUME");
    expect(request).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      type: "RESUME",
      requestId: expect.any(String),
    });

    act(() =>
      FakeWorker.current.reply(
        type === "COMMAND_ACCEPTED"
          ? {
              protocolVersion: PROTOCOL_VERSION,
              type,
              requestId: request.requestId,
              commandId: "control.resume",
              stateVersion: 0,
            }
          : {
              protocolVersion: PROTOCOL_VERSION,
              type,
              requestId: request.requestId,
              commandId: "control.resume",
              reason: "simulation halted",
            },
      ),
    );
    expect(result.current.pauseStatus).toBe(status);
    expect(result.current.speed).toBe(speed);
    unmount();
  });
});
