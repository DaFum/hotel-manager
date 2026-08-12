import { expect, it } from "vitest";
import { migrateV12ToV13 } from "./v12-to-v13";
import { createInitialGameState } from "../../simulation/initialState";
import { PROTOCOL_VERSION } from "../../domain/protocol";
import { CONTENT_VERSION } from "../saveVersions";
import { validateEnvelope } from "../saveSchema";
import { DEFAULT_PLAYER_PREFERENCES } from "../../settings/playerPreferences";

it("migrates version 12 distribution and commercial defaults to version 13", () => {
  const state: any = createInitialGameState(7);
  delete state.distribution;
  delete state.company.groupTargets;
  const migrated = migrateV12ToV13({
    saveVersion: 12,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    rngState: state.rngState,
    state,
    preferences: DEFAULT_PLAYER_PREFERENCES,
  });
  expect(migrated.saveVersion).toBe(13);
  expect((migrated.state as any).distribution).toEqual({
    allotments: [],
    groupBlocks: [],
    channelInventory: [],
  });
  expect(validateEnvelope(migrated)).toEqual([]);
});
