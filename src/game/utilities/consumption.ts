import type { XorShift32 } from "../domain/rng";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
  safeProductMinor,
} from "../domain/units";

/**
 * Energy, water and waste, each on its own contract with its own price,
 * meter, efficiency and failure mode. They are deliberately not summed into a
 * sustainability score: a hotel that fixed its boiler and still floods its
 * laundry has done one thing and not the other, and the player should be able
 * to see exactly that.
 */
export const UTILITY_KINDS = ["energy", "water", "waste"] as const;

export type UtilityKind = (typeof UTILITY_KINDS)[number];

export interface UtilityContract {
  kind: UtilityKind;
  supplierId: string;
  /** Charged whether or not a single unit is drawn. */
  standingChargeMinor: number;
  unitPriceMinor: number;
  baseUnitPriceMinor?: number;
  /** Consumption avoided by efficiency actually installed, in basis points. */
  efficiencyBasisPoints: number;
  validFromDateKey: string;
  validToDateKey: string;
  priceLock: "fixed" | "floating";
}

export type UtilityContracts = Record<UtilityKind, UtilityContract>;

/** The most efficiency can ever take off a bill; the rest is physics. */
export const MAX_EFFICIENCY_BP = 6000;

export const MAX_UTILITY_STANDING_CHARGE_MINOR = 10_000_000_000;
export const MAX_UTILITY_UNIT_PRICE_MINOR = 1_000_000;

export function createUtilityContracts(): UtilityContracts {
  return {
    energy: {
      kind: "energy",
      supplierId: "supplier.utility.municipal.energy",
      standingChargeMinor: 45_000,
      unitPriceMinor: 32,
      baseUnitPriceMinor: 32,
      efficiencyBasisPoints: 0,
      validFromDateKey: "1991-01-01",
      validToDateKey: "2099-12-31",
      priceLock: "fixed",
    },
    water: {
      kind: "water",
      supplierId: "supplier.utility.municipal.water",
      standingChargeMinor: 18_000,
      unitPriceMinor: 11,
      baseUnitPriceMinor: 11,
      efficiencyBasisPoints: 0,
      validFromDateKey: "1991-01-01",
      validToDateKey: "2099-12-31",
      priceLock: "fixed",
    },
    waste: {
      kind: "waste",
      supplierId: "supplier.utility.municipal.waste",
      standingChargeMinor: 9_000,
      unitPriceMinor: 100,
      baseUnitPriceMinor: 100,
      efficiencyBasisPoints: 0,
      validFromDateKey: "1991-01-01",
      validToDateKey: "2099-12-31",
      priceLock: "fixed",
    },
  };
}

export function signUtilityContract(
  contracts: UtilityContracts,
  proposed: Omit<UtilityContract, "efficiencyBasisPoints"> &
    Partial<Pick<UtilityContract, "efficiencyBasisPoints">>,
): UtilityContracts {
  if (proposed.validToDateKey <= proposed.validFromDateKey)
    throw new Error("a contract must end after it starts");
  assertNonNegativeMinor(proposed.standingChargeMinor, "standing charge");
  if (proposed.standingChargeMinor > MAX_UTILITY_STANDING_CHARGE_MINOR)
    throw new Error(
      `standing charge exceeds maximum limit of ${MAX_UTILITY_STANDING_CHARGE_MINOR}`,
    );
  assertNonNegativeMinor(proposed.unitPriceMinor, "unit price");
  if (proposed.unitPriceMinor > MAX_UTILITY_UNIT_PRICE_MINOR)
    throw new Error(
      `unit price exceeds maximum limit of ${MAX_UTILITY_UNIT_PRICE_MINOR}`,
    );
  if (proposed.efficiencyBasisPoints !== undefined) {
    assertBasisPoints(proposed.efficiencyBasisPoints, "efficiency");
    if (proposed.efficiencyBasisPoints > MAX_EFFICIENCY_BP)
      throw new Error(
        `efficiency basis points cannot exceed ${MAX_EFFICIENCY_BP}`,
      );
  }
  if (proposed.priceLock !== "fixed" && proposed.priceLock !== "floating")
    throw new Error("invalid price lock type");

  const existing = contracts[proposed.kind];
  const efficiencyBasisPoints =
    proposed.efficiencyBasisPoints ??
    (existing ? existing.efficiencyBasisPoints : 0);

  const newContract: UtilityContract = {
    ...proposed,
    baseUnitPriceMinor: proposed.baseUnitPriceMinor ?? proposed.unitPriceMinor,
    efficiencyBasisPoints,
  };

  return {
    ...contracts,
    [proposed.kind]: newContract,
  };
}

