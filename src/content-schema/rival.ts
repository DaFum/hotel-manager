import { z } from "zod";
import {
  BasisPointsSchema,
  MinorCurrencySchema,
  StableIdSchema,
} from "./common";

export const RivalSchema = z.object({
  id: StableIdSchema,
  kind: z.literal("rival"),
  simulationOrder: z.number().int().nonnegative(),
  nameKey: StableIdSchema,
  homeCityId: StableIdSchema,
  strategy: z.enum(["luxury", "family", "budget", "lifestyle", "aggressive"]),
  rooms: z.number().int().positive(),
  rateMinor: MinorCurrencySchema.nonnegative(),
  appealBasisPoints: z.number().int().min(0).max(20_000),
  openingCapitalMinor: MinorCurrencySchema.nonnegative(),
  openingDebtMinor: MinorCurrencySchema.nonnegative(),
  riskToleranceBasisPoints: BasisPointsSchema,
});
export type RivalContent = z.infer<typeof RivalSchema>;
