import {
  normalizePlayerPreferences,
  type PlayerPreferences,
} from "../../settings/playerPreferences";
import type { SaveEnvelope } from "../saveVersions";
export function migrateV6ToV7(oldSave: SaveEnvelope): SaveEnvelope;
export function migrateV6ToV7<T extends { saveVersion: 6; state?: unknown }>(
  oldSave: T,
): Omit<T, "saveVersion"> & { saveVersion: 7; preferences: PlayerPreferences };
export function migrateV6ToV7(
  oldSave:
    | SaveEnvelope
    | ({ saveVersion: 6; state?: unknown } & Record<string, unknown>),
):
  | SaveEnvelope
  | ({ saveVersion: 7; preferences: PlayerPreferences } & Record<
      string,
      unknown
    >) {
  return {
    ...oldSave,
    saveVersion: 7,
    preferences: normalizePlayerPreferences(
      (oldSave as { preferences?: unknown }).preferences,
    ),
  };
}
