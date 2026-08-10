import { describe, expect, it } from "vitest";
import { exportContentPack, importContentPack } from "./contentFileIO";

describe("content file IO", () => {
  it("round trips a validated pack deterministically", () => {
    const pack = {
      packId: "test",
      schemaVersion: 1,
      contentVersion: "1",
      entries: {},
    };
    expect(importContentPack(exportContentPack(pack))).toEqual(pack);
    expect(exportContentPack(pack)).toBe(exportContentPack(pack));
  });

  it("sorts entry ids so authoring history cannot change exported bytes", () => {
    const city = {
      id: "city.test",
      kind: "city" as const,
      nameKey: "city.test.name",
      countryCode: "DE",
      currencyCode: "DEM",
      baseDemandRoomNights: 1,
      baseMonthlyWageMinor: 1,
      seasonalityBasisPoints: Array(12).fill(10_000),
    };
    const first = {
      packId: "test",
      schemaVersion: 1,
      contentVersion: "1",
      entries: {
        "city.zed": { ...city, id: "city.zed" },
        "city.alpha": { ...city, id: "city.alpha" },
      },
    };
    const second = {
      ...first,
      entries: {
        "city.alpha": first.entries["city.alpha"],
        "city.zed": first.entries["city.zed"],
      },
    };
    expect(exportContentPack(first)).toBe(exportContentPack(second));
  });
});
