import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../simulation/initialState";
import { PROTOCOL_VERSION } from "../domain/protocol";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "./saveVersions";
import {
  MAX_SAVE_TRANSFER_BYTES,
  exportSaveFile,
  importSaveFile,
  parseSaveFile,
  validateSaveContentReferences,
} from "./saveTransfer";
import { IndexedDbSaveRepository } from "./indexedDbSaveRepository";
const state = createInitialGameState(9);
const save: SaveEnvelope = {
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  rngState: state.rngState,
  state,
};

describe("save transfer", () => {
  it("round trips the deterministic authoritative envelope", async () => {
    expect(await parseSaveFile(await exportSaveFile(save))).toEqual(save);
  });
  it("refuses tampering and oversized input", async () => {
    const bytes = await exportSaveFile(save);
    bytes[bytes.length - 2] ^= 1;
    await expect(parseSaveFile(bytes)).rejects.toThrow(/checksum|JSON/);
    await expect(
      parseSaveFile(new Uint8Array(MAX_SAVE_TRANSFER_BYTES + 1)),
    ).rejects.toThrow(/size/);
  });
  it("validates before the atomic provider write", async () => {
    const provider = { load: vi.fn(), save: vi.fn() };
    await expect(
      importSaveFile(provider, "slot-1", new TextEncoder().encode("{}")),
    ).rejects.toThrow();
    expect(provider.save).not.toHaveBeenCalled();
    await importSaveFile(provider, "slot-1", await exportSaveFile(save));
    expect(provider.save).toHaveBeenCalledWith("slot-1", save);
  });

  it("cannot overwrite an existing IndexedDB slot with an invalid file", async () => {
    const repository = new IndexedDbSaveRepository("save-transfer-atomic");
    await repository.save("manual:quick save", save);
    await expect(
      importSaveFile(
        repository,
        "manual:quick save",
        new TextEncoder().encode("{}"),
      ),
    ).rejects.toThrow();
    expect(await repository.load("manual:quick save")).toEqual(save);
  });
  it("rejects incompatible versions before export and signed missing-content requirements on import", async () => {
    await expect(exportSaveFile({ ...save, saveVersion: 999 })).rejects.toThrow(
      /invalid save/,
    );
    const bytes = await exportSaveFile(save, [
      { packId: "expansion.missing", contentVersion: "1" },
    ]);
    await expect(parseSaveFile(bytes)).rejects.toThrow(/content pack/);
  });

  it("rejects an authoritative entity reference that current content cannot resolve", async () => {
    const brokenState = structuredClone(state);
    brokenState.hotel.rooms[0].moduleId = "room.removed";
    await expect(
      exportSaveFile({ ...save, state: brokenState }),
    ).rejects.toThrow(/room.removed/);
  });

  it("rejects malformed and cross-family authoritative content references", () => {
    expect(
      validateSaveContentReferences({
        moduleId: { id: "room.standard.single" },
      }),
    ).toContain("moduleId");
    expect(
      validateSaveContentReferences({ moduleId: "brand.mainblick" }),
    ).toContain("brand.mainblick");
  });

  it("requires exactly one valid core content-pack descriptor", async () => {
    await expect(parseSaveFile(await exportSaveFile(save, []))).rejects.toThrow(
      /content pack/,
    );
    const core = { packId: "core", contentVersion: CONTENT_VERSION };
    await expect(
      parseSaveFile(await exportSaveFile(save, [core, core])),
    ).rejects.toThrow(/content pack/);
    await expect(
      parseSaveFile(
        await exportSaveFile(save, [{ ...core, packId: "expansion.not-core" }]),
      ),
    ).rejects.toThrow(/content pack/);
    await expect(
      parseSaveFile(
        await exportSaveFile(save, [
          { ...core, contentVersion: "1991.mismatched" },
        ]),
      ),
    ).rejects.toThrow(/content pack/);
  });

  it("rejects payload tampering even when the visible header is plausible", async () => {
    const bytes = await exportSaveFile(save);
    const file = JSON.parse(new TextDecoder().decode(bytes));
    file.payload.protocolVersion = 999;
    await expect(
      parseSaveFile(new TextEncoder().encode(JSON.stringify(file))),
    ).rejects.toThrow(/checksum/);
  });
});
