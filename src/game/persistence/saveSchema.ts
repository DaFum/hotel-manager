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

/** A save is replayable only when all three versions match this build. */
export function isCompatible(envelope: SaveEnvelope): boolean {
  return (
    envelope.saveVersion === SAVE_VERSION &&
    envelope.contentVersion === CONTENT_VERSION &&
    envelope.protocolVersion === 1
  );
}

export function assertCompatible(envelope: SaveEnvelope): void {
  if (!isCompatible(envelope)) throw new Error("incompatible save version");
}
