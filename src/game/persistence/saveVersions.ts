/**
 * Save metadata with no dependencies of its own. Both the schema and every
 * migration read it, so keeping it a leaf stops the schema and the migrations
 * from importing each other.
 */
export const SAVE_VERSION = 4 as const;
export const CONTENT_VERSION = "plan-04-v4" as const;
/** Save versions this build knows how to bring forward, oldest first. */
export const MIGRATABLE_SAVE_VERSIONS = [1, 2, 3] as const;

export type RngStreamName =
  "guests" | "staffing" | "failures" | "economy" | "events" | "weather" | "AI";

export interface SaveEnvelope {
  saveVersion: number;
  contentVersion: string;
  /**
   * The protocol the build that wrote it spoke. Stored as written, not as
   * expected: it is a migration's job to bring an old one forward, and
   * validation's job to refuse one that never was.
   */
  protocolVersion: number;
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
