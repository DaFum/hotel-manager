import { captureRngState, restoreRngStreams } from "../domain/rng";
import type { GameState } from "../simulation/initialState";
import type {
  CommandEnvelope,
  CommandLogEntry,
  CommandResult,
} from "./commandEnvelope";
import type { GameCommand } from "./commandEnvelope";

/**
 * How many decided commands the save carries. The window bounds the save and
 * also bounds duplicate detection: an id that has scrolled out can be issued
 * again, which is why ids are derived from game time rather than reused.
 */
export const COMMAND_LOG_LIMIT = 256;

export type RngStreams = ReturnType<typeof restoreRngStreams>;

/**
 * The rules half of the boundary. `validate` answers from a state it must not
 * touch; `apply` writes to a draft and rejects by throwing.
 */
export interface CommandExecutor {
  validate(
    state: GameState,
    command: GameCommand,
  ): { ok: true } | { ok: false; reason: string };
  apply(draft: GameState, streams: RngStreams, envelope: CommandEnvelope): void;
}

/**
 * The single mutation boundary.
 *
 * Every command is decided the same way: identity and concurrency first, then
 * a read-only rules check, then execution against a private draft. Only a
 * draft that survived to the end is committed, and committing is the one place
 * the state version moves. A command that fails halfway therefore leaves
 * nothing behind — not a partial write, not an alert, not an RNG draw.
 */
export class CommandHandler {
  constructor(
    private readonly getState: () => GameState,
    private readonly setState: (next: GameState) => void,
    private readonly executor: CommandExecutor,
  ) {}

  /** Decides a batch in order and returns one result per envelope. */
  run(envelopes: readonly CommandEnvelope[]): CommandResult[] {
    return envelopes.map((envelope) => this.runOne(envelope));
  }

  private runOne(envelope: CommandEnvelope): CommandResult {
    const state = this.getState();

    if (state.commandLog.some((e) => e.commandId === envelope.commandId))
      return this.reject(envelope, "duplicate command id");

    if (
      envelope.expectedStateVersion !== undefined &&
      envelope.expectedStateVersion !== state.stateVersion
    )
      return this.reject(
        envelope,
        `stale expected state version ${envelope.expectedStateVersion}, current is ${state.stateVersion}`,
      );

    // Asked of the live state, which validate is contractually forbidden to
    // touch: the answer must not depend on having started the work.
    const verdict = this.executor.validate(state, envelope.payload);
    if (!verdict.ok) return this.reject(envelope, verdict.reason);

    const draft = structuredClone(state);
    const streams = restoreRngStreams(draft.rngState);
    try {
      this.executor.apply(draft, streams, envelope);
    } catch (error) {
      // The draft — and every RNG draw made inside it — is discarded.
      return this.reject(envelope, (error as Error).message);
    }

    draft.rngState = captureRngState(streams);
    draft.stateVersion = state.stateVersion + 1;
    draft.commandSequence = state.commandSequence + 1;
    draft.commandLog = appendLog(draft.commandLog, {
      commandId: envelope.commandId,
      issuedAtMinutes: envelope.issuedAtMinutes,
      actor: envelope.actor,
      type: envelope.payload.type,
      status: "accepted",
      stateVersion: draft.stateVersion,
    });
    this.setState(draft);
    return {
      commandId: envelope.commandId,
      status: "accepted",
      stateVersion: draft.stateVersion,
    };
  }

  /**
   * Records the refusal on the live state. The log is the only thing a
   * rejection is allowed to move; the state version deliberately does not.
   */
  private reject(envelope: CommandEnvelope, reason: string): CommandResult {
    const state = this.getState();
    state.commandSequence += 1;
    state.commandLog = appendLog(state.commandLog, {
      commandId: envelope.commandId,
      issuedAtMinutes: envelope.issuedAtMinutes,
      actor: envelope.actor,
      type: envelope.payload.type,
      status: "rejected",
      reason,
      stateVersion: state.stateVersion,
    });
    return {
      commandId: envelope.commandId,
      status: "rejected",
      reason,
      stateVersion: state.stateVersion,
    };
  }
}

function appendLog(
  log: readonly CommandLogEntry[],
  entry: CommandLogEntry,
): CommandLogEntry[] {
  const next = [...log, entry];
  return next.length > COMMAND_LOG_LIMIT
    ? next.slice(next.length - COMMAND_LOG_LIMIT)
    : next;
}
