import { describe, expect, it } from "vitest";
import {
  UTILITY_KINDS,
  advanceEfficiencyProject,
  applyEfficiencyInvestment,
  createUtilityContracts,
  efficiencyInvestmentCostMinor,
  meterReading,
  outageConsequences,
  readMeters,
  repriceFloatingContract,
  signUtilityContract,
  startOutage,
  standingChargeMinor,
  utilityBillMinor,
  utilityUsageMinor,
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

  it("separates the metered usage from the monthly standing charge", () => {
    const contracts = createUtilityContracts();
    // Usage alone is what a daily billing run may charge; the standing charge
    // is owed once a month and would otherwise be charged thirty times.
    expect(utilityUsageMinor(contracts.energy, 1_000)).toBe(
      contracts.energy.unitPriceMinor * 1_000,
    );
    expect(utilityUsageMinor(contracts.energy, 0)).toBe(0);
    expect(standingChargeMinor(contracts.energy)).toBe(
      contracts.energy.standingChargeMinor,
    );

    const bill = utilityBillMinor(contracts.energy, 1_000);
    expect(bill).toBe(
      contracts.energy.standingChargeMinor +
        contracts.energy.unitPriceMinor * 1_000,
    );
    expect(Number.isSafeInteger(bill)).toBe(true);
    expect(() => utilityUsageMinor(contracts.energy, -1)).toThrow(/units/);
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

  it("prices waste off its own contract, by weight and by sorting", () => {
    const contracts = createUtilityContracts();
    expect(
      wasteDisposalMinor(contracts.waste, {
        kilos: 400,
        sortedBasisPoints: 0,
      }),
    ).toBe(400 * contracts.waste.unitPriceMinor);
    // Sorting is cheaper to dispose of, so it is an operational choice with a
    // number attached rather than a virtue score.
    expect(
      wasteDisposalMinor(contracts.waste, {
        kilos: 400,
        sortedBasisPoints: 5000,
      }),
    ).toBeLessThan(
      wasteDisposalMinor(contracts.waste, {
        kilos: 400,
        sortedBasisPoints: 0,
      }),
    );
    // Efficiency bought against the waste contract shows up on the bill.
    const efficient = applyEfficiencyInvestment(contracts, {
      kind: "waste",
      savingBasisPoints: 2000,
    });
    expect(
      wasteDisposalMinor(efficient.waste, {
        kilos: 400,
        sortedBasisPoints: 0,
      }),
    ).toBeLessThan(
      wasteDisposalMinor(contracts.waste, {
        kilos: 400,
        sortedBasisPoints: 0,
      }),
    );
    expect(() =>
      wasteDisposalMinor(contracts.waste, {
        kilos: 400,
        sortedBasisPoints: 10_001,
      }),
    ).toThrow(/sorted/);
  });

  it("validates and replaces utility contracts through signUtilityContract", () => {
    const contracts = createUtilityContracts();
    const updated = signUtilityContract(contracts, {
      kind: "energy",
      supplierId: "supplier.green_power",
      standingChargeMinor: 50_000,
      unitPriceMinor: 40,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      priceLock: "floating",
    });

    expect(updated.energy.supplierId).toBe("supplier.green_power");
    expect(updated.energy.priceLock).toBe("floating");
    expect(updated.energy.standingChargeMinor).toBe(50_000);
    expect(updated.energy.unitPriceMinor).toBe(40);

    expect(() =>
      signUtilityContract(contracts, {
        kind: "energy",
        supplierId: "s1",
        standingChargeMinor: 50_000,
        unitPriceMinor: 40,
        validFromDateKey: "1992-01-01",
        validToDateKey: "1991-01-01",
        priceLock: "fixed",
      }),
    ).toThrow(/end after it starts/);

    expect(() =>
      signUtilityContract(contracts, {
        kind: "energy",
        supplierId: "s1",
        standingChargeMinor: -1,
        unitPriceMinor: 40,
        validFromDateKey: "1991-01-01",
        validToDateKey: "1992-01-01",
        priceLock: "fixed",
      }),
    ).toThrow();

    // Invalid price lock
    expect(() =>
      signUtilityContract(contracts, {
        kind: "energy",
        supplierId: "s1",
        standingChargeMinor: 100,
        unitPriceMinor: 40,
        validFromDateKey: "1991-01-01",
        validToDateKey: "1992-01-01",
        priceLock: "invalid" as any,
      }),
    ).toThrow(/invalid price lock type/);

    // Efficiency exceeding MAX_EFFICIENCY_BP
    expect(() =>
      signUtilityContract(contracts, {
        kind: "energy",
        supplierId: "s1",
        standingChargeMinor: 100,
        unitPriceMinor: 40,
        validFromDateKey: "1991-01-01",
        validToDateKey: "1992-01-01",
        priceLock: "fixed",
        efficiencyBasisPoints: 7000,
      }),
    ).toThrow(/cannot exceed 6000/);

    // Omitted efficiency preserves existing installed efficiency
    const existingWithEfficiency = {
      ...contracts,
      energy: { ...contracts.energy, efficiencyBasisPoints: 1200 },
    };
    const preserved = signUtilityContract(existingWithEfficiency, {
      kind: "energy",
      supplierId: "supplier.new",
      standingChargeMinor: 500,
      unitPriceMinor: 30,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      priceLock: "fixed",
    });
    expect(preserved.energy.efficiencyBasisPoints).toBe(1200);
  });

  it("reprices floating contracts against world energy price index while leaving fixed contracts unchanged", () => {
    const contracts = createUtilityContracts();
    const floating = signUtilityContract(contracts, {
      kind: "energy",
      supplierId: "s1",
      standingChargeMinor: 45_000,
      unitPriceMinor: 100,
      validFromDateKey: "1991-01-01",
      validToDateKey: "1992-01-01",
      priceLock: "floating",
    });

    const repriced = repriceFloatingContract(floating.energy, 12_000);
    expect(repriced.unitPriceMinor).toBe(120);

    const fixedRepricing = repriceFloatingContract(contracts.energy, 12_000);
    expect(fixedRepricing.unitPriceMinor).toBe(contracts.energy.unitPriceMinor);

    expect(repriced.standingChargeMinor).toBe(floating.energy.standingChargeMinor);
    expect(repriced.efficiencyBasisPoints).toBe(floating.energy.efficiencyBasisPoints);
  });

  it("advances efficiency projects and computes CapEx costs safely", () => {
    const cost = efficiencyInvestmentCostMinor(1000);
    expect(cost).toBe(5_000_000);
    expect(Number.isSafeInteger(cost)).toBe(true);

    expect(() => efficiencyInvestmentCostMinor(-1)).toThrow();
    expect(() => efficiencyInvestmentCostMinor(10_000)).toThrow();

    const project = {
      id: "p1",
      kind: "energy" as const,
      savingBasisPoints: 1000,
      status: "planned" as const,
      remainingMonths: 2,
      costMinor: cost,
    };

    const step1 = advanceEfficiencyProject(project);
    expect(step1.remainingMonths).toBe(1);
    expect(step1.status).toBe("implementing");

    const step2 = advanceEfficiencyProject(step1);
    expect(step2.remainingMonths).toBe(0);
    expect(step2.status).toBe("complete");

    expect(() =>
      advanceEfficiencyProject({ ...project, remainingMonths: -1 }),
    ).toThrow(/whole and non-negative/);
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
    expect(effects.affectedFacilities).toContain("facility.elevator");
    expect(effects.affectedFacilities).not.toContain("facility.lifts");
    expect(effects.roomsUnsellable).toBe(true);
    expect(effects.cause).toMatch(/substation fault/);
  });

  it("mitigates energy outages when standby power is present", () => {
    const outage = startOutage({
      kind: "energy",
      atMinutes: 0,
      cause: "blackout",
    });

    const withoutStandby = outageConsequences(outage, false);
    expect(withoutStandby.roomsUnsellable).toBe(true);
    expect(withoutStandby.affectedFacilities).toEqual([
      "facility.elevator",
      "facility.kitchen",
      "facility.reception",
      "facility.wellness",
    ]);

    const withStandby = outageConsequences(outage, true);
    expect(withStandby.roomsUnsellable).toBe(false);
    expect(withStandby.affectedFacilities).toEqual(["facility.elevator"]);

    const waterOutage = startOutage({
      kind: "water",
      atMinutes: 0,
      cause: "pipe burst",
    });
    const waterWithStandby = outageConsequences(waterOutage, true);
    expect(waterWithStandby.roomsUnsellable).toBe(true);
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
