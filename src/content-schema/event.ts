import { z } from "zod";
import { MinorCurrencySchema, StableIdSchema } from "./common";

const NarrativeConditionSchema = z.object({
  key: z.enum([
    "occupancyBasisPoints",
    "mediaReach",
    "guestSatisfaction",
    "internetAdoptionBp",
    "cashMinor",
  ]),
  min: z.number().int().safe(),
});
const NarrativeChoiceSchema = z.object({
  id: z.string().min(1),
  labelKey: StableIdSchema,
  costMinor: MinorCurrencySchema.nonnegative(),
  reputationDelta: z.number().int(),
  account: z.enum(["guest-recovery", "investment"]),
});
export const EventSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("event"),
  simulationOrder: z.number().int().nonnegative(),
  titleKey: StableIdSchema,
  bodyKey: StableIdSchema,
  conditions: z.array(NarrativeConditionSchema).min(1),
  choices: z.array(NarrativeChoiceSchema).min(1),
  priority: z.number().int().nonnegative(),
  cooldownMonths: z.number().int().nonnegative(),
  requiredTechnologyIds: z.array(StableIdSchema).default([]),
});
export type EventContent = z.infer<typeof EventSchema>;
