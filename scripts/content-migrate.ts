import { readFileSync, writeFileSync } from "node:fs";
import { migrateContentVersion } from "../src/game/persistence/contentCompatibility";

const [source, target] = process.argv.slice(2);
if (!source || !target)
  throw new Error("usage: content-migrate <source.json> <target.json>");
const migrated = migrateContentVersion(
  JSON.parse(readFileSync(source, "utf8")),
);
writeFileSync(target, `${JSON.stringify(migrated, null, 2)}\n`);
