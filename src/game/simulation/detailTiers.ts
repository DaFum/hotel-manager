import { compareIds } from "../domain/ids";

export type DetailTier = "full" | "operational" | "aggregate";

/** Spike-confirmed cap for player hotels retaining sub-monthly simulation. */
export const MAX_OPERATIONAL_PLAYER_HOTELS = 4;

export interface HotelDetailContext {
  isViewed: boolean;
  isPlayerHotel: boolean;
}

export function detailTierForHotel(hotel: HotelDetailContext): DetailTier {
  return hotel.isViewed
    ? "full"
    : hotel.isPlayerHotel
      ? "operational"
      : "aggregate";
}

export const DETAIL_TIER_PHASES = {
  full: ["frequent", "hourly", "daily", "monthly", "yearly"],
  operational: ["hourly", "daily", "monthly", "yearly"],
  aggregate: ["monthly", "yearly"],
} as const;

export function portfolioDetailTiers(input: {
  viewedHotelId: string;
  playerHotelIds: readonly string[];
  competitorHotelIds: readonly string[];
  operationalHotelLimit?: number;
}): Record<string, DetailTier> {
  const playerIds = new Set(input.playerHotelIds);
  if (!playerIds.has(input.viewedHotelId))
    throw new Error("the viewed hotel must belong to the player portfolio");
  const operationalIds = new Set(
    [...playerIds]
      .filter((id) => id !== input.viewedHotelId)
      .sort(compareIds)
      .slice(0, input.operationalHotelLimit ?? MAX_OPERATIONAL_PLAYER_HOTELS),
  );
  return Object.fromEntries([
    ...[...playerIds].sort(compareIds).map(
      (id) =>
        [
          id,
          detailTierForHotel({
            isViewed: id === input.viewedHotelId,
            isPlayerHotel: operationalIds.has(id),
          }),
        ] as const,
    ),
    ...[...input.competitorHotelIds]
      .sort(compareIds)
      .map((id) => [id, "aggregate" as const]),
  ]);
}
