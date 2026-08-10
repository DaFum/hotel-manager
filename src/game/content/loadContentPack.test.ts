import { describe, expect, it } from "vitest";
import corePack from "../../content/core/core-pack.json";
import { loadContentPack } from "./loadContentPack";

describe("loadContentPack", () => {
  it("rejects unsupported schemas and bad references before making a registry", () => {
    expect(() => loadContentPack({ ...corePack, schemaVersion: 999 })).toThrow(
      /schema version/i,
    );
    expect(() =>
      loadContentPack({
        ...corePack,
        entries: {
          ...corePack.entries,
          "facility.invalid": {
            id: "facility.invalid",
            kind: "facility",
            nameKey: "facility.invalid.name",
            areaSquareMeters: 1,
            capacity: 1,
            monthlyFixedCostMinor: 0,
            requiredTechnologyIds: ["tech.missing"],
          },
        },
      }),
    ).toThrow(/tech.missing/);
  });
});
