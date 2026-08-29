import type { SaveEnvelope } from "./saveVersions";
import { migrateV12ToV13 } from "./migrations/v12-to-v13";

export function migrateToCurrent(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion === 12) {
    save = migrateV12ToV13(save);
  }
  return save;
}
