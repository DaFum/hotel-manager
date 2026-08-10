import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  ContentPackSchema,
  type ContentPack,
} from "../src/content-schema/contentPack";
import { migrateContentVersion } from "../src/game/persistence/contentCompatibility";

export function migrateContentPack(value: unknown): ContentPack {
  const source = ContentPackSchema.parse(value);
  return ContentPackSchema.parse(migrateContentVersion(source));
}

function main(): void {
  const [source, target] = process.argv.slice(2);
  if (!source || !target)
    throw new Error("usage: content-migrate <source.json> <target.json>");
  const migrated = migrateContentPack(JSON.parse(readFileSync(source, "utf8")));
  writeFileSync(target, `${JSON.stringify(migrated, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
