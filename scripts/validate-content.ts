import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadContentPack } from "../src/game/content/loadContentPack";

const directory = new URL("../src/content/core/", import.meta.url);
const files = readdirSync(directory)
  .filter((file) => file.endsWith(".json"))
  .sort();
let failed = false;
for (const file of files) {
  try {
    const loaded = loadContentPack(
      JSON.parse(readFileSync(new URL(file, directory), "utf8")),
    );
    console.log(
      `content-ok ${loaded.pack.packId}@${loaded.pack.contentVersion}`,
    );
  } catch (error) {
    console.error(
      `${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
    failed = true;
  }
}
if (files.length === 0)
  throw new Error(
    `no content packs found in ${join("src", "content", "core")}`,
  );
if (failed) process.exitCode = 1;
