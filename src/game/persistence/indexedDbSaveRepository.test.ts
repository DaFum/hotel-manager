import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbSaveRepository } from "./indexedDbSaveRepository";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  isCompatible,
  type SaveEnvelope,
} from "./saveSchema";
import { PROTOCOL_VERSION } from "../domain/protocol";
import { createInitialGameState } from "../simulation/initialState";
import { DEFAULT_PLAYER_PREFERENCES } from "../settings/playerPreferences";

// A real state: validation now checks references and numeric invariants, so a
// stub with one field in it is no longer a save the repository will store.
const state = createInitialGameState(4);

const save: SaveEnvelope = {
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  rngState: state.rngState,
  state,
  preferences: DEFAULT_PLAYER_PREFERENCES,
};

describe("save repository", () => {
  it("round trips protocol save content and rng versions exactly", async () => {
    const repo = new IndexedDbSaveRepository("test-hotel-manager");
    await repo.save("slot-1", save);
    expect(await repo.load("slot-1")).toEqual(save);
  });

  it("returns null for an empty slot", async () => {
    const repo = new IndexedDbSaveRepository("test-hotel-manager-empty");
    expect(await repo.load("slot-9")).toBeNull();
  });

  it("keeps recovery slots independent and listable", async () => {
    const repo = new IndexedDbSaveRepository("test-hotel-manager-slots");
    await repo.save("slot-1", save);
    await repo.save("autosave", {
      ...save,
      state: { ...state, elapsedMinutes: 45 },
    });
    expect((await repo.listSlots()).sort()).toEqual(["autosave", "slot-1"]);
    expect(
      ((await repo.load("slot-1"))?.state as typeof state).elapsedMinutes,
    ).toBe(0);
  });

  it("refuses a save whose RNG state is incomplete", async () => {
    const repo = new IndexedDbSaveRepository("test-hotel-manager-rng");
    const { staffing: _dropped, ...partial } = save.rngState;
    expect(
      isCompatible({
        ...save,
        rngState: partial,
      } as unknown as SaveEnvelope),
    ).toBe(false);
    await expect(
      repo.save("slot-1", {
        ...save,
        rngState: partial,
      } as unknown as SaveEnvelope),
    ).rejects.toThrow(/rng stream/i);
  });

  it("refuses to load a save from an incompatible version", async () => {
    const repo = new IndexedDbSaveRepository("test-hotel-manager-version");
    await repo.save("slot-1", save);
    expect(
      isCompatible({ ...save, saveVersion: 99 } as unknown as SaveEnvelope),
    ).toBe(false);
    await expect(
      repo.save("slot-2", { ...save, contentVersion: "other" }),
    ).rejects.toThrow(/version/);
  });
});
