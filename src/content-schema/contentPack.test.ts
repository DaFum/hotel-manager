import { describe, expect, it } from "vitest";
import { ContentPackSchema } from "./contentPack";

describe("ContentPackSchema", () => {
  it("requires stable versions and typed entry families", () => {
    expect(
      ContentPackSchema.parse({
        packId: "core",
        schemaVersion: 1,
        contentVersion: "1991.1",
        entries: {},
      }).packId,
    ).toBe("core");
    expect(() =>
      ContentPackSchema.parse({
        packId: "",
        schemaVersion: 0,
        contentVersion: "",
        entries: {},
      }),
    ).toThrow();
  });

  it("rejects an entry key that does not match its stable id", () => {
    expect(() =>
      ContentPackSchema.parse({
        packId: "test",
        schemaVersion: 1,
        contentVersion: "1",
        entries: {
          "city.wrong": city("city.right"),
        },
      }),
    ).toThrow(/does not match/);
  });

  it("rejects guest shares that do not total 10000 basis points", () => {
    expect(() =>
      ContentPackSchema.parse({
        packId: "test",
        schemaVersion: 1,
        contentVersion: "1",
        entries: {
          "segment.only": guest("segment.only", 9_999),
        },
      }),
    ).toThrow(/not 10000/);
  });

  it("rejects duplicate runtime ids", () => {
    expect(() =>
      ContentPackSchema.parse({
        packId: "test",
        schemaVersion: 1,
        contentVersion: "1",
        entries: {
          "tech.one": technology("tech.one", "shared", 0),
          "tech.two": technology("tech.two", "shared", 1),
        },
      }),
    ).toThrow(/duplicate runtime id/);
  });
});

function city(id: string) {
  return {
    id,
    kind: "city",
    nameKey: `${id}.name`,
    countryCode: "DE",
    currencyCode: "DEM",
    baseDemandRoomNights: 1,
    baseMonthlyWageMinor: 1,
    seasonalityBasisPoints: Array(12).fill(10_000),
  };
}

function guest(id: string, shareBasisPoints: number) {
  return {
    id,
    kind: "guestSegment",
    simulationOrder: 0,
    name: "Guest",
    nameKey: `${id}.name`,
    shareBasisPoints,
    willingnessToPayMinor: 1,
    averageNights: 1,
    breakfastTakeUpBasisPoints: 0,
    preferredFacilityIds: [],
  };
}

function technology(id: string, runtimeId: string, simulationOrder: number) {
  return {
    id,
    kind: "technology",
    runtimeId,
    simulationOrder,
    nameKey: `${id}.name`,
    prerequisiteIds: [],
    competingStandardIds: [],
    emergenceThresholdBasisPoints: 0,
    initialAdoptionBasisPoints: 0,
    implementationCostMinor: 0,
  };
}
