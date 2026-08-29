import { describe, expect, it } from "vitest";
import {
  createSalesState,
  signContract,
  rateForAccountMinor,
  activeContracts,
} from "./salesPipeline";

describe("salesPipeline contracts, blackout dates and cancellation terms", () => {
  const baseContractInput = {
    id: "contract.acme",
    accountName: "Acme Corp",
    segmentId: "segment.business",
    negotiatedRateMinor: 8_500,
    expectedRoomNights: 100,
    concessions: ["breakfast"],
    validFromDateKey: "1991-01-01",
    validToDateKey: "1991-12-31",
    blackoutDateKeys: ["1991-06-01", "1991-06-02"],
    paymentTermsDays: 30,
    cancellationDaysBeforeArrival: 7,
    cancellationFeeBasisPoints: 5000,
  };

  it("validates and signs contract with blackout dates and terms", () => {
    const state = signContract(createSalesState(), baseContractInput);
    expect(state.contracts).toHaveLength(1);
    const contract = state.contracts[0];
    expect(contract.blackoutDateKeys).toEqual(["1991-06-01", "1991-06-02"]);
    expect(contract.paymentTermsDays).toBe(30);
    expect(contract.cancellationDaysBeforeArrival).toBe(7);
    expect(contract.cancellationFeeBasisPoints).toBe(5000);
  });

  it("sorts blackout date keys and rejects duplicate blackout date keys", () => {
    // signContract automatically sorts blackout dates
    const state = signContract(createSalesState(), {
      ...baseContractInput,
      blackoutDateKeys: ["1991-06-02", "1991-06-01"],
    });
    expect(state.contracts[0].blackoutDateKeys).toEqual([
      "1991-06-01",
      "1991-06-02",
    ]);

    expect(() =>
      signContract(createSalesState(), {
        ...baseContractInput,
        blackoutDateKeys: ["1991-06-01", "1991-06-01"],
      }),
    ).toThrow("duplicate blackout dates");
  });

  it("rejects invalid payment terms or cancellation terms", () => {
    expect(() =>
      signContract(createSalesState(), {
        ...baseContractInput,
        paymentTermsDays: -1,
      }),
    ).toThrow("invalid payment terms days");

    expect(() =>
      signContract(createSalesState(), {
        ...baseContractInput,
        cancellationDaysBeforeArrival: -5,
      }),
    ).toThrow("invalid cancellation days before arrival");

    expect(() =>
      signContract(createSalesState(), {
        ...baseContractInput,
        cancellationFeeBasisPoints: 12_000_000,
      }),
    ).toThrow("invalid cancellation fee");
  });

  it("rateForAccountMinor returns rack rate on blackout dates and negotiated rate on valid dates", () => {
    const state = signContract(createSalesState(), baseContractInput);
    const rackRate = 12_000;

    // Valid non-blackout date within range
    expect(rateForAccountMinor(state, "Acme Corp", "1991-03-15", rackRate)).toBe(
      8_500,
    );

    // Blackout date within range
    expect(rateForAccountMinor(state, "Acme Corp", "1991-06-01", rackRate)).toBe(
      rackRate,
    );
    expect(rateForAccountMinor(state, "Acme Corp", "1991-06-02", rackRate)).toBe(
      rackRate,
    );

    // Date outside contract range
    expect(rateForAccountMinor(state, "Acme Corp", "1992-01-01", rackRate)).toBe(
      rackRate,
    );
  });

  it("activeContracts excludes contracts on blackout dates", () => {
    const state = signContract(createSalesState(), baseContractInput);
    expect(activeContracts(state, "1991-03-15")).toHaveLength(1);
    expect(activeContracts(state, "1991-06-01")).toHaveLength(0);
  });
});
