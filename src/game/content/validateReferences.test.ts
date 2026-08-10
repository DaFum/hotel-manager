import { describe, expect, it } from "vitest";
import type { ContentEntry } from "../../content-schema/contentPack";
import corePack from "../../content/core/core-pack.json";
import { validateReferences } from "./validateReferences";

describe("content references", () => {
  it("reports missing, mistyped, and cyclic references", () => {
    const records = [
      {
        id: "city.frankfurt",
        kind: "city",
        nameKey: "city.frankfurt.name",
        countryCode: "DE",
        currencyCode: "DEM",
        baseDemandRoomNights: 1,
        baseMonthlyWageMinor: 1,
        seasonalityBasisPoints: Array(12).fill(10_000),
      },
      {
        id: "tech.a",
        kind: "technology",
        nameKey: "tech.a.name",
        prerequisiteIds: ["tech.b"],
        competingStandardIds: [],
        emergenceThresholdBasisPoints: 1,
        implementationCostMinor: 1,
      },
      {
        id: "tech.b",
        kind: "technology",
        nameKey: "tech.b.name",
        prerequisiteIds: ["tech.a"],
        competingStandardIds: [],
        emergenceThresholdBasisPoints: 1,
        implementationCostMinor: 1,
      },
      {
        id: "facility.smart",
        kind: "facility",
        nameKey: "facility.smart.name",
        areaSquareMeters: 1,
        capacity: 1,
        monthlyFixedCostMinor: 1,
        requiredTechnologyIds: ["tech.missing", "city.frankfurt"],
      },
    ] as ContentEntry[];
    expect(validateReferences(records)).toEqual(
      expect.arrayContaining([
        {
          sourceId: "facility.smart",
          targetId: "tech.missing",
          field: "requiredTechnologyIds",
          reason: "missing",
        },
        {
          sourceId: "facility.smart",
          targetId: "city.frankfurt",
          field: "requiredTechnologyIds",
          reason: "wrong-kind",
        },
        expect.objectContaining({ field: "prerequisiteIds", reason: "cycle" }),
      ]),
    );
  });

  it("rejects duplicate declared processing order within a family", () => {
    const packRecords = Object.values(
      structuredClone(corePack).entries,
    ) as ContentEntry[];
    const guests = packRecords.filter(
      (record) => record.kind === "guestSegment",
    );
    guests[1].simulationOrder = guests[0].simulationOrder;
    expect(validateReferences(packRecords)).toContainEqual(
      expect.objectContaining({
        field: "simulationOrder",
        reason: "duplicate-order",
      }),
    );
  });

  it("reports the same errors in the same order for shuffled input", () => {
    const records = Object.values(
      structuredClone(corePack).entries,
    ) as ContentEntry[];
    const broken = records.map((record) =>
      record.id === "tech.personal-computer"
        ? { ...record, prerequisiteIds: ["tech.internet"] }
        : record,
    ) as ContentEntry[];
    expect(validateReferences([...broken].reverse())).toEqual(
      validateReferences(broken),
    );
  });
});
