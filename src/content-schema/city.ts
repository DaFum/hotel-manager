import { z } from "zod";
import { MinorCurrencySchema, StableIdSchema } from "./common";

export const CitySchema = z.object({
  id: StableIdSchema,
  kind: z.literal("city"),
  nameKey: StableIdSchema,
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  baseDemandRoomNights: z.number().int().nonnegative(),
  baseMonthlyWageMinor: MinorCurrencySchema.nonnegative(),
  seasonalityBasisPoints: z
    .array(z.number().int().min(0).max(20_000))
    .length(12),
});
export type CityContent = z.infer<typeof CitySchema>;
