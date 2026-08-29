import type { SaveEnvelope } from "./saveVersions";
import { migrateV17ToV18 } from "./migrations/v17-to-v18";

export function migrateToCurrent(save: SaveEnvelope): SaveEnvelope {
  let current = save;
  if (current.saveVersion === 17) {
    current = migrateV17ToV18(current);
  }
  return current;
}
