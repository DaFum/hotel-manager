import { describe, expect, it } from "vitest";
import { commandSetForRelease } from "./releaseVersion";

describe("unified release check", () => {
  it("includes every mandatory technical gate exactly once", () => {
    const commands = commandSetForRelease();
    expect(commands).toEqual(
      expect.arrayContaining([
        "npm run content:validate",
        "npm run verify:migrations",
        "npm run verify:replays",
        "npm run test:run",
        "npm run typecheck",
        "npm run lint",
        "npm run build",
        "npm run test:e2e",
        "npm run benchmark:all",
        "npm run stress:50y",
        "npm run invariant:sweep",
      ]),
    );
    expect(new Set(commands).size).toBe(commands.length);
    expect(commands).not.toContain("npm run release:check");
  });
});
