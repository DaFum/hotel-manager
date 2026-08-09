import { describe, expect, it } from "vitest";
import v2 from "../fixtures/save-v2.json";
import { migrateV2ToV3 } from "./v2-to-v3";
import { migrateV3ToV4 } from "./v3-to-v4";
import { validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";
import frozenV4 from "../fixtures/save-v4.json";

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
      contentVersion: "plan-04-v4",
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

it("normalizes active reservations and the complete Plan 04 world schema idempotently", async () => {
  const fixture = (await import("../fixtures/save-v3-active-reservations.json"))
    .default as unknown as SaveEnvelope;
  const migrated = migrateV3ToV4(fixture);
  const state = migrated.state as Record<string, any>;
  expect(state.reservations[0]).toMatchObject({
    id: "booking.legacy.active",
    rateMinor: 12500,
    channel: "directPhone",
    bookingDateKey: "1991-01-01",
    ratePlanId: "flexible",
    commissionBp: 0,
    depositMinor: 0,
    specialRequirements: [],
  });
  expect(state.world).toBeTruthy();
  expect(state.revenuePolicy).toBeTruthy();
  expect(migrateV3ToV4(migrated)).toEqual(migrated);
  expect(validateEnvelope(frozenV4 as unknown as SaveEnvelope)).toEqual([]);
});
