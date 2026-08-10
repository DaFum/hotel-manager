import { describe, expect, it } from "vitest";
import { FacilitySchema } from "./facility";
import { TechnologySchema } from "./technology";
import { RecipeSchema } from "./recipe";

describe("content family schemas", () => {
  it("requires explicit facility units", () => {
    expect(
      FacilitySchema.parse({
        id: "facility.breakfast",
        kind: "facility",
        nameKey: "facility.breakfast.name",
        areaSquareMeters: 80,
        capacity: 50,
        monthlyFixedCostMinor: 200_000,
      }).capacity,
    ).toBe(50);
  });

  it("rejects fixed technology years", () => {
    expect(() =>
      TechnologySchema.parse({
        id: "tech.wifi",
        kind: "technology",
        runtimeId: "wifi",
        simulationOrder: 0,
        nameKey: "tech.wifi.name",
        prerequisiteIds: [],
        competingStandardIds: [],
        emergenceThresholdBasisPoints: 6500,
        initialAdoptionBasisPoints: 0,
        implementationCostMinor: 1,
        fixedYear: 1999,
      }),
    ).toThrow();
  });

  it("preserves recipe quantities and defaults omitted ingredient cost", () => {
    const recipe = RecipeSchema.parse({
      id: "recipe.breakfast",
      kind: "recipe",
      simulationOrder: 0,
      name: "Breakfast",
      nameKey: "recipe.breakfast.name",
      outlet: "breakfast",
      ingredients: [{ itemId: "item.egg", quantityMilliUnits: 2000 }],
      prepMinutes: 6,
      priceMinor: 1200,
    });
    expect(recipe.ingredients[0].quantityMilliUnits).toBe(2000);
    expect(recipe.ingredientCostMinor).toBe(0);
  });

  it("rejects negative recipe preparation minutes", () => {
    expect(() =>
      RecipeSchema.parse({
        id: "recipe.breakfast",
        kind: "recipe",
        simulationOrder: 0,
        name: "Breakfast",
        nameKey: "recipe.breakfast.name",
        outlet: "breakfast",
        ingredients: [{ itemId: "item.egg", quantityMilliUnits: 2000 }],
        prepMinutes: -1,
        priceMinor: 1200,
      }),
    ).toThrow();
  });
});
