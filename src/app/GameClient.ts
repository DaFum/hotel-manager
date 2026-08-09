import type { GameCommand } from "../game/domain/commands";
import type { GameSnapshot } from "../game/domain/snapshot";
import type { DomainEvent } from "../game/domain/events";
import {
  PROTOCOL_VERSION,
  WHOLE_GAME_ENTITY_ID,
  type SimulationError,
  type WorkerRequest,
  type WorkerResponse,
} from "../game/domain/protocol";
import {
  DeltaBaseMismatchError,
  applyStateDelta,
} from "../game/domain/stateDelta";

type SnapshotListener = (snapshot: GameSnapshot) => void;
type ErrorListener = (message: string) => void;
type SaveListener = (saveData: unknown, requestId: string) => void;
type RejectionListener = (rejection: {
  requestId: string;
  commandId: string;
  reason: string;
}) => void;
type AcceptanceListener = (acceptance: {
  requestId: string;
  commandId: string;
  stateVersion: number;
}) => void;
type DomainEventListener = (events: readonly DomainEvent[]) => void;
type DetailsListener = (details: {
  requestId: string;
  entityId: string;
  kind: string;
  detail: unknown;
}) => void;

/** Removes a listener. Calling it twice is safe and does nothing. */
export type Unsubscribe = () => void;

let clients = 0;
const nextClientId = () => ++clients;

/**
 * Thin, UI-side handle on the authoritative worker. It owns no rules: it only
 * sends versioned requests and fans out versioned responses.
 */
export class GameClient {
  private snapshotListeners: SnapshotListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private saveListeners: SaveListener[] = [];
  private rejectionListeners: RejectionListener[] = [];
  private acceptanceListeners: AcceptanceListener[] = [];
  private domainEventListeners: DomainEventListener[] = [];
  private detailsListeners: DetailsListener[] = [];
  private simulationErrorListeners: ((error: SimulationError) => void)[] = [];
  /** The last snapshot the worker published, and which publication it was. */
  private held: GameSnapshot | null = null;
  private publication = 0;
  /** After disposal the handle is inert; late worker messages are ignored. */
  private disposed = false;
  /** True while a whole-game resynchronisation is asked for and unanswered. */
  private resyncPending = false;
  private requestCounter = 0;
  /** Distinguishes command ids minted by concurrent clients in one session. */
  private readonly sessionId = nextClientId();

  constructor(private worker: Worker) {
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      this.handle(event.data);
  }

  onSnapshot(listener: SnapshotListener): Unsubscribe {
    return this.subscribe(this.snapshotListeners, listener);
  }

  onError(listener: ErrorListener): Unsubscribe {
    return this.subscribe(this.errorListeners, listener);
  }

  onSaveData(listener: SaveListener): Unsubscribe {
    return this.subscribe(this.saveListeners, listener);
  }

  onCommandRejected(listener: RejectionListener): Unsubscribe {
    return this.subscribe(this.rejectionListeners, listener);
  }

  onCommandAccepted(listener: AcceptanceListener): Unsubscribe {
    return this.subscribe(this.acceptanceListeners, listener);
  }

  onDomainEvents(listener: DomainEventListener): Unsubscribe {
    return this.subscribe(this.domainEventListeners, listener);
  }

  onEntityDetails(listener: DetailsListener): Unsubscribe {
    return this.subscribe(this.detailsListeners, listener);
  }

  /** The structured form of an error, with its code and whether it is fatal. */
  onSimulationError(listener: (error: SimulationError) => void): Unsubscribe {
    return this.subscribe(this.simulationErrorListeners, listener);
  }

  private subscribe<L>(listeners: L[], listener: L): Unsubscribe {
    listeners.push(listener);
    return () => {
      const at = listeners.indexOf(listener);
      if (at >= 0) listeners.splice(at, 1);
    };
  }

  init(seed: number): void {
    this.send({ protocolVersion: PROTOCOL_VERSION, type: "INIT_GAME", seed });
  }

  setSpeed(speed: 0 | 1 | 2 | 4 | 16): void {
    this.send({ protocolVersion: PROTOCOL_VERSION, type: "SET_SPEED", speed });
  }

