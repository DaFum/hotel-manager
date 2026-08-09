import type { XorShift32 } from "../domain/rng";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
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
  /** Charged whether or not a single unit is drawn. */
  standingChargeMinor: number;
  unitPriceMinor: number;
  /** Consumption avoided by efficiency actually installed, in basis points. */
  efficiencyBasisPoints: number;
}

export type UtilityContracts = Record<UtilityKind, UtilityContract>;

/** The most efficiency can ever take off a bill; the rest is physics. */
export const MAX_EFFICIENCY_BP = 6000;

export function createUtilityContracts(): UtilityContracts {
  return {
    energy: {
      kind: "energy",
      standingChargeMinor: 45_000,
      unitPriceMinor: 32,
      efficiencyBasisPoints: 0,
    },
    water: {
      kind: "water",
      standingChargeMinor: 18_000,
      unitPriceMinor: 11,
      efficiencyBasisPoints: 0,
    },
    waste: {
      kind: "waste",
      standingChargeMinor: 9_000,
      unitPriceMinor: 100,
      efficiencyBasisPoints: 0,
    },
  };
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
  return billable * contract.unitPriceMinor;
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
export function outageConsequences(outage: UtilityOutage): OutageConsequences {
  const facilities: Record<UtilityKind, string[]> = {
    energy: [
      "facility.kitchen",
      "facility.lifts",
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
    roomsUnsellable: outage.kind !== "waste",
    cause: `${outage.kind} outage: ${outage.cause} for ${outage.minutes} minutes`,
  };
}
