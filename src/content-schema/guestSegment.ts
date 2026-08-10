import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

export const GuestSegmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("guestSegment"),
  simulationOrder: z.number().int().nonnegative(),
  name: z.string().min(1),
  nameKey: StableIdSchema,
  shareBasisPoints: BasisPointsSchema,
  willingnessToPayMinor: MinorCurrencySchema.nonnegative(),
  averageNights: z.number().int().positive(),
  breakfastTakeUpBasisPoints: BasisPointsSchema,
  preferredFacilityIds: z.array(StableIdSchema).default([]),
});
export type GuestSegmentContent = z.infer<typeof GuestSegmentSchema>;
