import { z } from "zod";
import { MinorCurrencySchema, StableIdSchema } from "./common";

export const ItemSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("item"),
  nameKey: StableIdSchema,
  unitKey: StableIdSchema,
  referenceCostMinor: MinorCurrencySchema.nonnegative(),
});
