import { GameSimulation } from "../simulation/GameSimulation";
import {
  createInitialGameState,
  type GameState,
} from "../simulation/initialState";
import type {
  CommandEnvelope,
  CommandStatus,
} from "../commands/commandEnvelope";
import type { DomainEvent } from "../domain/events";
import { stateHash } from "./stateHash";

export interface ReplayCommand {
  envelope: CommandEnvelope;
  expectedStatus: CommandStatus;
}
export interface ReplayCorpus {
  saveVersion: number;
  contentVersion: string;
  protocolVersion: number;
  seed: number;
  initialRngState: GameState["rngState"];
  commands: ReplayCommand[];
  orderedEvents: DomainEvent[];
  monthlyCheckpoints: {
    dateKey: string;
    atMinutes: number;
    stateHash: string;
  }[];
  finalStateHash: string;
}

export interface ReplayResult {
  state: GameState;
  events: DomainEvent[];
  hash: string;
  monthlyCheckpoints: ReplayCorpus["monthlyCheckpoints"];
}

export class ReplayMismatchError extends Error {}

function firstDifference(
  expected: unknown,
  actual: unknown,
  path = "state",
): string {
  if (Object.is(expected, actual)) return "";
  if (
    !expected ||
    !actual ||
    typeof expected !== "object" ||
    typeof actual !== "object"
  )
    return `${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
  const left = expected as Record<string, unknown>;
  const right = actual as Record<string, unknown>;
  for (const key of [
    ...new Set([...Object.keys(left), ...Object.keys(right)]),
  ].sort()) {
    const diff = firstDifference(left[key], right[key], `${path}.${key}`);
    if (diff) return diff;
  }
  return `${path}: values differ`;
}

export function replayCorpus(
  corpus: ReplayCorpus,
  options: { initialState?: GameState; splitAt?: number } = {},
): ReplayResult {
  const initialState = options.initialState
    ? structuredClone(options.initialState)
    : createInitialGameState(corpus.seed);
  if (!options.initialState)
    initialState.rngState = structuredClone(corpus.initialRngState);
  let simulation = new GameSimulation(initialState);
  const events: DomainEvent[] = [];
  const monthlyCheckpoints: ReplayCorpus["monthlyCheckpoints"] = [];
  for (let index = 0; index < corpus.commands.length; index++) {
    const recorded = corpus.commands[index];
    while (simulation.state.elapsedMinutes < recorded.envelope.issuedAtMinutes)
      simulation.advanceQuantum();
    const [result] = simulation.submitCommands([recorded.envelope]);
    events.push(...simulation.takeDomainEvents());
    if (result.status !== recorded.expectedStatus)
      throw new ReplayMismatchError(
        `version ${corpus.saveVersion}; seed ${corpus.seed}; game time ${simulation.state.elapsedMinutes}; command ${recorded.envelope.commandId}; expected ${recorded.expectedStatus}, got ${result.status}; event window ${events
          .slice(-3)
          .map((e) => e.eventId)
          .join(
            ",",
          )}; rng draw index ${JSON.stringify(simulation.state.rngState)}; ${firstDifference(recorded.expectedStatus, result.status, "verdict")}`,
      );
    if (options.splitAt === index + 1)
      simulation = new GameSimulation(structuredClone(simulation.snapshot()));
    const nextIssuedAt = corpus.commands[index + 1]?.envelope.issuedAtMinutes;
    if (nextIssuedAt !== recorded.envelope.issuedAtMinutes) {
      const expected = corpus.monthlyCheckpoints.find(
        (checkpoint) =>
          checkpoint.atMinutes === simulation.state.elapsedMinutes,
      );
      if (expected)
        monthlyCheckpoints.push({
          dateKey: simulation.state.calendar.dateKey,
          atMinutes: simulation.state.elapsedMinutes,
          stateHash: stateHash(simulation.snapshot()),
        });
    }
  }
  const hash = stateHash(simulation.snapshot());
  return {
    state: simulation.snapshot(),
    events,
    hash,
    monthlyCheckpoints,
  };
}

export function assertReplay(corpus: ReplayCorpus, result: ReplayResult): void {
  if (JSON.stringify(result.events) !== JSON.stringify(corpus.orderedEvents))
    throw new ReplayMismatchError(
      `version ${corpus.saveVersion}; seed ${corpus.seed}; ordered event sequence differs`,
    );
  if (
    JSON.stringify(result.monthlyCheckpoints) !==
    JSON.stringify(corpus.monthlyCheckpoints)
  )
    throw new ReplayMismatchError(
      `version ${corpus.saveVersion}; seed ${corpus.seed}; monthly checkpoint sequence differs`,
    );
  if (result.hash !== corpus.finalStateHash)
    throw new ReplayMismatchError(
      `version ${corpus.saveVersion}; seed ${corpus.seed}; game time ${result.state.elapsedMinutes}; command ${corpus.commands.at(-1)?.envelope.commandId ?? "none"}; event window ${result.events
        .slice(-3)
        .map((e) => e.eventId)
        .join(
          ",",
        )}; rng draw index ${JSON.stringify(result.state.rngState)}; ${firstDifference(corpus.finalStateHash, result.hash, "stateHash")}`,
    );
}
