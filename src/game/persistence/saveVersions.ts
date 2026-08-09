/**
 * Save metadata with no dependencies of its own. Both the schema and every
 * migration read it, so keeping it a leaf stops the schema and the migrations
 * from importing each other.
 */
export const SAVE_VERSION = 2 as const;
export const CONTENT_VERSION = "hotel-depth-1991-v2" as const;
/** Save versions this build knows how to bring forward, oldest first. */
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
