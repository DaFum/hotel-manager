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

  it("normalizes recipe cost from referenced portion items, not quantities", () => {
    const raw = structuredClone(corePack);
    const recipe = raw.entries["menu.breakfast.buffet"];
    recipe.ingredients[0].quantityMilliUnits = 9_999;
    const loaded = loadContentPack(raw).registry.getByKind(
      "menu.breakfast.buffet",
      "recipe",
    );
    expect(loaded.ingredientCostMinor).toBe(650);
  });
});
