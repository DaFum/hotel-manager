import { describe, expect, it } from "vitest";
import type { SaveEnvelope } from "../saveVersions";
import { migrateV11ToV12 } from "./v11-to-v12";
import { createInitialGameState } from "../../simulation/initialState";
import { validateEnvelope } from "../saveSchema";
import { CONTENT_VERSION, SAVE_VERSION } from "../saveVersions";
import { PROTOCOL_VERSION } from "../../domain/protocol";

describe("v11 to v12 alert migration", () => {
  it("backfills authoritative notification metadata on an old alert", () => {
    const old = {
      saveVersion: 11,
      contentVersion: "1991.1",
      protocolVersion: 5,
      rngState: {},
      state: {
        hotel: { id: "hotel.1" },
        company: {
          companyId: "company.1",
          portfolio: { hotelRegion: { "hotel.1": "region.1" } },
          hotelResults: {},
        },
        calendar: { dateKey: "1991-01-01", minuteOfDay: 60 },
        alerts: [
          {
            id: "alert.space.1",
            severity: "info",
            title: "alert.space.title",
            cause: "alert.space.cause",
          },
        ],
      },
    } as unknown as SaveEnvelope;
    const migrated = migrateV11ToV12(old);
    expect(migrated.saveVersion).toBe(12);
    const state = migrated.state as any;
    expect(state.alerts[0]).toMatchObject({
      category: state.alerts[0].id.split(".")[1],
      groupId: `${state.hotel.id}:${state.alerts[0].id.split(".")[1]}`,
      source: {
        companyId: state.company.companyId,
        hotelId: state.hotel.id,
        regionId: state.company.portfolio.hotelRegion[state.hotel.id],
      },
      gameTime: `${state.calendar.dateKey}:${state.calendar.minuteOfDay}`,
      acknowledged: false,
    });
  });

  it("rejects malformed state and alert containers instead of throwing properties", () => {
    const base = {
      saveVersion: 11,
      contentVersion: "1991.1",
      protocolVersion: 5,
      rngState: {},
    } as unknown as SaveEnvelope;
    expect(() => migrateV11ToV12({ ...base, state: null })).toThrow(
      /state must be an object/,
    );
    expect(() => migrateV11ToV12({ ...base, state: {} })).toThrow(
      /alerts must be an array/,
    );
  });

  it("rejects an array in place of the hotel result record", () => {
    const state = createInitialGameState(3) as any;
    state.company.hotelResults = [];
    expect(
      validateEnvelope({
        saveVersion: SAVE_VERSION,
        contentVersion: CONTENT_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        rngState: {
          guests: 1,
          staffing: 1,
          failures: 1,
          economy: 1,
          events: 1,
          weather: 1,
          AI: 1,
          narrative: 1,
        },
        state,
      }),
    ).toContain("the state has incomplete hotel operating results");
  });
});
