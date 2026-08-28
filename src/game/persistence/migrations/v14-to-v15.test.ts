import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../simulation/initialState";
import { PROTOCOL_VERSION } from "../../domain/protocol";
import type { SaveEnvelope } from "../saveVersions";
import { migrateV14ToV15 } from "./v14-to-v15";

describe("v14 to v15 migration", () => {
  it("backfills and round-trips the investor stake", () => {
    const state = createInitialGameState(91);
    delete (state.company as any).investorStakeBasisPoints;

    const old: SaveEnvelope = {
      saveVersion: 14,
      contentVersion: "1991.1",
      protocolVersion: PROTOCOL_VERSION,
      rngState: state.rngState,
      state,
    };

    const migrated = migrateV14ToV15(old);
    expect(migrated.saveVersion).toBe(15);
    expect(migrated.contentVersion).toBe(old.contentVersion);
    expect(migrated.protocolVersion).toBe(old.protocolVersion);
    expect(migrated.rngState).toEqual(old.rngState);

    expect((migrated.state as any).company.investorStakeBasisPoints).toBe(0);
    expect(JSON.parse(JSON.stringify(migrated))).toEqual(migrated);
    expect((old.state as any).company.investorStakeBasisPoints).toBeUndefined();
  });
});
