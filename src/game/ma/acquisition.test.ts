import { describe, expect, it } from "vitest";
import {
  acquisitionCostMinor,
  createAcquisitionTarget,
  executeAcquisition,
} from "./acquisition";
import { runDueDiligence } from "./dueDiligence";

describe("acquisition transaction", () => {
  it("leaves state unchanged when cash is insufficient", () => {
    const state = { cashMinor: 1_000_000, hotelIds: ["hotel.a"] };
    expect(() =>
      executeAcquisition(state, {
        hotelId: "hotel.b",
        priceMinor: 2_000_000,
      }),
    ).toThrow(/insufficient cash/);
    expect(state).toEqual({ cashMinor: 1_000_000, hotelIds: ["hotel.a"] });
  });

  it("leaves state unchanged when the group already owns the hotel", () => {
    const state = { cashMinor: 10_000_000, hotelIds: ["hotel.a"] };
    expect(() =>
      executeAcquisition(state, { hotelId: "hotel.a", priceMinor: 1 }),
    ).toThrow(/already owned/);
    expect(state).toEqual({ cashMinor: 10_000_000, hotelIds: ["hotel.a"] });
  });

  it("completes cash and ownership together or not at all", () => {
    const state = { cashMinor: 10_000_000, hotelIds: ["hotel.a"] };
    const after = executeAcquisition(state, {
      hotelId: "hotel.b",
      priceMinor: 4_000_000,
    });
    expect(after).toEqual({
      cashMinor: 6_000_000,
      hotelIds: ["hotel.a", "hotel.b"],
    });
    // The original is untouched: the transaction returns a new state.
    expect(state).toEqual({ cashMinor: 10_000_000, hotelIds: ["hotel.a"] });
  });

  it("refuses a price that is not whole Pfennig", () => {
    const state = { cashMinor: 10_000_000, hotelIds: [] };
    expect(() =>
      executeAcquisition(state, { hotelId: "hotel.b", priceMinor: -1 }),
    ).toThrow(/price/);
    expect(() =>
      executeAcquisition(state, { hotelId: "hotel.b", priceMinor: 1.5 }),
    ).toThrow(/price/);
  });

  it("adds the debt it assumes and the diligence it bought to the cash cost", () => {
    const report = runDueDiligence({ areas: ["building"], findings: [] });
    expect(
      acquisitionCostMinor({
        priceMinor: 100_000_000,
        debtRepaidMinor: 30_000_000,
        diligenceCostMinor: report.costMinor,
      }),
    ).toBe(131_500_000);
  });

  it("describes a target with the terms an offer is actually made against", () => {
    const target = createAcquisitionTarget({
      id: "target.wiesbaden.1",
      hotelId: "hotel.wiesbaden.1",
      name: "Kurpark Hof",
      rooms: 84,
      askingPriceMinor: 120_000_000,
      annualGopMinor: 18_000_000,
      debtAssumedMinor: 30_000_000,
      renovationNeedMinor: 15_000_000,
      hiddenFindings: [
        { area: "staff", description: "back pay", costMinor: 2_000_000 },
      ],
    });
    expect(target.status).toBe("available");
    expect(target.hiddenFindings).toHaveLength(1);
    expect(() => createAcquisitionTarget({ ...target, rooms: 0 })).toThrow(
      /rooms/,
    );
  });
});
