import type { SaveEnvelope } from "./saveVersions";
import { migrateV11ToV12 } from "./migrations/v11-to-v12";

export function migrateToCurrent(save: SaveEnvelope): SaveEnvelope {
  return save.saveVersion === 11 ? migrateV11ToV12(save) : save;
}
