import { describe, expect, it } from "vitest";
import {
  UTILITY_KINDS,
  applyEfficiencyInvestment,
  createUtilityContracts,
  meterReading,
  outageConsequences,
  readMeters,
  startOutage,
  utilityBillMinor,
  wasteDisposalMinor,
} from "./consumption";
import { XorShift32 } from "../domain/rng";

describe("utility contracts and meters", () => {
  it("keeps energy, water and waste on separate contracts", () => {
    const contracts = createUtilityContracts();
    expect(UTILITY_KINDS).toEqual(["energy", "water", "waste"]);
    for (const kind of UTILITY_KINDS)
      expect(contracts[kind].unitPriceMinor).toBeGreaterThan(0);
    // There is no single "green score": each contract has its own price and
    // its own standing charge.
    expect(contracts.energy.unitPriceMinor).not.toBe(
      contracts.water.unitPriceMinor,
    );
  });

  it("bills the standing charge plus metered units, in whole Pfennig", () => {
    const contracts = createUtilityContracts();
    const bill = utilityBillMinor(contracts.energy, 1_000);
    expect(bill).toBe(
      contracts.energy.standingChargeMinor +
        contracts.energy.unitPriceMinor * 1_000,
    );
    expect(Number.isSafeInteger(bill)).toBe(true);
    expect(utilityBillMinor(contracts.energy, 0)).toBe(
      contracts.energy.standingChargeMinor,
    );
    expect(() => utilityBillMinor(contracts.energy, -1)).toThrow(/units/);
  });

  it("reads each meter as a cumulative total that never goes backwards", () => {
    const before = { energy: 1_000, water: 500, waste: 20 };
    const after = readMeters(before, { energy: 120, water: 45, waste: 3 });
    expect(after).toEqual({ energy: 1_120, water: 545, waste: 23 });
    expect(meterReading(after, "energy")).toBe(1_120);
    expect(() =>
      readMeters(before, { energy: -1, water: 0, waste: 0 }),
    ).toThrow(/energy/);
  });

  it("cuts consumption by the efficiency actually installed, and no more", () => {
    const contracts = createUtilityContracts();
    const improved = applyEfficiencyInvestment(contracts, {
      kind: "energy",
      savingBasisPoints: 1500,
    });
    expect(improved.energy.efficiencyBasisPoints).toBe(1500);
    // A second investment adds to the first but is capped: there is no free
    // hotel at the end of a long enough queue of upgrades.
    const twice = applyEfficiencyInvestment(improved, {
      kind: "energy",
      savingBasisPoints: 9000,
    });
    expect(twice.energy.efficiencyBasisPoints).toBe(6000);
    expect(utilityBillMinor(twice.energy, 1_000)).toBeLessThan(
      utilityBillMinor(contracts.energy, 1_000),
    );
  });

  it("prices waste by weight and by how much of it was sorted", () => {
    expect(wasteDisposalMinor({ kilos: 400, sortedBasisPoints: 0 })).toBe(
      40_000,
    );
    // Sorting is cheaper to dispose of, so it is an operational choice with a
    // number attached rather than a virtue score.
    expect(
      wasteDisposalMinor({ kilos: 400, sortedBasisPoints: 5000 }),
    ).toBeLessThan(wasteDisposalMinor({ kilos: 400, sortedBasisPoints: 0 }));
    expect(() =>
      wasteDisposalMinor({ kilos: 400, sortedBasisPoints: 10_001 }),
    ).toThrow(/sorted/);
  });

  it("gives an outage a cause, a duration and named consequences", () => {
    const outage = startOutage(
      { kind: "energy", atMinutes: 1440, cause: "substation fault" },
      new XorShift32(11),
    );
    expect(outage.kind).toBe("energy");
    expect(outage.cause).toBe("substation fault");
    expect(outage.minutes).toBeGreaterThan(0);
    // Same seed, same outage: an outage is a modelled event, not bad luck.
    expect(
      startOutage(
        { kind: "energy", atMinutes: 1440, cause: "substation fault" },
        new XorShift32(11),
      ).minutes,
    ).toBe(outage.minutes);

    const effects = outageConsequences(outage);
    expect(effects.affectedFacilities).toContain("facility.kitchen");
    expect(effects.roomsUnsellable).toBe(true);
    expect(effects.cause).toMatch(/substation fault/);
  });

  it("keeps a water outage's consequences different from an energy one", () => {
    const water = outageConsequences(
      startOutage({ kind: "water", atMinutes: 0, cause: "burst main" }),
    );
    const energy = outageConsequences(
      startOutage({ kind: "energy", atMinutes: 0, cause: "substation fault" }),
    );
    expect(water.affectedFacilities).not.toEqual(energy.affectedFacilities);
    expect(water.affectedFacilities).toContain("facility.laundry");
  });
});
