import { expect, it } from "vitest";
import { migrateToCurrent } from "./migrateToCurrent";
import { PROTOCOL_VERSION } from "../domain/protocol";
import { CONTENT_VERSION } from "./saveVersions";

it("migrates a minimal v11 save envelope all the way to the current version", () => {
  const v11Fixture = {
    saveVersion: 11,
    contentVersion: CONTENT_VERSION,
    protocolVersion: 1, // Will become 6 in V12 migration
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
    state: {
      alerts: [],
      hotel: { id: "h1" },
      company: {
        companyId: "c1",
        portfolio: { hotelRegion: { h1: "r1" }, hotelIds: ["h1"] },
      },
      calendar: { dateKey: "1991-01-01", minuteOfDay: 0 },
      metrics: {},
      finance: { cashMinor: 1000 },
      world: {
        technologies: [],
        trends: [],
        activeShocks: [],
      },
      technologyProjects: [],
      technologyImplementations: [],
    },
  };

  const migrated = migrateToCurrent(v11Fixture as any);

  expect(migrated.saveVersion).toBe(15);
  expect(migrated.protocolVersion).toBe(PROTOCOL_VERSION);

  const mState = migrated.state as any;
  expect(mState.distribution).toEqual({
    allotments: [],
    groupBlocks: [],
    channelInventory: [],
  });

  expect(mState.company.groupTargets).toEqual({
    gopparMinor: 0,
    guestSatisfaction: 0,
    staffTurnoverBasisPoints: 0,
    marketShareBasisPoints: 0,
    brandStandard: 0,
  });
  expect(mState.company.investorStakeBasisPoints).toBe(0);
});
