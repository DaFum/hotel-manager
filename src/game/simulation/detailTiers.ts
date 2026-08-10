export type DetailTier = "full" | "operational" | "aggregate";

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
}): Record<string, DetailTier> {
  const playerIds = new Set(input.playerHotelIds);
  if (!playerIds.has(input.viewedHotelId))
    throw new Error("the viewed hotel must belong to the player portfolio");
  return Object.fromEntries([
    ...[...playerIds].sort().map(
      (id) =>
        [
          id,
          detailTierForHotel({
            isViewed: id === input.viewedHotelId,
            isPlayerHotel: true,
          }),
        ] as const,
    ),
    ...[...input.competitorHotelIds]
      .sort()
      .map((id) => [id, "aggregate" as const]),
  ]);
}
