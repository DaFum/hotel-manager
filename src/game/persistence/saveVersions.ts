/** Save metadata shared by the writer and the current-format validator. */
export const SAVE_VERSION = 17 as const;
export const MIGRATABLE_SAVE_VERSIONS = [] as const;
export const CONTENT_VERSION = "1991.1" as const;

export type RngStreamName =
  | "guests"
  | "staffing"
  | "failures"
  | "economy"
  | "events"
  | "weather"
  | "AI"
  | "narrative";

export interface SaveEnvelope {
  saveVersion: number;
  contentVersion: string;
  /** The protocol spoken by the build that wrote the save. */
  protocolVersion: number;
  rngState: Record<RngStreamName, number>;
  state: unknown;
  /** Presentation-only settings travel with the campaign but never affect replay. */
  preferences?: import("../settings/playerPreferences").PlayerPreferences;
}

export const RNG_STREAM_NAMES: readonly RngStreamName[] = [
  "guests",
  "staffing",
  "failures",
  "economy",
  "events",
  "weather",
  "AI",
  "narrative",
];
