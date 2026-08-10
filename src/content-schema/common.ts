import { z } from "zod";

export const StableIdSchema = z
  .string()
  .min(3)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/);
export const BasisPointsSchema = z.number().int().min(0).max(10_000);
export const MinorCurrencySchema = z.number().int().safe();
export const MinutesSchema = z.number().int().safe().nonnegative();
export const SquareMetersSchema = z.number().positive().finite();

export const CONTENT_DEFAULTS = Object.freeze({
  maintenanceConditionBasisPoints: 10_000,
  availabilityBasisPoints: 10_000,
});

export const ContentRecordBaseSchema = z.object({
  id: StableIdSchema,
  kind: z.string().min(1),
});

export type ContentRecordBase = z.infer<typeof ContentRecordBaseSchema>;
