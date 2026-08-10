import { spawnSync } from "node:child_process";
import { commandSetForRelease } from "../src/release/releaseVersion";

for (const command of commandSetForRelease()) {
  console.log(`\n=== ${command} ===`);
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("release-check PASS");
