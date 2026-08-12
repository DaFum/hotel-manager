import { describe, expect, it } from "vitest";
import {
  ANCILLARY_REVENUE_SHARE_BP,
  adrForAnnualGopMinor,
  adrForAnnualRoomRevenueMinor,
  cashNeedForLossMinor,
  managedQualityStars,
  managedRenovationNeedMinor,
} from "./managedHotels";
import { createTreasury, openHotelAccount } from "../treasury/treasury";

/**
 * The stabilised annual model the ADR helper is the inverse of: a full year at
 * the stated occupancy, ancillary revenue on top, and the GOP margin applied to
 * the total. Written out here so the round trip is checked against the model
 * rather than against the helper's own arithmetic.
 */
function annualGopMinor(input: {
  adrMinor: number;
  rooms: number;
  occupancyBasisPoints: number;
  gopMarginBasisPoints: number;
}): number {
  const soldRoomNights = Math.trunc(
    (input.rooms * 365 * input.occupancyBasisPoints) / 10_000,
  );
  const roomRevenueMinor = soldRoomNights * input.adrMinor;
  const revenueMinor =
    roomRevenueMinor +
    Math.trunc((roomRevenueMinor * ANCILLARY_REVENUE_SHARE_BP) / 10_000);
  return Math.trunc((revenueMinor * input.gopMarginBasisPoints) / 10_000);
}

describe("the rate a managed house has to achieve", () => {
  it("reaches the profit it was asked for rather than landing under it", () => {
    // Truncating each inverse step in turn lands a Pfennig or two short, and a
    // house underwritten on that rate misses its own number every month.
    const cases = [
      { annualGopMinor: 1_234_567, rooms: 60, occ: 6_000, margin: 2_500 },
      { annualGopMinor: 9_999_999, rooms: 120, occ: 7_300, margin: 3_100 },
      { annualGopMinor: 1, rooms: 40, occ: 5_500, margin: 1_800 },
      { annualGopMinor: 50_000_000, rooms: 250, occ: 8_100, margin: 4_000 },
    ];
    for (const c of cases) {
      const adrMinor = adrForAnnualGopMinor({
        annualGopMinor: c.annualGopMinor,
        rooms: c.rooms,
        occupancyBasisPoints: c.occ,
        gopMarginBasisPoints: c.margin,
      });
      expect(Number.isSafeInteger(adrMinor)).toBe(true);
      expect(
        annualGopMinor({
          adrMinor,
          rooms: c.rooms,
          occupancyBasisPoints: c.occ,
          gopMarginBasisPoints: c.margin,
        }),
      ).toBeGreaterThanOrEqual(c.annualGopMinor);
    }
  });

  it("returns nothing when there is no year to earn it in", () => {
    const none = {
      annualGopMinor: 1_000_000,
      gopMarginBasisPoints: 2_500,
      occupancyBasisPoints: 6_000,
    };
    expect(adrForAnnualGopMinor({ ...none, rooms: 0 })).toBe(0);
    expect(
      adrForAnnualGopMinor({ ...none, rooms: 60, occupancyBasisPoints: 0 }),
    ).toBe(0);
    expect(
      adrForAnnualGopMinor({ ...none, rooms: 60, gopMarginBasisPoints: 0 }),
    ).toBe(0);
    expect(
      adrForAnnualGopMinor({ ...none, rooms: 60, annualGopMinor: 0 }),
    ).toBe(0);
  });

  it("refuses numbers no house could have produced", () => {
    const valid = {
      annualGopMinor: 1_000_000,
      rooms: 60,
      occupancyBasisPoints: 6_000,
      gopMarginBasisPoints: 2_500,
    };
    expect(() =>
      adrForAnnualGopMinor({ ...valid, annualGopMinor: -1 }),
    ).toThrow(/annual gop/);
    expect(() =>
      adrForAnnualGopMinor({ ...valid, annualGopMinor: 1.5 }),
    ).toThrow(/annual gop/);
    expect(() =>
      adrForAnnualGopMinor({ ...valid, annualGopMinor: Number.NaN }),
    ).toThrow(/annual gop/);
    expect(() =>
      adrForAnnualGopMinor({ ...valid, occupancyBasisPoints: 10_001 }),
    ).toThrow(/occupancy/);
    expect(() =>
      adrForAnnualGopMinor({ ...valid, gopMarginBasisPoints: -1 }),
    ).toThrow(/gop margin/);
    expect(() =>
      adrForAnnualRoomRevenueMinor({
        annualRoomRevenueMinor: Number.NaN,
        rooms: 60,
        occupancyBasisPoints: 6_000,
      }),
    ).toThrow(/annual room revenue/);
    expect(() =>
      adrForAnnualRoomRevenueMinor({
        annualRoomRevenueMinor: 1_000_000,
        rooms: 60,
        occupancyBasisPoints: 10_001,
      }),
    ).toThrow(/occupancy/);
  });
});

describe("managed hotel portfolio signals", () => {
  const hotel = {
    hotelId: "hotel.test",
    name: "Test Hotel",
    cityId: "city.frankfurt",
    rooms: 60,
    adrMinor: 12_000,
    occupancyBasisPoints: 6500,
    gopMarginBasisPoints: 2500,
    openedDateKey: "1981-01-01",
  };

  it("reports only the part of a loss the hotel's balance cannot fund", () => {
    const treasury = openHotelAccount(
      createTreasury({ hqMinor: 0, reportingCurrency: "DEM" }),
      hotel.hotelId,
      300_000,
    );
    expect(cashNeedForLossMinor(treasury, hotel.hotelId, -500_000)).toBe(
      200_000,
    );
  });

  it("increases renovation need with age, size, and weaker margins", () => {
    const base = managedRenovationNeedMinor(hotel, "1991-01-01");
    expect(
      managedRenovationNeedMinor({ ...hotel, rooms: 120 }, "1991-01-01"),
    ).toBeGreaterThan(base);
    expect(
      managedRenovationNeedMinor(
        { ...hotel, openedDateKey: "1971-01-01" },
        "1991-01-01",
      ),
    ).toBeGreaterThan(base);
    expect(
      managedRenovationNeedMinor(
        { ...hotel, gopMarginBasisPoints: 1000 },
        "1991-01-01",
      ),
    ).toBeGreaterThan(base);
  });

  it("tiers quality from the three aggregate trading measures", () => {
    expect(
      managedQualityStars({
        gopMarginBasisPoints: 3500,
        occupancyBasisPoints: 8000,
        adrMinor: 20_000,
      }),
    ).toBe(5);
  });
});
