import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbSaveRepository } from "./indexedDbSaveRepository";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  isCompatible,
  type SaveEnvelope,
} from "./saveSchema";

const save: SaveEnvelope = {
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: 1,
  rngState: {
    guests: 1,
    staffing: 2,
    failures: 3,
    economy: 4,
    events: 5,
    weather: 6,
    AI: 7,
  },
  state: { cashMinor: 5 },
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
    await repo.save("autosave", { ...save, state: { cashMinor: 9 } });
    expect((await repo.listSlots()).sort()).toEqual(["autosave", "slot-1"]);
    expect((await repo.load("slot-1"))?.state).toEqual({ cashMinor: 5 });
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
