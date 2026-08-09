import { describe, expect, it } from "vitest";
import {
  fundHotel,
  sweepToHeadquarters,
  transferInternalFunding,
} from "./internalFunding";
import {
  consolidatedCashMinor,
  createTreasury,
  currencyExposureMinor,
  openHotelAccount,
  overdrawnHotels,
} from "./treasury";

describe("internal funding", () => {
  it("moves cash without changing consolidated group cash", () => {
    const result = transferInternalFunding(
      { fromMinor: 10_000_000, toMinor: 1_000_000 },
      2_000_000,
    );
    expect(result).toEqual({ fromMinor: 8_000_000, toMinor: 3_000_000 });
    expect(result.fromMinor + result.toMinor).toBe(11_000_000);
  });

  it("refuses a transfer headquarters cannot fund, leaving balances alone", () => {
    const balances = { fromMinor: 1_000_000, toMinor: 0 };
    expect(() => transferInternalFunding(balances, 1_000_001)).toThrow(
      /invalid transfer/,
    );
    expect(() => transferInternalFunding(balances, -1)).toThrow(
      /invalid transfer/,
    );
    expect(balances).toEqual({ fromMinor: 1_000_000, toMinor: 0 });
  });

  it("rejects invalid balances and an unsafe destination balance", () => {
    expect(() =>
      transferInternalFunding({ fromMinor: -1, toMinor: 0 }, 0),
    ).toThrow(/invalid transfer/);
    expect(() =>
      transferInternalFunding({ fromMinor: 1, toMinor: -1 }, 0),
    ).toThrow(/invalid transfer/);
    expect(() =>
      transferInternalFunding(
        { fromMinor: 1, toMinor: Number.MAX_SAFE_INTEGER },
        1,
      ),
    ).toThrow(/invalid transfer/);
  });

  it("funds a hotel account through the treasury and conserves group cash", () => {
    let treasury = openHotelAccount(
      createTreasury({ hqMinor: 10_000_000, reportingCurrency: "DEM" }),
      "hotel.frankfurt.1",
      1_000_000,
    );
    const before = consolidatedCashMinor(treasury);
    treasury = fundHotel(treasury, "hotel.frankfurt.1", 2_000_000);
    expect(treasury.hqMinor).toBe(8_000_000);
    expect(treasury.hotelCashMinor["hotel.frankfurt.1"]).toBe(3_000_000);
    expect(consolidatedCashMinor(treasury)).toBe(before);
  });

  it("sweeps surplus cash back up without overdrawing the hotel", () => {
    let treasury = openHotelAccount(
      createTreasury({ hqMinor: 0, reportingCurrency: "DEM" }),
      "hotel.frankfurt.1",
      5_000_000,
    );
    treasury = sweepToHeadquarters(treasury, "hotel.frankfurt.1", 4_000_000);
    expect(treasury.hqMinor).toBe(4_000_000);
    expect(treasury.hotelCashMinor["hotel.frankfurt.1"]).toBe(1_000_000);
    expect(() =>
      sweepToHeadquarters(treasury, "hotel.frankfurt.1", 1_000_001),
    ).toThrow(/invalid transfer/);
  });

  it("refuses to fund a hotel that has no treasury account", () => {
    const treasury = createTreasury({
      hqMinor: 10_000_000,
      reportingCurrency: "DEM",
    });
    expect(() => fundHotel(treasury, "hotel.nowhere", 1)).toThrow(
      /no treasury/,
    );
  });

  it("keeps an overdrawn house visible rather than netting it away", () => {
    let treasury = openHotelAccount(
      createTreasury({ hqMinor: 10_000_000, reportingCurrency: "DEM" }),
      "hotel.frankfurt.1",
      -500_000,
    );
    treasury = openHotelAccount(treasury, "hotel.munich.1", 2_000_000);
    expect(overdrawnHotels(treasury)).toEqual(["hotel.frankfurt.1"]);
    expect(consolidatedCashMinor(treasury)).toBe(11_500_000);
  });

  it("reports currency exposure per currency, not as one net number", () => {
    let treasury = openHotelAccount(
      createTreasury({ hqMinor: 10_000_000, reportingCurrency: "DEM" }),
      "hotel.frankfurt.1",
      1_000_000,
    );
    treasury = openHotelAccount(treasury, "hotel.vienna.1", 3_000_000);
    expect(
      currencyExposureMinor(treasury, { "hotel.vienna.1": "ATS" }),
    ).toEqual({ DEM: 11_000_000, ATS: 3_000_000 });
  });
});
