import { describe, expect, it } from "vitest";
import {
  MAX_PURCHASING_DISCOUNT_BP,
  discountedUnitPriceMinor,
  headquartersMonthlyCostMinor,
  purchasingDiscountBasisPoints,
  sharedServiceLoad,
} from "./sharedServices";

describe("shared services", () => {
  it("adds scale benefit with a capped purchasing discount", () => {
    expect(purchasingDiscountBasisPoints(1)).toBe(0);
    expect(purchasingDiscountBasisPoints(10)).toBeGreaterThan(0);
    expect(purchasingDiscountBasisPoints(100)).toBeLessThanOrEqual(1200);
  });

  it("never goes backwards as the group grows, and never exceeds the cap", () => {
    let previous = -1;
    for (const count of [0, 1, 2, 3, 4, 8, 16, 32, 64, 128, 4096]) {
      const discount = purchasingDiscountBasisPoints(count);
      expect(discount).toBeGreaterThanOrEqual(previous);
      expect(discount).toBeLessThanOrEqual(MAX_PURCHASING_DISCOUNT_BP);
      expect(Number.isSafeInteger(discount)).toBe(true);
      previous = discount;
    }
  });

  it("doubles the group for each further step, so growth pays less each time", () => {
    const two = purchasingDiscountBasisPoints(2);
    const four = purchasingDiscountBasisPoints(4);
    const eight = purchasingDiscountBasisPoints(8);
    expect(four - two).toBe(two);
    expect(eight - four).toBe(two);
  });

  it("applies the discount to a unit price in whole Pfennig, rounded down", () => {
    expect(discountedUnitPriceMinor(1_000, 500)).toBe(950);
    // 999 less 2.5 percent is 974.025; the fraction is never rounded up.
    expect(discountedUnitPriceMinor(999, 250)).toBe(974);
    expect(discountedUnitPriceMinor(1_000, 0)).toBe(1_000);
    expect(() => discountedUnitPriceMinor(1_000, 10_001)).toThrow(/discount/);
  });

  it("charges headquarters a fixed base plus a cost per hotel served", () => {
    const one = headquartersMonthlyCostMinor({
      hotelCount: 1,
      baseMinor: 4_000_000,
      perHotelMinor: 500_000,
    });
    const five = headquartersMonthlyCostMinor({
      hotelCount: 5,
      baseMinor: 4_000_000,
      perHotelMinor: 500_000,
    });
    expect(one).toBe(4_500_000);
    expect(five).toBe(6_500_000);
    // Overheads are real: a bigger group is cheaper per house, not free.
    expect(five / 5).toBeLessThan(one);
  });

  it("reports shared-service load per function so a bottleneck has a name", () => {
    expect(
      sharedServiceLoad({
        hotelCount: 9,
        capacityPerAnalyst: 4,
        analysts: 2,
      }),
    ).toEqual({
      demand: 9,
      capacity: 8,
      overloaded: true,
      cause: "9 hotels served by capacity for 8",
    });
    expect(
      sharedServiceLoad({ hotelCount: 4, capacityPerAnalyst: 4, analysts: 2 })
        .overloaded,
    ).toBe(false);
  });

  it("refuses a negative or fractional hotel count", () => {
    expect(() => purchasingDiscountBasisPoints(-1)).toThrow(/hotel count/);
    expect(() => purchasingDiscountBasisPoints(2.5)).toThrow(/hotel count/);
  });
});
