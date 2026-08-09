import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  RECOVERY_GENERATIONS,
  isRecovered,
  loadWithRecovery,
  rotateRecovery,
  type SaveStore,
} from "./recovery";
import { manualSlot, recoverySlot } from "./savePolicy";
import { IndexedDbSaveRepository } from "./indexedDbSaveRepository";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "./saveVersions";
import { PROTOCOL_VERSION } from "../domain/protocol";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";

function envelopeAt(elapsedMinutes: number): SaveEnvelope {
  const state = createInitialGameState(21);
  state.elapsedMinutes = elapsedMinutes;
  return {
    saveVersion: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    rngState: state.rngState,
    state,
  };
}

const elapsedOf = (envelope: SaveEnvelope) =>
  (envelope.state as { elapsedMinutes: number }).elapsedMinutes;

/** An in-memory store, so the rotation itself is what is under test. */
function memoryStore(): SaveStore & { data: Map<string, SaveEnvelope> } {
  const data = new Map<string, SaveEnvelope>();
  return {
    data,
    async save(slot, envelope) {
      data.set(slot, structuredClone(envelope));
    },
    async load(slot) {
      return data.get(slot) ?? null;
    },
    async listSlots() {
      return [...data.keys()];
    },
    async deleteSlot(slot) {
      data.delete(slot);
    },
  };
}

describe("save recovery", () => {
  it("rotates at least two recovery generations oldest first", async () => {
    expect(RECOVERY_GENERATIONS).toBeGreaterThanOrEqual(2);
    const store = memoryStore();

    for (const minutes of [5, 10, 15, 20])
      await rotateRecovery(store, envelopeAt(minutes));

    // The newest is always generation zero and each generation behind it is
    // one save older; the one that fell off the end is gone.
    expect(elapsedOf(store.data.get(recoverySlot(0))!)).toBe(20);
    expect(elapsedOf(store.data.get(recoverySlot(1))!)).toBe(15);
    expect(elapsedOf(store.data.get(recoverySlot(2))!)).toBe(10);
    expect(store.data.has(recoverySlot(RECOVERY_GENERATIONS))).toBe(false);
  });

  it("keeps the generations distinct when rotations overlap", async () => {
    const store = memoryStore();
    // The store awaits nothing between its own reads and writes, and the real
    // caller does not queue: a calendar autosave can start while a pre-action
    // save is still rotating.
    await Promise.all(
      [5, 10, 15, 20].map((m) => rotateRecovery(store, envelopeAt(m))),
    );

    const held = Array.from({ length: RECOVERY_GENERATIONS }, (_, g) =>
      elapsedOf(store.data.get(recoverySlot(g))!),
    );
    expect(new Set(held).size).toBe(RECOVERY_GENERATIONS);
    // Newest first, whatever order the rotations were started in.
    expect([...held].sort((a, b) => b - a)).toEqual(held);
    expect(held[0]).toBe(20);
  });

  it("falls back to the newest intact generation when the primary is corrupt", async () => {
    const store = memoryStore();
    const slot = manualSlot("before the refit");
    await rotateRecovery(store, envelopeAt(100));
    await rotateRecovery(store, envelopeAt(200));
    // The player's own slot has been damaged: its rng header no longer agrees
    // with the state it carries, which would replay as a different hotel.
    const damaged = envelopeAt(300);
    await store.save(slot, {
      ...damaged,
      rngState: { ...damaged.rngState, guests: damaged.rngState.guests + 1 },
    });

    const outcome = await loadWithRecovery(store, slot);

    expect(isRecovered(outcome)).toBe(true);
    if (!isRecovered(outcome)) return;
    expect(outcome.slot).toBe(recoverySlot(0));
    expect(elapsedOf(outcome.envelope)).toBe(200);
    // The player is told what was refused and why, rather than silently
    // getting an older hotel than the one they asked for.
    expect(outcome.rejected[0]?.slot).toBe(slot);
    expect(outcome.rejected[0]?.reason).toMatch(/rng stream/i);
  });

  it("refuses a save whose state has lost its rng streams", async () => {
    const store = memoryStore();
    const slot = manualSlot("half a save");
    const broken = envelopeAt(800);
    // The header still looks right; the state the simulation would actually be
    // restored from does not carry the streams at all.
    const state = { ...(broken.state as Record<string, unknown>) };
    delete state.rngState;
    await store.save(slot, { ...broken, state });

    const outcome = await loadWithRecovery(store, slot);

    // Refused in validation, rather than throwing inside the worker while the
    // running game is being replaced.
    if (isRecovered(outcome)) throw new Error("a stateless save was accepted");
    expect(outcome.rejected[0].reason).toMatch(/missing one or more rng/i);
  });

  it("leaves the stored slot intact when a write fails", async () => {
    const repo = new IndexedDbSaveRepository("test-recovery-atomic");
    const slot = manualSlot("keep me");
    await repo.save(slot, envelopeAt(500));

    const broken = envelopeAt(600);
    await expect(
      repo.save(slot, { ...broken, saveVersion: 99 }),
    ).rejects.toThrow(/incompatible save/);

    // A refused write is not a half-written one: what was there is still there.
    expect(elapsedOf((await repo.load(slot))!)).toBe(500);
  });

  it("never overwrites a running game from an invalid load", async () => {
    const store = memoryStore();
    const slot = manualSlot("nothing here");
    await store.save(slot, {
      ...envelopeAt(700),
      contentVersion: "some-other-game",
    });

    const running = new GameSimulation(createInitialGameState(21));
    running.refreshDerivedState();
    const before = JSON.stringify(running.state);

    const outcome = await loadWithRecovery(store, slot);
    if (isRecovered(outcome)) throw new Error("the invalid save was accepted");

    // Nothing was applied, so the hotel the player is playing is untouched.
    expect(JSON.stringify(running.state)).toBe(before);
    expect(outcome.rejected.map((r) => r.slot)).toContain(slot);
    expect(outcome.rejected[0].reason).toMatch(/content version/);
  });
});
