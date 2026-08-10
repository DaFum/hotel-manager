import { z } from "zod";
import { MinorCurrencySchema, MinutesSchema, StableIdSchema } from "./common";

export const RecipeSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("recipe"),
  simulationOrder: z.number().int().nonnegative(),
  name: z.string().min(1),
  nameKey: StableIdSchema,
  outlet: z.enum(["breakfast", "restaurant", "bar", "roomservice"]),
  ingredients: z
    .array(
      z.object({
        itemId: StableIdSchema,
        quantityMilliUnits: z.number().int().positive(),
      }),
    )
    .min(1),
  ingredientCostMinor: MinorCurrencySchema.nonnegative().default(0),
  prepMinutes: MinutesSchema,
  priceMinor: MinorCurrencySchema.nonnegative(),
});
export type RecipeContent = z.infer<typeof RecipeSchema>;
