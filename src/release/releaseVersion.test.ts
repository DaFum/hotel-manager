import { describe, expect, it } from "vitest";
import { assertReleaseVersion, commandSetForRelease } from "./releaseVersion";

describe("release version", () => {
  it("accepts stable semantic versions and rejects floating labels", () => {
    expect(assertReleaseVersion("1.0.0")).toBe("1.0.0");
    for (const invalid of ["latest", "v1.0.0", "01.0.0", "1.0.0-beta"])
      expect(() => assertReleaseVersion(invalid)).toThrow(/semantic version/);
  });
  it("includes the invariant gate", () => {
    expect(commandSetForRelease()).toContain("npm run invariant:sweep");
  });
});
