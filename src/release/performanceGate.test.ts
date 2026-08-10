import { describe, expect, it } from "vitest";
import { commandSetForRelease } from "./releaseVersion";

describe("performance release gate", () => {
  it("requires benchmark and long-run stress commands", () => {
    expect(commandSetForRelease()).toEqual(
      expect.arrayContaining(["npm run benchmark:all", "npm run stress:50y"]),
    );
  });
});
