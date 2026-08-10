import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

export const TechnologySchema = z
  .object({
    id: StableIdSchema,
    kind: z.literal("technology"),
    runtimeId: z.string().min(1),
    simulationOrder: z.number().int().nonnegative(),
    nameKey: StableIdSchema,
    prerequisiteIds: z.array(StableIdSchema).default([]),
    competingStandardIds: z.array(StableIdSchema).default([]),
    emergenceThresholdBasisPoints: BasisPointsSchema,
    initialAdoptionBasisPoints: BasisPointsSchema,
    implementationCostMinor: MinorCurrencySchema.nonnegative(),
    replacedByTechnologyId: StableIdSchema.optional(),
  })
  .strict();

export const TrendSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("trend"),
  runtimeId: z.string().min(1),
  simulationOrder: z.number().int().nonnegative(),
  nameKey: StableIdSchema,
  driverTechnologyIds: z.array(StableIdSchema).default([]),
  initialAdoptionBasisPoints: BasisPointsSchema,
  demandEffectBasisPoints: z.number().int().min(-10_000).max(10_000),
});
export type TechnologyContent = z.infer<typeof TechnologySchema>;
export type TrendContent = z.infer<typeof TrendSchema>;
