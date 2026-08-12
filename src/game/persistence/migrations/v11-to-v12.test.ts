import { describe, expect, it } from "vitest";
import type { SaveEnvelope } from "../saveVersions";
import { migrateV11ToV12 } from "./v11-to-v12";

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
});
