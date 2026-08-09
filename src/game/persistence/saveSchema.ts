import { PROTOCOL_VERSION } from "../domain/protocol";
import type { GameState } from "../simulation/initialState";
import { migrateV1ToV2 } from "./migrations/v1-to-v2";
import { migrateV2ToV3 } from "./migrations/v2-to-v3";
import {
  CONTENT_VERSION,
  MIGRATABLE_SAVE_VERSIONS,
  RNG_STREAM_NAMES,
  SAVE_VERSION,
  type RngStreamName,
  type SaveEnvelope,
} from "./saveVersions";

export {
  CONTENT_VERSION,
  MIGRATABLE_SAVE_VERSIONS,
  RNG_STREAM_NAMES,
  SAVE_VERSION,
  type RngStreamName,
  type SaveEnvelope,
} from "./saveVersions";

/** Every stream must be present and whole, or a replay silently diverges. */
export function isCompleteRngState(
  value: unknown,
): value is Record<RngStreamName, number> {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return RNG_STREAM_NAMES.every((name) => Number.isSafeInteger(state[name]));
}

/**
 * Everything wrong with a stored envelope, named. A boolean is enough to
 * refuse a save but not enough to tell the player why, and "why" is the
 * difference between a recoverable mistake and a lost hotel.
 */
export function validateEnvelope(envelope: SaveEnvelope): string[] {
  const problems: string[] = [];
  if (!envelope || typeof envelope !== "object") return ["not a save envelope"];
  if (envelope.saveVersion !== SAVE_VERSION)
    problems.push(
      `save version ${envelope.saveVersion} is not ${SAVE_VERSION}`,
    );
  if (envelope.contentVersion !== CONTENT_VERSION)
    problems.push(`content version ${envelope.contentVersion} is foreign`);
  if (envelope.protocolVersion !== PROTOCOL_VERSION)
    problems.push(
      `protocol version ${envelope.protocolVersion} is not ${PROTOCOL_VERSION}`,
    );
  if (!isCompleteRngState(envelope.rngState))
    problems.push("one or more rng streams are missing or not whole numbers");
  if (!envelope.state || typeof envelope.state !== "object")
    return [...problems, "the envelope carries no state"];

  const state = envelope.state as Partial<GameState>;
  // The state carries the streams the simulation is actually restored from.
  // Checking only the header would let through a save whose state has none,
  // and restoring that would throw outside the validation path.
  if (!isCompleteRngState(state.rngState))
    problems.push("the state is missing one or more rng streams");
  else if (isCompleteRngState(envelope.rngState))
    // Header and state are the same streams; a save where they disagree would
    // replay differently depending on which one was believed.
    for (const name of RNG_STREAM_NAMES)
      if (state.rngState[name] !== envelope.rngState[name])
        problems.push(`rng stream ${name} disagrees with the envelope header`);

  if (!state.calendar || typeof state.calendar.dateKey !== "string")
    problems.push("the state has no calendar");
  if (!state.hotel || !Array.isArray(state.hotel.rooms))
    problems.push("the state has no hotel");
  if (!state.finance || !Number.isSafeInteger(state.finance.cashMinor))
    problems.push("cash is not whole Pfennig");
  if (state.finance && !Array.isArray(state.finance.ledger))
    problems.push("the state has no ledger");

  // Every stay must point at a room that exists, or the hotel restores with
  // guests in rooms it does not have.
  const roomIds = new Set((state.hotel?.rooms ?? []).map((r) => r.id));
  for (const stay of state.stays ?? [])
    if (!roomIds.has(stay.roomId))
      problems.push(
        `stay ${stay.bookingId} refers to missing room ${stay.roomId}`,
      );

  return problems;
}

/** A save is replayable only when all three versions match this build. */
export function isCompatible(envelope: SaveEnvelope): boolean {
  return validateEnvelope(envelope).length === 0;
}

export function assertCompatible(envelope: SaveEnvelope): void {
  const problems = validateEnvelope(envelope);
  if (problems.length > 0)
    throw new Error(`incompatible save: ${problems.join("; ")}`);
}

/**
 * Brings a stored envelope forward to this build. Migration is explicit and
 * ordered: a save is never silently reinterpreted, it is rewritten.
 */
export function migrateEnvelope(envelope: SaveEnvelope): SaveEnvelope {
  if (!envelope) return envelope;
  // One step per declared version, so adding a version to the list without a
  // step is a visible gap rather than a silent no-op.
  const steps: Record<number, (e: SaveEnvelope) => SaveEnvelope> = {
    1: migrateV1ToV2,
    2: migrateV2ToV3,
  };
  let current = envelope;
  while (
    (MIGRATABLE_SAVE_VERSIONS as readonly number[]).includes(
      current.saveVersion,
    )
  ) {
    const step = steps[current.saveVersion];
    if (!step) break;
    current = step(current);
  }
  return current;
}
