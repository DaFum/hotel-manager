import { describe, expect, it } from "vitest";
import {
  controlsCapex,
  createOperatingContract,
  monthlyOwnershipCashFlows,
  monthlyOwnershipPostings,
  ownsRealEstate,
  type OperatingModel,
} from "./models";

describe("ownership models", () => {
  it("charges lease rent and franchise fees through explicit contract rules", () => {
    expect(
      monthlyOwnershipCashFlows(
        { kind: "lease", monthlyRentMinor: 1_000_000 },
        8_000_000,
      ),
    ).toEqual([-1_000_000]);
    expect(
      monthlyOwnershipCashFlows(
        { kind: "franchise", royaltyBasisPoints: 500 },
        8_000_000,
      ),
    ).toEqual([-400_000]);
  });

  it("costs an owned hotel nothing in contract fees", () => {
    expect(monthlyOwnershipCashFlows({ kind: "owned" }, 8_000_000)).toEqual([]);
  });

  it("pays the operator a management fee out of the owner's revenue", () => {
    expect(
      monthlyOwnershipCashFlows(
        { kind: "management", managementFeeBasisPoints: 300 },
        8_000_000,
      ),
    ).toEqual([240_000]);
  });

  it("posts each contract flow to a named account rather than one lump", () => {
    expect(
      monthlyOwnershipPostings(
        { kind: "lease", monthlyRentMinor: 1_000_000 },
        8_000_000,
      ),
    ).toEqual([
      { account: "leaseRent", amountMinor: -1_000_000, memo: "lease rent" },
    ]);
    expect(
      monthlyOwnershipPostings(
        { kind: "franchise", royaltyBasisPoints: 500 },
        8_000_000,
      ),
    ).toEqual([
      {
        account: "franchiseRoyalty",
        amountMinor: -400_000,
        memo: "franchise royalty",
      },
    ]);
    expect(
      monthlyOwnershipPostings(
        { kind: "management", managementFeeBasisPoints: 300 },
        8_000_000,
      ),
    ).toEqual([
      {
        account: "managementFee",
        amountMinor: 240_000,
        memo: "management fee",
      },
    ]);
  });

  it("keeps money whole Pfennig when a fee does not divide evenly", () => {
    const [fee] = monthlyOwnershipCashFlows(
      { kind: "franchise", royaltyBasisPoints: 333 },
      1_000_001,
    );
    expect(Number.isSafeInteger(fee)).toBe(true);
    expect(fee).toBe(-33_300);
  });

  it("separates who owns the building from who controls investment", () => {
    expect(ownsRealEstate({ kind: "owned" })).toBe(true);
    expect(ownsRealEstate({ kind: "lease", monthlyRentMinor: 1 })).toBe(false);
    expect(
      ownsRealEstate({ kind: "management", managementFeeBasisPoints: 1 }),
    ).toBe(false);
    expect(controlsCapex({ kind: "owned" })).toBe(true);
    expect(controlsCapex({ kind: "lease", monthlyRentMinor: 1 })).toBe(true);
    // Under a management contract the operator runs someone else's asset.
    expect(
      controlsCapex({ kind: "management", managementFeeBasisPoints: 1 }),
    ).toBe(false);
    expect(controlsCapex({ kind: "franchise", royaltyBasisPoints: 1 })).toBe(
      true,
    );
  });

  it("refuses a contract whose terms are not whole declared units", () => {
    expect(() =>
      createOperatingContract({
        kind: "lease",
        monthlyRentMinor: 1_000_000.5,
      } as OperatingModel),
    ).toThrow(/rent/);
    expect(() =>
      createOperatingContract({
        kind: "franchise",
        royaltyBasisPoints: 20_000,
      }),
    ).toThrow(/royalty/);
    expect(() =>
      createOperatingContract({
        kind: "management",
        managementFeeBasisPoints: -1,
      }),
    ).toThrow(/management fee/);
  });

  it("refuses revenue that is not whole non-negative Pfennig", () => {
    expect(() =>
      monthlyOwnershipPostings(
        { kind: "franchise", royaltyBasisPoints: 500 },
        -1,
      ),
    ).toThrow(/room revenue/);
    expect(() =>
      monthlyOwnershipPostings(
        { kind: "management", managementFeeBasisPoints: 300 },
        1.5,
      ),
    ).toThrow(/room revenue/);
  });

  it("returns an owned contract unchanged, because it has no terms", () => {
    expect(createOperatingContract({ kind: "owned" })).toEqual({
      kind: "owned",
    });
  });

  it("accepts well-formed terms unchanged", () => {
    expect(
      createOperatingContract({ kind: "lease", monthlyRentMinor: 1_000_000 }),
    ).toEqual({ kind: "lease", monthlyRentMinor: 1_000_000 });
  });
});
