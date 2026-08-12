import { expect, it } from "vitest";
import {
  applyRatePlan,
  automaticRate,
  createRevenuePolicy,
  displacementCostMinor,
} from "./revenuePolicy";
it("enforces restrictions and bounded explainable automation", () => {
  const policy = createRevenuePolicy();
  policy.managerAuthorityBp = 500;
  policy.rules = [
    {
      id: "high",
      metric: "occupancy",
      threshold: 8000,
      rateChangeBp: 2000,
      priority: 1,
    },
  ];
  expect(automaticRate(10000, { occupancy: 9000 }, policy)).toEqual({
    rateMinor: 10500,
    causes: ["occupancy reached 9000", "bounded authority 500bp"],
    ruleId: "high",
  });
  expect(() =>
    applyRatePlan(
      10000,
      {
        id: "two-night",
        modifierBp: 9000,
        refundable: false,
        minimumStayNights: 2,
        maximumStayNights: null,
        closedToArrival: false,
        closedToDeparture: false,
        rateFloorMinor: 0,
        rateCeilingMinor: 50_000,
        closedChannelIds: [],
        minimumAdvanceBookingNights: 0,
      },
      1,
    ),
  ).toThrow(/restrictions/);
  expect(displacementCostMinor(2, 10000, 1000, 2000)).toBe(26000);

  expect(() => displacementCostMinor(-1, 1, 1, 1)).toThrow(/rooms/);
  expect(() =>
    applyRatePlan(
      100,
      {
        id: "bad",
        modifierBp: Number.NaN,
        refundable: true,
        minimumStayNights: 1,
        maximumStayNights: null,
        closedToArrival: false,
        closedToDeparture: false,
        rateFloorMinor: 0,
        rateCeilingMinor: 50_000,
        closedChannelIds: [],
        minimumAdvanceBookingNights: 0,
      },
      1,
    ),
  ).toThrow(/modifier/);
});
