import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  MinutesSchema,
  SquareMetersSchema,
  StableIdSchema,
} from "./common";

export const RoomProductSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("roomProduct"),
  simulationOrder: z.number().int().nonnegative(),
  name: z.string().min(1),
  nameKey: StableIdSchema,
  category: z.string().min(1),
  areaSquareMeters: SquareMetersSchema,
  capacityGuests: z.number().int().positive(),
  comfortBasisPoints: BasisPointsSchema,
  bathBasisPoints: BasisPointsSchema,
  technologyBasisPoints: BasisPointsSchema,
  cleanMinutes: MinutesSchema,
  linenPieces: z.number().int().nonnegative(),
  fitOutCostMinor: MinorCurrencySchema.nonnegative(),
  requiredTechnologyIds: z.array(StableIdSchema).default([]),
});
export type RoomProductContent = z.infer<typeof RoomProductSchema>;
