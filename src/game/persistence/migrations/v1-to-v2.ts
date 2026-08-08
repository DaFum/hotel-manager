import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../saveSchema";
import { STARTER_HOTEL } from "../../content/1991/starterHotel";
import { defaultModuleForCategory } from "../../content/rooms/modules";

/** Nameplate ratings the deep engineering rules need for a v1 asset. */
const ASSET_DEFAULTS: Record<
  string,
  { rated: number; replacementMinor: number }
> = {
  "asset.boiler": { rated: 120, replacementMinor: 4_500_000 },
  "asset.lift": { rated: 180, replacementMinor: 6_000_000 },
};

function migrateRoom(room: Record<string, unknown>): Record<string, unknown> {
  const category = String(room.category ?? "double");
  return {
    ...room,
    // A v1 room was sold without a product; it keeps the fit-out its category
    // was built with, and the age the starter house actually carries.
    moduleId:
      typeof room.moduleId === "string"
        ? room.moduleId
        : defaultModuleForCategory(category).id,
    styleAgeYears:
      typeof room.styleAgeYears === "number" ? room.styleAgeYears : 16,
  };
}

function migrateAsset(asset: Record<string, unknown>): Record<string, unknown> {
  const defaults = ASSET_DEFAULTS[String(asset.id)] ?? {
    rated: 100,
    replacementMinor: 2_000_000,
  };
  return {
    minutesSinceService: 0,
    ...defaults,
    ...asset,
  };
}

/**
 * v1 saves predate every deep facility. The migration fills the new sections
 * with the state a v1 hotel was implicitly in — full linen cupboard, no
 * conferences, nothing declared — rather than reinterpreting any old field.
 */
export function migrateV1ToV2(s: SaveEnvelope): SaveEnvelope {
  const state = (s.state ?? {}) as Record<string, unknown>;
  const hotel = (state.hotel ?? {}) as Record<string, unknown>;
  const rooms = Array.isArray(hotel.rooms)
    ? (hotel.rooms as Record<string, unknown>[]).map(migrateRoom)
    : [];
  const assets = Array.isArray(state.assets)
    ? (state.assets as Record<string, unknown>[]).map(migrateAsset)
    : [];

  return {
    ...s,
    saveVersion: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    state: {
      ...state,
      hotel: { ...hotel, rooms },
      assets,
      // Recomputed every snapshot phase; an empty board is the honest start.
      facilities: [],
      linen: state.linen ?? {
        clean: STARTER_HOTEL.startingLinenPieces,
        dirty: 0,
      },
      events: state.events ?? [],
      wellness: state.wellness ?? {
        treatmentRooms: STARTER_HOTEL.treatmentRooms,
        therapists: 0,
        openMinutes: STARTER_HOTEL.wellnessOpenMinutes,
        booked: 0,
      },
      elevatorTrips: state.elevatorTrips ?? 0,
      eventHousekeepingMinutes: state.eventHousekeepingMinutes ?? 0,
      classification: state.classification ?? { stars: 0, blockedBy: [] },
      specializationId: state.specializationId ?? null,
    },
  };
}
