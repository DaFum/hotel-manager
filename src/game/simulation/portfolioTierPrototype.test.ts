import { expect, it } from "vitest";
import { prototypePortfolioDetailTiers } from "./portfolioTierPrototype";

it("selects tiers from the viewed hotel and player-owned set", () => {
  expect(
    prototypePortfolioDetailTiers({
      viewedHotelId: "hotel.frankfurt.flagship",
      playerHotelIds: ["hotel.munich.1", "hotel.frankfurt.flagship"],
      hotelIds: ["hotel.rival.1", "hotel.munich.1", "hotel.frankfurt.flagship"],
    }),
  ).toEqual({
    "hotel.frankfurt.flagship": "full",
    "hotel.munich.1": "operational",
    "hotel.rival.1": "aggregate",
  });
});
