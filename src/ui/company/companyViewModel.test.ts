import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../game/simulation/initialState";
import { portfolioRows } from "./companyViewModel";

describe("portfolio rows", () => {
  it("projects authoritative city, quality, cash, and renovation fields", () => {
    const state = createInitialGameState(8);
    state.company.hotelResults[state.hotel.id] = {
      hotelId: state.hotel.id,
      periodKey: "1991-01",
      roomRevenueMinor: 1,
      eventRevenueMinor: 0,
      otherRevenueMinor: 2,
      operatingExpenseMinor: 3,
      grossOperatingProfitMinor: 4,
      occupancyBasisPoints: 5678,
      soldRoomNights: 5,
      availableRoomNights: 6,
      qualityStars: 3,
      cashNeedMinor: 700,
      renovationNeedMinor: 800,
    };

    expect(portfolioRows(state)[0]).toMatchObject({
      cityName: "Frankfurt",
      qualityStars: 3,
      cashNeedMinor: 700,
      renovationNeedMinor: 800,
    });
  });
});
