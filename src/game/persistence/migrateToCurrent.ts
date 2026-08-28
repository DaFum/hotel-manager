import type { SaveEnvelope } from "./saveVersions";
import { migrateV16ToV17 } from "./migrations/v16-to-v17";

export function migrateToCurrent(save: SaveEnvelope): SaveEnvelope {
  let current = save;
  if (current.saveVersion === 16) {
    current = migrateV16ToV17(current);
  }
  return current;
}
