import { describe, expect, it } from "vitest";
import legacyV6 from "./fixtures/save-v6.json";
import { compatibility } from "./contentCompatibility";
import { migrateEnvelope, validateEnvelope } from "./saveSchema";
import type { SaveEnvelope } from "./saveVersions";
import type { GameState } from "../simulation/initialState";

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
  });

  it("migrates the recorded Plan 06 save without changing its campaign", () => {
    const legacy = structuredClone(legacyV6) as unknown as SaveEnvelope;
    expect(validateEnvelope(legacy)).toContain("save version 6 is not 7");
    const before = legacy.state as GameState;
    const migrated = migrateEnvelope(legacy);
    const after = migrated.state as GameState;
    expect(migrated.contentVersion).toBe("1991.1");
    expect(validateEnvelope(migrated)).toEqual([]);
    expect(after.finance).toEqual(before.finance);
    expect(after.company.portfolio).toEqual(before.company.portfolio);
    expect(after.narrative.chronicle).toEqual(before.narrative.chronicle);
  });
});
