import { describe, expect, it } from "vitest";
import { compatibility, migrateContentVersion } from "./contentCompatibility";

describe("content compatibility", () => {
  it("distinguishes structural migration from preserved running balance", () => {
    expect(
      compatibility({
        saveSchemaVersion: 2,
        currentSchemaVersion: 3,
        saveContentVersion: "1",
        currentContentVersion: "2",
        migrationAvailable: true,
      }),
    ).toBe("migrate-schema");
    expect(
      compatibility({
        saveSchemaVersion: 1,
        currentSchemaVersion: 1,
        saveContentVersion: "1",
        currentContentVersion: "2",
        migrationAvailable: true,
      }),
    ).toBe("preserve-balance");
    expect(
      migrateContentVersion({
        contentVersion: "plan-06-v6",
        state: { cashMinor: 7 },
      }),
    ).toEqual({ contentVersion: "1991.1", state: { cashMinor: 7 } });
  });
});
