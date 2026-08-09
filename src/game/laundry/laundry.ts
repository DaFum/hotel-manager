import { safeProductMinor } from "../domain/units";
import { availableThroughput } from "../facilities/capacity";
import { roomModule } from "../content/rooms/modules";

/** Linen is stock like any other consumable, so it shares the inventory store. */
export const LINEN_SKU = "linen-piece";
/** What a contract laundry charges per piece, in Pfennig. */
export const EXTERNAL_PIECE_MINOR = 120;

/** Pieces the in-house laundry can turn, limited by the tightest constraint. */
export function laundryOutput(i: {
  dirty: number;
  machine: number;
  staffed: number;
}): number {
  return availableThroughput({
    space: i.dirty,
    equipment: i.machine,
    staffed: i.staffed,
  });
}

/** Pieces a set of turned rooms puts into the dirty pile. */
export function linenSoiled(rooms: readonly { moduleId: string }[]): number {
  return rooms.reduce((sum, r) => sum + roomModule(r.moduleId).linenPieces, 0);
}

export function externalLaundryCostMinor(pieces: number): number {
  return safeProductMinor(pieces, EXTERNAL_PIECE_MINOR, "external laundry");
}

export interface LaundryDayInput {
  clean: number;
  dirty: number;
  machine: number;
  staffed: number;
  /** Pieces the contract laundry will take today. */
  externalPieces: number;
  /** Clean pieces held on guest floors and unavailable to the laundry. */
  floorStock?: number;
}

export interface LaundryDayResult {
  clean: number;
  dirty: number;
  washedInHouse: number;
  washedExternally: number;
  externalCostMinor: number;
  floorStock: number;
}

/**
 * In-house capacity is already paid for, so it is used first; whatever the
 * machines and the shift cannot reach goes out to contract at a piece rate.
 */
export function runLaundryDay(x: LaundryDayInput): LaundryDayResult {
  const floorStock = x.floorStock ?? 0;
  if (!Number.isSafeInteger(floorStock) || floorStock < 0)
    throw new Error("invalid laundry floor stock");
  const washedInHouse = laundryOutput({
    dirty: x.dirty,
    machine: x.machine,
    staffed: x.staffed,
  });
  const washedExternally = Math.max(
    0,
    Math.min(x.dirty - washedInHouse, x.externalPieces),
  );
  return {
    clean: x.clean + washedInHouse + washedExternally,
    dirty: x.dirty - washedInHouse - washedExternally,
    washedInHouse,
    washedExternally,
    externalCostMinor: externalLaundryCostMinor(washedExternally),
    floorStock,
  };
}
