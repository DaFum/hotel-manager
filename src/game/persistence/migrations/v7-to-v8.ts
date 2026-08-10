import type { SaveEnvelope } from "../saveVersions";

/** Protocol 4 extends PERF_SAMPLE only; authoritative state is unchanged. */
export function migrateV7ToV8(oldSave: SaveEnvelope): SaveEnvelope;
export function migrateV7ToV8<T extends { saveVersion: 7 }>(
  oldSave: T,
): Omit<T, "saveVersion" | "protocolVersion"> & {
  saveVersion: 8;
  protocolVersion: 4;
};
export function migrateV7ToV8(
  oldSave: SaveEnvelope | ({ saveVersion: 7 } & Record<string, unknown>),
):
  | SaveEnvelope
  | ({ saveVersion: 8; protocolVersion: 4 } & Record<string, unknown>) {
  return { ...oldSave, saveVersion: 8, protocolVersion: 4 };
}