  requestSave(): string {
    const requestId = `req.${++this.requestCounter}`;
    this.send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_SAVE",
      requestId,
    });
    return requestId;
  }

  /**
   * Asks the worker about one entity. The whole game is an entity too, which
   * is how a client whose delta chain has broken asks to be resynchronised.
   */
  requestDetails(entityId: string): string {
    const requestId = `req.${++this.requestCounter}`;
    this.send({
      protocolVersion: PROTOCOL_VERSION,
      type: "REQUEST_DETAILS",
      requestId,
      entityId,
    });
    return requestId;
  }

  loadGame(saveData: unknown): void {
    this.send({
      protocolVersion: PROTOCOL_VERSION,
      type: "LOAD_GAME",
      saveData,
    });
  }

  /**
   * Sends a command and returns the correlation id for this exchange. The
   * command's own identity is separate and travels with it: the request id
   * only ties a reply back to the caller that is waiting for it.
   */
  sendCommand(
    command: GameCommand,
    options: { expectedStateVersion?: number } = {},
  ): string {
    const requestId = `req.${++this.requestCounter}`;
    this.send({
      protocolVersion: PROTOCOL_VERSION,
      type: "COMMAND",
      requestId,
      commandId: `cmd.${this.sessionId}.${this.requestCounter}`,
      command,
      // Omitted rather than sent as undefined: declaring no expectation and
      // expecting version "undefined" are different things to the worker.
      ...(options.expectedStateVersion === undefined
        ? {}
        : { expectedStateVersion: options.expectedStateVersion }),
    });
    return requestId;
  }

  dispose(): void {
    this.disposed = true;
    // Dropping the listeners as well as the worker means a message already in
    // flight cannot reach a component that has been unmounted.
    this.snapshotListeners = [];
    this.errorListeners = [];
    this.saveListeners = [];
    this.rejectionListeners = [];
    this.acceptanceListeners = [];
    this.domainEventListeners = [];
    this.detailsListeners = [];
    this.simulationErrorListeners = [];
    this.held = null;
    this.resyncPending = false;
    this.worker.terminate();
  }

  /**
   * Asks to be put back in step, once. The worker keeps publishing deltas
   * while the snapshot is being prepared, and every one of them would fail
   * the same way; without this guard the client answers each with another
   * request, so the burst scales with the publication rate.
   */
  private resynchronise(): void {
    if (this.resyncPending) return;
    this.resyncPending = true;
    this.requestDetails(WHOLE_GAME_ENTITY_ID);
  }

  private send(message: WorkerRequest): void {
    this.worker.postMessage(message);
  }

  private handle(message: WorkerResponse): void {
    if (this.disposed) return;
    if (message?.protocolVersion !== PROTOCOL_VERSION) {
      for (const l of this.errorListeners) l("protocol mismatch");
      return;
    }
    switch (message.type) {
      case "READY":
      case "SNAPSHOT":
        this.held = message.snapshot;
        this.publication = message.publication;
        this.resyncPending = false;
        for (const l of this.snapshotListeners) l(message.snapshot);
        return;
      case "STATE_DELTA": {
        if (!this.held) {
          // Nothing to apply it to; ask to be put back in step.
          this.resynchronise();
          return;
        }
        try {
          this.held = applyStateDelta(
            this.held,
            message.delta,
            this.publication,
          );
        } catch (error) {
          if (!(error instanceof DeltaBaseMismatchError)) throw error;
          // A delta computed against a state this client never held would
          // produce a hotel that never existed. Refuse it and resynchronise.
          this.resynchronise();
          return;
        }
        this.publication = message.delta.publication;
        for (const l of this.snapshotListeners) l(this.held);
        return;
      }
      case "ENTITY_DETAILS":
        for (const l of this.detailsListeners)
          l({
            requestId: message.requestId,
            entityId: message.entityId,
            kind: message.kind,
            detail: message.detail,
          });
        return;
      case "COMMAND_REJECTED":
        for (const l of this.rejectionListeners)
          l({
            requestId: message.requestId,
            commandId: message.commandId,
            reason: message.reason,
          });
        return;
      case "COMMAND_ACCEPTED":
        for (const l of this.acceptanceListeners)
          l({
            requestId: message.requestId,
            commandId: message.commandId,
            stateVersion: message.stateVersion,
          });
        return;
      case "DOMAIN_EVENTS":
        for (const l of this.domainEventListeners) l(message.events);
        return;
      case "SAVE_DATA":
        for (const l of this.saveListeners)
          l(message.saveData, message.requestId);
        return;
      case "SIMULATION_ERROR":
        for (const l of this.errorListeners) l(message.message);
        for (const l of this.simulationErrorListeners) l(message);
        return;
      default:
        return;
    }
  }
}
