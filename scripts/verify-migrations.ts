import { readFileSync } from "node:fs";
import { migrateToCurrent } from "../src/game/persistence/migrateToCurrent";
import {
  migrateEnvelope,
  validateEnvelope,
} from "../src/game/persistence/saveSchema";
import { SAVE_VERSION } from "../src/game/persistence/saveVersions";

for (let version = 1; version <= SAVE_VERSION; version++) {
  const name = version === SAVE_VERSION ? "current" : `v${version}`;
  const source = JSON.parse(
    readFileSync(`fixtures/saves/${name}.json`, "utf8"),
  );
  const stableHotelId = source.state?.hotel?.id;
  const migrated = migrateToCurrent(source);
  const loaded = migrateEnvelope(migrated);
  const problems = validateEnvelope(loaded);
  if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`);
  if (
    stableHotelId &&
    (loaded.state as { hotel: { id: string } }).hotel.id !== stableHotelId
  )
    throw new Error(`${name}: stable hotel id changed`);
  if (loaded.saveVersion !== SAVE_VERSION)
    throw new Error(`${name}: migration incomplete`);
}
const current = JSON.parse(readFileSync("fixtures/saves/current.json", "utf8"));
if (JSON.stringify(migrateToCurrent(current)) !== JSON.stringify(current))
  throw new Error("current save load is not idempotent");
for (const invalid of [null, {}, { saveVersion: SAVE_VERSION + 1 }]) {
  let accepted = false;
  try {
    migrateToCurrent(invalid);
    accepted = true;
  } catch (error) {
    // A rejection is the expected outcome, but only a real refusal counts: an
    // unexpected failure inside a migration must surface, not pass as success.
    if (!(error instanceof Error))
      throw new Error(
        `${JSON.stringify(invalid)}: rejected with a non-error ${String(error)}`,
      );
  }
  if (accepted)
    throw new Error(`invalid save accepted: ${JSON.stringify(invalid)}`);
}
console.log(`migration verification PASS (v1-v${SAVE_VERSION})`);
