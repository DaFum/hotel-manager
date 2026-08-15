import { expect, it } from "vitest";
import { migrateV12ToV13 } from "./v12-to-v13";
import { createInitialGameState } from "../../simulation/initialState";
import { PROTOCOL_VERSION } from "../../domain/protocol";
import { CONTENT_VERSION } from "../saveVersions";
import { validateEnvelope } from "../saveSchema";
import { stateHash } from "../../debug/stateHash";

import { DEFAULT_PLAYER_PREFERENCES } from "../../settings/playerPreferences";

it("migrates version 12 distribution and commercial defaults to version 13", () => {
  const state: any = createInitialGameState(7);
  delete state.distribution;
  delete state.company.groupTargets;

  // Create a minimal version 12 fixture omitting fields introduced in version 13
  const v12Fixture = {
    ...state,
    commercial: {
      campaigns: [
        {
          id: "c1",
          objective: "awareness",
          channel: "radio",
          targetSegmentId: "segment.business",
          startDateKey: "1991-01-01",
          durationDays: 30,
          budgetMinor: 1000,
          creativeQuality: 5,
          status: "running",
        },
      ],
      campaignAgeDays: {},
      campaignAttributionLog: [
        {
          campaignId: "c1",
          low: 10,
          base: 10,
          high: 10,
          realised: 10,
          atDateKey: "1991-01-01",
        },
      ],
      sales: {
        leads: [],
        contracts: [
          {
            id: "ct1",
            accountName: "A",
            segmentId: "segment.business",
            negotiatedRateMinor: 1000,
            expectedRoomNights: 100,
            concessions: [],
            validFromDateKey: "1991-01-01",
            validToDateKey: "1991-12-31",
          },
        ],
      },
      crm: { preferences: [], stays: [] },
    },
    company: {
      ...state.company,
      groupTargets: undefined,
    },
    revenuePolicy: {
      ...state.revenuePolicy,
      managerAttributes: undefined,
    },
  };

  const migrated = migrateV12ToV13({
    saveVersion: 12,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    rngState: structuredClone(state.rngState),
    state: structuredClone(v12Fixture),
    preferences: DEFAULT_PLAYER_PREFERENCES,
  });

  expect(migrated.saveVersion).toBe(13);

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

  expect(mState.commercial.campaigns[0].region).toBe("national");
  expect(mState.commercial.campaigns[0].message).toBe("awareness");
  expect(mState.commercial.campaignAttributionLog[0]).toEqual({
    campaignId: "c1",
    lowBasisPoints: 10,
    baseBasisPoints: 10,
    highBasisPoints: 10,
    realisedBasisPoints: 10,
    atDateKey: "1991-01-01",
  });

  expect(mState.commercial.loyalty).toEqual({
    members: [],
    liabilityMinor: 0,
    active: true,
  });
  expect(mState.commercial.sales.contracts[0].blackoutDateKeys).toEqual([]);
  expect(mState.commercial.sales.contracts[0].paymentTermsDays).toBe(0);
  expect(
    mState.commercial.sales.contracts[0].cancellationDaysBeforeArrival,
  ).toBe(0);
  expect(mState.commercial.sales.contracts[0].cancellationFeeBasisPoints).toBe(
    0,
  );

  expect(mState.revenuePolicy.managerAttributes).toEqual({
    PricingStrategy: 50,
    StayRestriction: 50,
    ChannelManagement: 50,
    GroupNegotiation: 50,
    ContractNegotiation: 50,
  });

  expect(validateEnvelope(migrated)).toEqual([]);

  const v12FixtureClone = structuredClone(v12Fixture);
  const rngStateClone = structuredClone(state.rngState);
  const migrated2 = migrateV12ToV13({
    saveVersion: 12,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    rngState: rngStateClone,
    state: v12FixtureClone,
    preferences: DEFAULT_PLAYER_PREFERENCES,
  });

  expect(stateHash(migrated.state)).toBe(stateHash(migrated2.state));
});
