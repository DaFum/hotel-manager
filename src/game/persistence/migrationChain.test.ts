import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { migrateToCurrent, SAVE_MIGRATIONS } from "./migrateToCurrent";
import { validateEnvelope } from "./saveSchema";
import { SAVE_VERSION } from "./saveVersions";

describe("save migration chain", () => {
  it("has one advancing step for every historical version", () => {
    expect(Object.keys(SAVE_MIGRATIONS).map(Number)).toEqual(
      Array.from({ length: SAVE_VERSION - 1 }, (_, index) => index + 1),
    );
    for (let version = 1; version <= SAVE_VERSION; version++) {
      const fixture = JSON.parse(
        readFileSync(
          `fixtures/saves/${version === SAVE_VERSION ? "current" : `v${version}`}.json`,
          "utf8",
        ),
      );
      const next = migrateToCurrent(fixture);
      expect(next.saveVersion).toBe(SAVE_VERSION);
      expect(JSON.stringify(next)).toContain("hotel.frankfurt.1");
      expect(validateEnvelope(next)).toEqual([]);
    }
  });

  it("is idempotent at current and refuses malformed or future saves", () => {
    const current = JSON.parse(
      readFileSync("fixtures/saves/current.json", "utf8"),
    );
    expect(migrateToCurrent(current)).toEqual(current);
    expect(() => migrateToCurrent(null)).toThrow(/envelope/);
    expect(() => migrateToCurrent({ saveVersion: SAVE_VERSION + 1 })).toThrow(
      /newer/,
    );
  });
});
