import { expect, it } from "vitest";
import { groupTargetVariance } from "./groupTargets";

it("compares a hotel GOPPAR result with the group target", () => {
  const variance = groupTargetVariance(
    {
      gopparMinor: 1_000,
      guestSatisfaction: 75,
      staffTurnoverBasisPoints: 1500,
      marketShareBasisPoints: 2000,
      brandStandard: 80,
    },
    {
      hotelId: "hotel.1",
      periodKey: "1991-01",
      roomRevenueMinor: 0,
      eventRevenueMinor: 0,
      otherRevenueMinor: 0,
      operatingExpenseMinor: 0,
      grossOperatingProfitMinor: 120_000,
      occupancyBasisPoints: 0,
      soldRoomNights: 0,
      availableRoomNights: 100,
      qualityStars: 3,
      cashNeedMinor: 0,
      renovationNeedMinor: 0,
    },
  );
  expect(variance).toMatchObject({ varianceMinor: 200, favourable: true });
});
