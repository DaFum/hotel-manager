import { migrateV1ToV2 } from "./migrations/v1-to-v2";
import { migrateV2ToV3 } from "./migrations/v2-to-v3";
import { migrateV3ToV4 } from "./migrations/v3-to-v4";
import { migrateEarlyV5Fields, migrateV4ToV5 } from "./migrations/v4-to-v5";
import { migrateV5ToV6 } from "./migrations/v5-to-v6";
import { migrateV6ToV7 } from "./migrations/v6-to-v7";
import { migrateV7ToV8 } from "./migrations/v7-to-v8";
import { migrateV8ToV9 } from "./migrations/v8-to-v9";
import { SAVE_VERSION, type SaveEnvelope } from "./saveVersions";

export const SAVE_MIGRATIONS: Readonly<
  Record<number, (save: SaveEnvelope) => SaveEnvelope>
> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: (save) => migrateV5ToV6(migrateEarlyV5Fields(save)),
  6: migrateV6ToV7,
  7: migrateV7ToV8,
  8: migrateV8ToV9,
};

export function migrateToCurrent(input: unknown): SaveEnvelope {
  if (!input || typeof input !== "object")
    throw new Error("save is not an envelope");
  let current = structuredClone(input) as SaveEnvelope;
  if (!Number.isSafeInteger(current.saveVersion) || current.saveVersion < 1)
    throw new Error("save version is invalid");
  if (current.saveVersion > SAVE_VERSION)
    throw new Error(
      `save version ${current.saveVersion} is newer than ${SAVE_VERSION}`,
    );
  while (current.saveVersion < SAVE_VERSION) {
    const source = current.saveVersion;
    const migration = SAVE_MIGRATIONS[source];
    if (!migration)
      throw new Error(`missing migration from save version ${source}`);
    current = migration(current);
    if (current.saveVersion !== source + 1)
      throw new Error(`migration from ${source} did not stamp ${source + 1}`);
  }
  return current;
}
