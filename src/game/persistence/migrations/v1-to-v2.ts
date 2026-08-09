import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../saveVersions";
import { STARTER_HOTEL } from "../../content/1991/starterHotel";
import {
  STARTER_PLANT,
  UNKNOWN_PLANT_DEFAULTS,
} from "../../content/1991/plant";
import { defaultModuleForCategory } from "../../content/rooms/modules";

/**
 * Nameplate ratings the deep engineering rules need for a v1 asset. They come
 * from the same content module a new game reads, so a migrated save and a new
 * campaign can never disagree about laundry capacity or service cost.
 */
const ASSET_DEFAULTS: Record<
  string,
  { rated: number; replacementMinor: number }
> = Object.fromEntries(
  STARTER_PLANT.map((a) => [
    a.id,
    { rated: a.rated, replacementMinor: a.replacementMinor },
  ]),
);

/** The module a category maps to, or the house default if it is unknown. */
function fallbackModuleId(category: string): string {
  try {
    return defaultModuleForCategory(category).id;
  } catch {
    // An unrecognised category must cost the player one room's fit-out, not
    // the whole save: the load has to keep working.
    return defaultModuleForCategory("double").id;
  }
}

function migrateRoom(room: Record<string, unknown>): Record<string, unknown> {
  const category = String(room.category ?? "double");
  return {
    ...room,
    // A v1 room was sold without a product; it keeps the fit-out its category
    // was built with, and the age the starter house actually carries.
    moduleId:
      typeof room.moduleId === "string"
        ? room.moduleId
        : fallbackModuleId(category),
    styleAgeYears:
      typeof room.styleAgeYears === "number" ? room.styleAgeYears : 16,
  };
}

function migrateAsset(asset: Record<string, unknown>): Record<string, unknown> {
  const defaults = ASSET_DEFAULTS[String(asset.id)] ?? UNKNOWN_PLANT_DEFAULTS;
  return {
    minutesSinceService: 0,
    ...asset,
    // Defaulted after the spread: a stored `rated: undefined` would otherwise
    // overwrite the fallback and reach the engineering rules as undefined.
    rated: typeof asset.rated === "number" ? asset.rated : defaults.rated,
    replacementMinor:
      typeof asset.replacementMinor === "number"
        ? asset.replacementMinor
        : defaults.replacementMinor,
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
      eventHousekeepingWorkedMinutes: state.eventHousekeepingWorkedMinutes ?? 0,
      classification: state.classification ?? { stars: 0, blockedBy: [] },
      specializationId: state.specializationId ?? null,
      investedArea: state.investedArea ?? {
        conferenceSqm: STARTER_HOTEL.conferenceSqm,
        wellnessSqm: STARTER_HOTEL.wellnessSqm,
      },
    },
  };
}
