export const SAVE_VERSION = 1 as const;
export const CONTENT_VERSION = "vertical-slice-1991-v1" as const;

export type RngStreamName =
  "guests" | "staffing" | "failures" | "economy" | "events" | "weather" | "AI";

export interface SaveEnvelope {
  saveVersion: 1;
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
