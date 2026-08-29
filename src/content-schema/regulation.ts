import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  MinutesSchema,
  StableIdSchema,
} from "./common";
import { REPUTATION_DIMENSIONS } from "../game/reputation/dimensions";

export const RegulationConsequenceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("fine"),
      amountMinor: MinorCurrencySchema.nonnegative(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("restriction"),
      facilityId: StableIdSchema,
      capacityValue: z.number().int().nonnegative().optional(),
      capacityFactorBp: BasisPointsSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("closure"),
      facilityId: StableIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("reputation"),
      dimension: z.enum(REPUTATION_DIMENSIONS),
      delta: z.number().int(),
    })
    .strict(),
]);

export const RegulationSchema = z
  .object({
    id: StableIdSchema,
    kind: z.literal("regulation"),
    simulationOrder: z.number().int().nonnegative(),
    nameKey: StableIdSchema,
    jurisdictionId: StableIdSchema,
    area: z.enum([
      "safety",
      "labor",
      "accessibility",
      "environment",
      "foodHygiene",
      "privacy",
      "construction",
      "tax",
    ]),
    requirement: z.number().int().nonnegative(),
    effectiveAtMinutes: MinutesSchema,
    graceMinutes: MinutesSchema,
    noticeAtMinutes: MinutesSchema,
    inspectionRiskBp: BasisPointsSchema,
    consequenceMinor: MinorCurrencySchema.nonnegative().default(0),
    consequences: z.array(RegulationConsequenceSchema).default([]),
    affectedFacilityId: StableIdSchema.optional(),
    reputationDimension: z.enum(REPUTATION_DIMENSIONS).optional(),
    reputationScope: z.string().optional(),
    requiredTechnologyIds: z.array(StableIdSchema).default([]),
    activation: z
      .object({
        worldMetric: z.string().min(1),
        minimum: z.number().int(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type RegulationContent = z.infer<typeof RegulationSchema>;
export type RegulationConsequenceContent = z.infer<
  typeof RegulationConsequenceSchema
>;
