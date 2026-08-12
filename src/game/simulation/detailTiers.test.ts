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

it("bounds operational player hotels and aggregates the deterministic remainder", () => {
  expect(
    portfolioDetailTiers({
      viewedHotelId: "hotel.5",
      playerHotelIds: ["hotel.5", "hotel.4", "hotel.3", "hotel.2", "hotel.1"],
      competitorHotelIds: [],
      operationalHotelLimit: 2,
    }),
  ).toEqual({
    "hotel.1": "operational",
    "hotel.2": "operational",
    "hotel.3": "aggregate",
    "hotel.4": "aggregate",
    "hotel.5": "full",
  });
});
