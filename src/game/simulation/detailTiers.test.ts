import { describe, expect, it } from "vitest";
import {
  DETAIL_TIER_PHASES,
  detailTierForHotel,
  portfolioDetailTiers,
} from "./detailTiers";

describe("detail tiers", () => {
  it("reserves full detail for the viewed hotel without dropping economic phases", () => {
    expect(detailTierForHotel({ isViewed: true, isPlayerHotel: true })).toBe(
      "full",
    );
    expect(detailTierForHotel({ isViewed: false, isPlayerHotel: true })).toBe(
      "operational",
    );
    expect(detailTierForHotel({ isViewed: false, isPlayerHotel: false })).toBe(
      "aggregate",
    );
    expect(DETAIL_TIER_PHASES.aggregate).toContain("monthly");
  });
});

it("maps a real portfolio to one full, operational player and aggregate rival tiers", () => {
  expect(
    portfolioDetailTiers({
      viewedHotelId: "hotel.a",
      playerHotelIds: ["hotel.b", "hotel.a"],
      competitorHotelIds: ["hotel.rival"],
    }),
  ).toEqual({
    "hotel.a": "full",
    "hotel.b": "operational",
    "hotel.rival": "aggregate",
  });
});
