import type { SaveEnvelope } from "./saveVersions";
import { migrateV11ToV12 } from "./migrations/v11-to-v12";
import { migrateV12ToV13 } from "./migrations/v12-to-v13";
import { migrateV13ToV14 } from "./migrations/v13-to-v14";
import { migrateV14ToV15 } from "./migrations/v14-to-v15";
import { migrateV15ToV16 } from "./migrations/v15-to-v16";

export function migrateToCurrent(save: SaveEnvelope): SaveEnvelope {
  const v12 = save.saveVersion === 11 ? migrateV11ToV12(save) : save;
  const v13 = v12.saveVersion === 12 ? migrateV12ToV13(v12) : v12;
  const v14 = v13.saveVersion === 13 ? migrateV13ToV14(v13) : v13;
  const v15 = v14.saveVersion === 14 ? migrateV14ToV15(v14) : v14;
  return v15.saveVersion === 15 ? migrateV15ToV16(v15) : v15;
}
