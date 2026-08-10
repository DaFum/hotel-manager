import { describe, expect, it } from "vitest";
import { commandSetForRelease } from "./releaseVersion";

describe("unified release check", () => {
  it("runs every mandatory technical gate exactly once, in order", () => {
    const commands = commandSetForRelease();
    // The exact list, not a subset: an extra gate, a missing one and a
    // reordering are all release-contract changes rather than detail.
    expect(commands).toEqual([
      "npm run content:validate",
      "npm run verify:migrations",
      "npm run verify:replays",
      "npm run test:run",
      "npm run typecheck",
      "npm run lint",
      "npm run build",
      "npm run test:e2e",
      "npm run test:release:a11y",
      "npm run benchmark:all",
      "npm run stress:50y",
      "npm run invariant:sweep",
    ]);
    expect(commands).not.toContain("npm run release:check");
  });
});
