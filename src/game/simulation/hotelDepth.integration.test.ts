import { expect, it } from "vitest";
import { runHotelDepthScenario } from "../test/hotelDepthScenario";
import { migrateV1ToV2 } from "../persistence/migrations/v1-to-v2";
import { SAVE_VERSION, isCompatible } from "../persistence/saveSchema";
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
  const v1State = createInitialGameState(424242) as unknown as Record<
    string,
    unknown
  >;
  // A v1 save predates every deep facility field.
  const rooms = (
    v1State.hotel as { rooms: Record<string, unknown>[] }
  ).rooms.map((r) => ({
    id: r.id,
    category: r.category,
    state: r.state,
    cleanliness: r.cleanliness,
  }));
  const legacy = {
    saveVersion: 1,
    contentVersion: "vertical-slice-1991-v1",
    protocolVersion: 1,
    rngState: v1State.rngState,
    state: {
      ...v1State,
      hotel: { ...(v1State.hotel as object), rooms },
      assets: [
        { id: "asset.boiler", condition: 9000, status: "operational" },
        { id: "asset.lift", condition: 9500, status: "operational" },
      ],
      facilities: undefined,
      linen: undefined,
      events: undefined,
      wellness: undefined,
      classification: undefined,
    },
  };

  const migrated = migrateV1ToV2(legacy as never);
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
});
