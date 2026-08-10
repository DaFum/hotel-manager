import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  assertReleaseVersion,
  commandSetForRelease,
} from "../src/release/releaseVersion";

// The checklist's first two steps are preconditions, not gates: a release runs
// from a clean checkout on a stable semantic version. Checking them here means
// a tag can never be cut from a working tree with unreviewed changes.
const { version } = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
assertReleaseVersion(version);

const status = spawnSync("git", ["status", "--short"], { encoding: "utf8" });
if (status.error) throw status.error;
if (status.status !== 0)
  throw new Error("release-check cannot read the checkout state");
if (status.stdout.trim().length > 0)
  throw new Error(
    `release-check needs a clean checkout; uncommitted changes:\n${status.stdout.trimEnd()}`,
  );

for (const command of commandSetForRelease()) {
  console.log(`\n=== ${command} ===`);
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`release-check PASS (${version})`);
