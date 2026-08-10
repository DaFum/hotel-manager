import { z } from "zod";
import { BrandSchema } from "./brand";
import { CitySchema } from "./city";
import { StableIdSchema } from "./common";
import { EventSchema } from "./event";
import { FacilitySchema } from "./facility";
import { GuestSegmentSchema } from "./guestSegment";
import { ItemSchema } from "./item";
import { RecipeSchema } from "./recipe";
import { RivalSchema } from "./rival";
import { RoomProductSchema } from "./roomProduct";
import { SupplierSchema } from "./supplier";
import { TechnologySchema, TrendSchema } from "./technology";

export const CONTENT_SCHEMA_VERSION = 1;

export const ContentEntrySchema = z.discriminatedUnion("kind", [
  CitySchema,
  FacilitySchema,
  RoomProductSchema,
  TechnologySchema,
  TrendSchema,
  GuestSegmentSchema,
  ItemSchema,
  EventSchema,
  RecipeSchema,
  SupplierSchema,
  RivalSchema,
  BrandSchema,
]);

export const ContentPackSchema = z
  .object({
    packId: z
      .string()
      .min(1)
      .regex(/^[a-z0-9.-]+$/),
    schemaVersion: z.number().int().positive(),
    contentVersion: z.string().min(1),
    entries: z.record(StableIdSchema, ContentEntrySchema).default({}),
  })
  .strict()
  .superRefine((pack, context) => {
    for (const [key, entry] of Object.entries(pack.entries))
      if (key !== entry.id)
        context.addIssue({
          code: "custom",
          path: ["entries", key, "id"],
          message: `entry key ${key} does not match id ${entry.id}`,
        });
    const guests = Object.values(pack.entries).filter(
      (entry) => entry.kind === "guestSegment",
    );
    const guestShare = guests.reduce(
      (sum, entry) => sum + entry.shareBasisPoints,
      0,
    );
    if (guests.length > 0 && guestShare !== 10_000)
      context.addIssue({
        code: "custom",
        path: ["entries"],
        message: `guest segment shares total ${guestShare}, not 10000 basis points`,
      });
    const runtimeIds = new Set<string>();
    for (const entry of Object.values(pack.entries))
      if (entry.kind === "technology" || entry.kind === "trend") {
        if (runtimeIds.has(entry.runtimeId))
          context.addIssue({
            code: "custom",
            path: ["entries", entry.id, "runtimeId"],
            message: `duplicate runtime id ${entry.runtimeId}`,
          });
        runtimeIds.add(entry.runtimeId);
      }
  });

export type ContentPack = z.infer<typeof ContentPackSchema>;
export type ContentEntry = z.infer<typeof ContentEntrySchema>;
