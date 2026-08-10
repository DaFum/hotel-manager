import type { RecipeContent } from "../../../content-schema/recipe";
import { NumberField, TextField } from "./fields";
export function RecipeEditor({
  value,
  onChange,
}: {
  value: RecipeContent;
  onChange: (value: RecipeContent) => void;
}) {
  return (
    <fieldset>
      <legend>Recipe</legend>
      <TextField
        label="Stable ID"
        value={value.id}
        onChange={(id) => onChange({ ...value, id })}
      />
      {value.ingredients.map((ingredient, index) => (
        <div key={index}>
          <TextField
            label={`Ingredient ${index + 1}`}
            value={ingredient.itemId}
            onChange={(itemId) =>
              onChange({
                ...value,
                ingredients: value.ingredients.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, itemId } : current,
                ),
              })
            }
          />
          <NumberField
            label={`Quantity ${index + 1} (milli-units)`}
            value={ingredient.quantityMilliUnits}
            onChange={(quantityMilliUnits) =>
              onChange({
                ...value,
                ingredients: value.ingredients.map((current, currentIndex) =>
                  currentIndex === index
                    ? { ...current, quantityMilliUnits }
                    : current,
                ),
              })
            }
          />
        </div>
      ))}
    </fieldset>
  );
}
