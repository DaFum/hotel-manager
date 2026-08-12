import type { HotelId } from "../domain/ids";
import { portfolioDetailTiers, type DetailTier } from "./detailTiers";

/**
 * Phase-1 integration seam for selecting tiers before the quantum owns them.
 * Competitors are derived as the hotels outside the player-owned set.
 */
export function prototypePortfolioDetailTiers(input: {
  viewedHotelId: HotelId;
  playerHotelIds: readonly HotelId[];
  hotelIds: readonly HotelId[];
}): Record<HotelId, DetailTier> {
  const playerHotelIds = new Set(input.playerHotelIds);
  return portfolioDetailTiers({
    viewedHotelId: input.viewedHotelId,
    playerHotelIds: [...playerHotelIds],
    competitorHotelIds: input.hotelIds.filter((id) => !playerHotelIds.has(id)),
  });
}
