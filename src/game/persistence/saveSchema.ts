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

/** A save is replayable only when all three versions match this build. */
export function isCompatible(envelope: SaveEnvelope): boolean {
  return (
    Boolean(envelope) &&
    envelope.saveVersion === SAVE_VERSION &&
    envelope.contentVersion === CONTENT_VERSION &&
    envelope.protocolVersion === 1 &&
    isCompleteRngState(envelope.rngState) &&
    envelope.state !== null &&
    typeof envelope.state === "object"
  );
}

export function assertCompatible(envelope: SaveEnvelope): void {
  if (!isCompatible(envelope)) throw new Error("incompatible save version");
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