export function repriceFloatingContract(
  contract: UtilityContract,
  energyPriceIndexBp: number,
): UtilityContract {
  if (contract.priceLock !== "floating") return contract;
  assertBasisPoints(energyPriceIndexBp, "energy price index");
  const base = contract.baseUnitPriceMinor ?? contract.unitPriceMinor;
  const unitPriceMinor = Math.max(
    0,
    Math.round((base * energyPriceIndexBp) / 10_000),
  );
  return {
    ...contract,
    baseUnitPriceMinor: base,
    unitPriceMinor,
  };
}

export interface EfficiencyProject {
  id: string;
  kind: UtilityKind;
  savingBasisPoints: number;
  status: "planned" | "implementing" | "complete";
  remainingMonths: number;
  costMinor: number;
}

export function advanceEfficiencyProject(
  project: EfficiencyProject,
): EfficiencyProject {
  if (
    !Number.isSafeInteger(project.remainingMonths) ||
    project.remainingMonths < 0
  )
    throw new Error("remaining project months must be whole and non-negative");
  const remainingMonths = Math.max(0, project.remainingMonths - 1);
  return {
    ...project,
    remainingMonths,
    status: remainingMonths === 0 ? "complete" : "implementing",
  };
}

export function efficiencyInvestmentCostMinor(
  savingBasisPoints: number,
): number {
  assertBasisPoints(savingBasisPoints, "saving basis points");
  if (savingBasisPoints <= 0 || savingBasisPoints > MAX_EFFICIENCY_BP)
    throw new Error("invalid saving basis points");
  return savingBasisPoints * 5_000;
}

/**
 * What the metered units cost. The standing charge is deliberately not in
 * here: it is owed once a month whatever the meters say, so adding it to a
 * usage calculation that runs daily would charge it thirty times over.
 */
export function utilityUsageMinor(
  contract: UtilityContract,
  units: number,
): number {
  assertCount(units, `${contract.kind} units`);
  assertNonNegativeMinor(contract.unitPriceMinor, "unit price");
  const billable = Math.trunc(
    (units * (10_000 - contract.efficiencyBasisPoints)) / 10_000,
  );
  return safeProductMinor(billable, contract.unitPriceMinor, `${contract.kind} usage`);
}

/** One month of the contract: the standing charge, whatever was drawn. */
export function standingChargeMinor(contract: UtilityContract): number {
  return assertNonNegativeMinor(
    contract.standingChargeMinor,
    "standing charge",
  );
}

/** A whole month billed at once: the standing charge plus the metered units. */
export function utilityBillMinor(
  contract: UtilityContract,
  units: number,
): number {
  return standingChargeMinor(contract) + utilityUsageMinor(contract, units);
}

export type MeterReadings = Record<UtilityKind, number>;

/** Meters only ever count up; a reading that fell is a fault, not a saving. */
export function readMeters(
  before: MeterReadings,
  consumed: MeterReadings,
): MeterReadings {
  const after = {} as MeterReadings;
  for (const kind of UTILITY_KINDS) {
    assertCount(before[kind], `${kind} meter`);
    assertCount(consumed[kind], `${kind} consumption`);
    after[kind] = before[kind] + consumed[kind];
  }
  return after;
}

