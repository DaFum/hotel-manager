import { z } from "zod";
import {
  MinorCurrencySchema,
  SquareMetersSchema,
  StableIdSchema,
} from "./common";

export const FacilitySchema = z.object({
  id: StableIdSchema,
  kind: z.literal("facility"),
  nameKey: StableIdSchema,
  areaSquareMeters: SquareMetersSchema,
  capacity: z.number().int().nonnegative(),
  monthlyFixedCostMinor: MinorCurrencySchema.nonnegative(),
  requiredTechnologyIds: z.array(StableIdSchema).default([]),
});
export type FacilityContent = z.infer<typeof FacilitySchema>;
