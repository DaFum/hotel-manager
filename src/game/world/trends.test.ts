import { expect, it } from "vitest";
import { segmentDemandBp, trendDemandForSegment } from "./trends";
it("applies segment affinity and exposes stable causes", () => {
  expect(segmentDemandBp(7000, 12000)).toBeGreaterThan(7000);
  expect(
    trendDemandForSegment(
      [
        {
          id: "remote-work",
          adoptionBp: 5000,
          segmentAffinityBp: { business: 12000 },
        },
      ],
      "business",
    ),
  ).toEqual({ demandBp: 11000, causes: ["remote-work:1000"] });

  expect(() => segmentDemandBp(Number.NaN, 10_000)).toThrow(/global adoption/);
  expect(() => segmentDemandBp(5_000, 20_001)).toThrow(/affinity/);
});
