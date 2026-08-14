import fs from "fs";
import { expect, it } from "vitest";
import { migrateV12ToV13 } from "./v12-to-v13";
import { createInitialGameState } from "../../simulation/initialState";
import { PROTOCOL_VERSION } from "../../domain/protocol";
import { CONTENT_VERSION } from "../saveVersions";
import { validateEnvelope } from "../saveSchema";
import { DEFAULT_PLAYER_PREFERENCES } from "../../settings/playerPreferences";

it("migrates version 12 distribution and commercial defaults to version 13", () => {
  const fixtureRaw = fs.readFileSync("fixtures/v12-save.json", "utf-8");
  const fullFixture = JSON.parse(fixtureRaw);

  // Create a minimal version 12 fixture omitting fields introduced in version 13
  const v12Fixture = fullFixture.state;

  const migrated = migrateV12ToV13(fullFixture);

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
});
