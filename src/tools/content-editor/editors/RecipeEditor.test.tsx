import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecipeEditor } from "./RecipeEditor";
describe("RecipeEditor", () => {
  it("shows ingredient ids and explicit milli-unit quantities", () => {
    render(
      <RecipeEditor
        value={{
          id: "recipe.breakfast",
          kind: "recipe",
          simulationOrder: 0,
          name: "Breakfast",
          nameKey: "recipe.breakfast.name",
          outlet: "breakfast",
          ingredients: [{ itemId: "item.egg", quantityMilliUnits: 2000 }],
          ingredientCostMinor: 500,
          prepMinutes: 6,
          priceMinor: 1,
        }}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByDisplayValue("item.egg")).toBeTruthy();
    expect(screen.getByDisplayValue("2000")).toBeTruthy();
  });
});
