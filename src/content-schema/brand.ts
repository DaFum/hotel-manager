import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

export const BrandSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("brand"),
  simulationOrder: z.number().int().nonnegative(),
  nameKey: StableIdSchema,
  minimumRoomQualityBasisPoints: BasisPointsSchema,
  minimumGuestSatisfactionBasisPoints: BasisPointsSchema,
  minimumStars: z.number().int().min(1).max(5).optional(),
  requiredFacilityIds: z.array(StableIdSchema).default([]),
  requiredTechnologyIds: z.array(StableIdSchema).default([]),
  demandUpliftBasisPoints: BasisPointsSchema,
  monthlyFeeMinor: MinorCurrencySchema.nonnegative(),
});
export type BrandContent = z.infer<typeof BrandSchema>;