export function meterReading(
  readings: MeterReadings,
  kind: UtilityKind,
): number {
  return readings[kind];
}

export function applyEfficiencyInvestment(
  contracts: UtilityContracts,
  investment: { kind: UtilityKind; savingBasisPoints: number },
): UtilityContracts {
  assertBasisPoints(investment.savingBasisPoints, "efficiency saving");
  const contract = contracts[investment.kind];
  return {
    ...contracts,
    [investment.kind]: {
      ...contract,
      efficiencyBasisPoints: Math.min(
        MAX_EFFICIENCY_BP,
        contract.efficiencyBasisPoints + investment.savingBasisPoints,
      ),
    },
  };
}

/** What sorted waste costs to give away, against the contract's list price. */
export const SORTED_WASTE_SHARE_BP = 4000;

/**
 * What the tip costs. Priced off the waste contract, so investing in
 * efficiency actually shows up on the bill rather than being ignored by a
 * hardcoded rate.
 */
export function wasteDisposalMinor(
  contract: UtilityContract,
  input: { kilos: number; sortedBasisPoints: number },
): number {
  assertCount(input.kilos, "waste kilos");
  assertBasisPoints(input.sortedBasisPoints, "sorted waste");
  if (input.sortedBasisPoints > 10_000) throw new Error("invalid sorted waste");
  const sortedKilos = Math.trunc(
    (input.kilos * input.sortedBasisPoints) / 10_000,
  );
  const sortedMinor = Math.trunc(
    (contract.unitPriceMinor * SORTED_WASTE_SHARE_BP) / 10_000,
  );
  return (
    utilityUsageMinor(contract, input.kilos - sortedKilos) +
    Math.trunc(
      (sortedKilos * sortedMinor * (10_000 - contract.efficiencyBasisPoints)) /
        10_000,
    )
  );
}

export interface UtilityOutage {
  kind: UtilityKind;
  cause: string;
  atMinutes: number;
  minutes: number;
}

const MIN_OUTAGE_MINUTES = 60;
const OUTAGE_SPREAD_MINUTES = 480;

/**
 * Starts an outage. Its length is drawn from the failures stream when one is
 * supplied, so a power cut never shifts the sequence guest demand will draw
 * from next.
 */
export function startOutage(
  input: { kind: UtilityKind; atMinutes: number; cause: string },
  failures?: XorShift32,
): UtilityOutage {
  return {
    ...input,
    minutes: failures
      ? MIN_OUTAGE_MINUTES + (failures.nextUint32() % OUTAGE_SPREAD_MINUTES)
      : MIN_OUTAGE_MINUTES,
  };
}

export interface OutageConsequences {
  affectedFacilities: string[];
  roomsUnsellable: boolean;
  cause: string;
}

/**
 * What actually stops working. Each utility takes down different parts of the
 * house, so the player fixes the fault rather than a generic penalty.
 */
export function outageConsequences(
  outage: UtilityOutage,
  standbyPower?: boolean | { active: boolean },
): OutageConsequences {
  const hasStandby =
    typeof standbyPower === "boolean"
      ? standbyPower
      : Boolean(standbyPower?.active);
  const facilities: Record<UtilityKind, string[]> = {
    energy:
      hasStandby && outage.kind === "energy"
        ? ["facility.elevator"]
        : [
            "facility.elevator",
            "facility.kitchen",
            "facility.reception",
            "facility.wellness",
          ],
    water: ["facility.kitchen", "facility.laundry", "facility.wellness"],
    waste: ["facility.kitchen"],
  };
  return {
    affectedFacilities: [...facilities[outage.kind]].sort(),
    // Guests cannot be sold a room with no power and no water; waste is a
    // problem for the kitchen long before it is a problem for a bedroom.
    roomsUnsellable:
      outage.kind === "energy" ? !hasStandby : outage.kind !== "waste",
    cause: `${outage.kind} outage: ${outage.cause} for ${outage.minutes} minutes`,
  };
}
