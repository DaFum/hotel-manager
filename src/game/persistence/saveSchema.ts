import { migrateV1ToV2 } from "./migrations/v1-to-v2";
export const SAVE_VERSION = 2 as const;
export const CONTENT_VERSION = "hotel-depth-1991-v2" as const;
/** Save versions this build knows how to bring forward. */
export const MIGRATABLE_SAVE_VERSIONS = [1] as const;

export type RngStreamName =
  "guests" | "staffing" | "failures" | "economy" | "events" | "weather" | "AI";

export interface SaveEnvelope {
  saveVersion: number;
  contentVersion: string;
  protocolVersion: 1;
  rngState: Record<RngStreamName, number>;
  state: unknown;
}

export const RNG_STREAM_NAMES: readonly RngStreamName[] = [
  "guests",
  "staffing",
  "failures",
  "economy",
  "events",
  "weather",
  "AI",
];

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
  return envelope?.saveVersion === 1 ? migrateV1ToV2(envelope) : envelope;
}
