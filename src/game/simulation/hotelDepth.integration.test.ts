import { expect, it } from "vitest";
import { runHotelDepthScenario } from "../test/hotelDepthScenario";
import { migrateV1ToV2 } from "../persistence/migrations/v1-to-v2";
import {
  SAVE_VERSION,
  isCompatible,
  type SaveEnvelope,
} from "../persistence/saveSchema";
import saveV1Fixture from "../persistence/fixtures/save-v1.json";
import { createInitialGameState } from "./initialState";
import { GameSimulation } from "./GameSimulation";

it("propagates conference load into fnb housekeeping and elevators", () => {
  const r = runHotelDepthScenario(180);
  expect(r.conferences).toBeGreaterThan(0);
  expect(r.breakfastDemand).toBeGreaterThan(0);
  expect(r.housekeepingMinutes).toBeGreaterThan(0);
  expect(r.elevatorTrips).toBeGreaterThan(0);
});

it("keeps every facility on the board with a named binding constraint", () => {
  const r = runHotelDepthScenario(180);
  expect(r.facilities.length).toBeGreaterThan(0);
  for (const f of r.facilities) {
    expect(f.cause.length).toBeGreaterThan(0);
    expect(Number.isSafeInteger(f.capacity)).toBe(true);
  }
  // Linen circulates rather than leaking out of the hotel.
  expect(r.linen.clean + r.linen.dirty).toBeGreaterThan(0);
});

it("stays deterministic across the deep systems", () => {
  const a = runHotelDepthScenario(120);
  const b = runHotelDepthScenario(120);
  expect(b).toEqual(a);
  expect(runHotelDepthScenario(120, 99)).not.toEqual(a);
});

it("restores a migrated v1 save into a runnable simulation", () => {
  // A frozen envelope, not one derived from today's state factory: a new
  // GameState field must not quietly appear in the "v1" fixture and hide the
  // migration gap it creates.
  const legacy = structuredClone(saveV1Fixture) as unknown as SaveEnvelope;
  expect(legacy.saveVersion).toBe(1);
  const legacyState = legacy.state as Record<string, unknown>;
  for (const v2Only of [
    "facilities",
    "linen",
    "events",
    "wellness",
    "elevatorTrips",
    "eventHousekeepingMinutes",
    "specializationId",
    "investedArea",
    "classification",
  ])
    expect(legacyState[v2Only]).toBeUndefined();

  const migrated = migrateV1ToV2(legacy);
  expect(migrated.saveVersion).toBe(SAVE_VERSION);
  expect(isCompatible(migrated)).toBe(true);

  const sim = new GameSimulation(
    migrated.state as ReturnType<typeof createInitialGameState>,
  );
  sim.advanceQuantum();
  const s = sim.snapshot();
  expect(s.hotel.rooms.every((r) => typeof r.moduleId === "string")).toBe(true);
  expect(s.linen.clean).toBeGreaterThan(0);
  expect(s.assets.every((a) => Number.isSafeInteger(a.rated))).toBe(true);
  expect(s.investedArea.conferenceSqm).toBeGreaterThan(0);
});

it("keeps a save loadable when it names a category content no longer has", () => {
  const legacy = structuredClone(saveV1Fixture) as unknown as SaveEnvelope;
  const rooms = (
    legacy.state as { hotel: { rooms: Record<string, unknown>[] } }
  ).hotel.rooms;
  rooms[0].category = "category.that.never.existed";
  const migrated = migrateV1ToV2(legacy);
  const migratedRooms = (
    migrated.state as { hotel: { rooms: Record<string, unknown>[] } }
  ).hotel.rooms;
  // One unknown room must not cost the player the whole slot.
  expect(typeof migratedRooms[0].moduleId).toBe("string");
  expect(isCompatible(migrated)).toBe(true);
});

it("defaults plant nameplates a stored asset left undefined", () => {
  const legacy = structuredClone(saveV1Fixture) as unknown as SaveEnvelope;
  const assets = (legacy.state as { assets: Record<string, unknown>[] }).assets;
  assets[0].rated = undefined;
  assets[0].replacementMinor = undefined;
  const migrated = migrateV1ToV2(legacy);
  const migratedAssets = (
    migrated.state as { assets: Record<string, unknown>[] }
  ).assets;
  expect(Number.isSafeInteger(migratedAssets[0].rated as number)).toBe(true);
  expect(
    Number.isSafeInteger(migratedAssets[0].replacementMinor as number),
  ).toBe(true);
});
