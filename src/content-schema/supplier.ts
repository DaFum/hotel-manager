import { z } from "zod";
import { MinorCurrencySchema, MinutesSchema, StableIdSchema } from "./common";

export const SupplierSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("supplier"),
  simulationOrder: z.number().int().nonnegative(),
  name: z.string().min(1),
  nameKey: StableIdSchema,
  itemIds: z.array(StableIdSchema).min(1),
  sku: z.string().min(1),
  unitCostMinor: MinorCurrencySchema.nonnegative(),
  leadTimeMinutes: MinutesSchema,
  minimumQuantity: z.number().int().positive(),
});
export type SupplierContent = z.infer<typeof SupplierSchema>;
