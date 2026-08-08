import type { GameCommand } from "../game/domain/commands";
import type { GameSnapshot } from "../game/domain/snapshot";
import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../game/domain/protocol";

type SnapshotListener = (snapshot: GameSnapshot) => void;
type ErrorListener = (message: string) => void;

/**
 * Thin, UI-side handle on the authoritative worker. It owns no rules: it only
 * sends versioned requests and fans out versioned responses.
 */
export class GameClient {
  private snapshotListeners: SnapshotListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private requestCounter = 0;

  constructor(private worker: Worker) {
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      this.handle(event.data);
  }

  onSnapshot(listener: SnapshotListener): void {
    this.snapshotListeners.push(listener);
  }

  onError(listener: ErrorListener): void {
    this.errorListeners.push(listener);
  }

  init(seed: number): void {
    this.send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed });
  }

  setSpeed(speed: 0 | 1 | 2 | 4 | 16): void {
    this.send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed });
  }

  sendCommand(command: GameCommand): string {
    const requestId = `req.${++this.requestCounter}`;
    this.send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId,
      command,
    });
    return requestId;
  }

  dispose(): void {
    this.worker.terminate();
  }

  private send(message: WorkerRequest): void {
    this.worker.postMessage(message);
  }

  private handle(message: WorkerResponse): void {
    if (message?.protocolVersion !== PROTOCOL_VERSION) {
      for (const l of this.errorListeners) l("protocol mismatch");
      return;
    }
    switch (message.type) {
      case "READY":
      case "SNAPSHOT":
      case "STATE_DELTA":
        for (const l of this.snapshotListeners) l(message.snapshot);
        return;
      case "SIMULATION_ERROR":
        for (const l of this.errorListeners) l(message.message);
        return;
      default:
        return;
    }
  }
}
