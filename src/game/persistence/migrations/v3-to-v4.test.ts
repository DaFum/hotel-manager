import { describe, expect, it } from "vitest";
import v2 from "../fixtures/save-v2.json";
import { migrateV2ToV3 } from "./v2-to-v3";
import { migrateV3ToV4 } from "./v3-to-v4";
import { validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";

describe("v3 to v4 migration", () => {
  it("migrates a v3 fixture to v4 with explicit honest defaults", () => {
    const v3 = migrateV2ToV3(structuredClone(v2) as unknown as SaveEnvelope);
    const legacyState = v3.state as Record<string, unknown>;
    delete legacyState.commandLog;
    delete legacyState.eventJournal;
    delete legacyState.utilities;
    delete legacyState.renderDescriptors;
    const migrated = migrateV3ToV4(v3);
    const state = migrated.state as Record<string, unknown>;
    expect(migrated).toMatchObject({
      saveVersion: 4,
      contentVersion: "plans-01-03-v4",
      protocolVersion: 2,
    });
    expect(state).toMatchObject({
      stateVersion: 0,
      commandSequence: 0,
      commandLog: [],
      guestSatisfaction: { score: 70, causes: [] },
      savePolicy: { lastManualSlot: null, recoveryGeneration: 0 },
    });
    expect(state.eventJournal).toBeTruthy();
    expect(state.utilities).toBeTruthy();
    expect(state.renderDescriptors).toBeTruthy();
    expect(validateEnvelope(migrated)).toEqual([]);
  });
});
