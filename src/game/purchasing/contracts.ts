import { compareIds } from "../domain/ids";
import {
  assertCount,
  assertNonNegativeMinor,
  safeProductMinor,
} from "../domain/units";
import { discountedUnitPriceMinor } from "../company/sharedServices";

/**
 * Supply as a relationship rather than a shop. A contract fixes a price and a
 * lead time; stock spoils; and a reorder rule that was right in January runs
 * the house out of linen in July. Central purchasing buys a better price and
 * gives up the local buyer's judgement — which is the trade, not a free win.
 */
export interface SupplierContract {
  id: string;
  supplierId: string;
  sku: string;
  unitPriceMinor: number;
  /** Days between placing an order and it arriving. */
  leadTimeDays: number;
  /** The smallest order the supplier will take. */
  minimumOrderQuantity: number;
  validFromDateKey: string;
  validToDateKey: string;
  /** Days the goods keep once delivered; null for things that do not spoil. */
  shelfLifeDays: number | null;
  /** Supply-chain sourcing tier: standard, regional or sustainable. */
  tier?: "standard" | "regional" | "sustainable";
}

/** A standing instruction the house reorders by, without being asked. */
export interface ReorderRule {
  sku: string;
  /** Order when free stock falls to this. */
  reorderPoint: number;
  /** How much to order when it does. */
  reorderQuantity: number;
  /** Whether headquarters places it, or the hotel does. */
  placedBy: "hotel" | "headquarters";
}

/** Stock that arrived on a day and will not keep forever. */
export interface StockLot {
  sku: string;
  quantity: number;
  receivedDateKey: string;
  expiresDateKey: string | null;
}

export interface ProcurementState {
  contracts: SupplierContract[];
  reorderRules: ReorderRule[];
  lots: StockLot[];
  /** Times the house ran out, with what it cost; never silently forgotten. */
  stockouts: { sku: string; dateKey: string; shortBy: number }[];
}

export function createProcurementState(): ProcurementState {
  return { contracts: [], reorderRules: [], lots: [], stockouts: [] };
}

export function signSupplierContract(
  state: ProcurementState,
  contract: SupplierContract,
): ProcurementState {
  if (state.contracts.some((c) => c.id === contract.id))
    throw new Error(`supplier contract ${contract.id} already exists`);
  assertNonNegativeMinor(contract.unitPriceMinor, "unit price");
  assertCount(contract.leadTimeDays, "lead time");
  assertCount(contract.minimumOrderQuantity, "minimum order quantity");
  if (contract.validToDateKey <= contract.validFromDateKey)
    throw new Error("a contract must end after it starts");
  if (
    state.contracts.some(
      (existing) =>
        existing.sku === contract.sku &&
        existing.validFromDateKey < contract.validToDateKey &&
        contract.validFromDateKey < existing.validToDateKey,
    )
  )
    throw new Error(
      `supplier contract overlaps an existing ${contract.sku} contract`,
    );
  return {
    ...state,
    contracts: [...state.contracts, { ...contract }].sort((a, b) =>
      compareIds(a.id, b.id),
    ),
  };
}

/**
 * The contract in force for a sku on a date. Where two overlap, the one that
 * started most recently wins — the later deal is the one the buyer actually
 * negotiated — rather than whichever happened to be stored first.
 */
export function contractForSku(
  state: ProcurementState,
  sku: string,
  dateKey: string,
): SupplierContract | null {
  return (
    state.contracts
      .filter(
        (c) =>
          c.sku === sku &&
          c.validFromDateKey <= dateKey &&
          dateKey < c.validToDateKey,
      )
      .sort(
        (a, b) =>
          compareIds(b.validFromDateKey, a.validFromDateKey) ||
          compareIds(a.id, b.id),
      )[0] ?? null
  );
}

/**
 * What an order actually costs. A contract price is the contract price; the
 * group's buying power comes off it, and the supplier's minimum is enforced
 * rather than quietly rounded away.
 */
export function orderCostMinor(
  contract: SupplierContract,
  quantity: number,
  groupDiscountBp = 0,
): number {
  assertCount(quantity, "order quantity");
  if (quantity < contract.minimumOrderQuantity)
    throw new Error(
      `${contract.supplierId} will not take fewer than ${contract.minimumOrderQuantity}`,
    );
  return safeProductMinor(
    quantity,
    discountedUnitPriceMinor(contract.unitPriceMinor, groupDiscountBp),
    `${contract.sku} order`,
  );
}

export function setReorderRule(
  state: ProcurementState,
  rule: ReorderRule,
): ProcurementState {
  assertCount(rule.reorderPoint, "reorder point");
  assertCount(rule.reorderQuantity, "reorder quantity");
  if (rule.reorderQuantity === 0)
    throw new Error("a reorder rule must order something");
  return {
    ...state,
    reorderRules: [
      ...state.reorderRules.filter((r) => r.sku !== rule.sku),
      rule,
    ].sort((a, b) => compareIds(a.sku, b.sku)),
  };
}

/**
 * What the standing orders would place today. Free stock is what is on the
 * shelf less what is already on its way, so a rule cannot order the same
 * shortfall twice while the first delivery is in transit.
 */
export function dueReorders(
  state: ProcurementState,
  input: { onHand: Record<string, number>; onOrder: Record<string, number> },
): { sku: string; quantity: number; placedBy: ReorderRule["placedBy"] }[] {
  return state.reorderRules
    .filter(
      (rule) =>
        (input.onHand[rule.sku] ?? 0) + (input.onOrder[rule.sku] ?? 0) <=
        rule.reorderPoint,
    )
    .map((rule) => ({
      sku: rule.sku,
      quantity: rule.reorderQuantity,
      placedBy: rule.placedBy,
    }));
}

export function receiveLot(
  state: ProcurementState,
  lot: StockLot,
): ProcurementState {
  assertCount(lot.quantity, "received quantity");
  return {
    ...state,
    lots: [...state.lots, { ...lot }].sort(
      (a, b) =>
        compareIds(a.sku, b.sku) ||
        compareIds(a.receivedDateKey, b.receivedDateKey),
    ),
  };
}

/**
 * Throws away what has gone off, and says how much. Spoilage that vanishes
 * silently is a rounding error the player can never learn from.
 */
export function expireStock(
  state: ProcurementState,
  dateKey: string,
): { state: ProcurementState; spoiled: Record<string, number> } {
  const spoiled: Record<string, number> = {};
  const kept: StockLot[] = [];
  for (const lot of state.lots)
    if (lot.expiresDateKey !== null && lot.expiresDateKey <= dateKey)
      spoiled[lot.sku] = (spoiled[lot.sku] ?? 0) + lot.quantity;
    else kept.push(lot);
  return { state: { ...state, lots: kept }, spoiled };
}

export function recordStockout(
  state: ProcurementState,
  input: { sku: string; dateKey: string; shortBy: number },
): ProcurementState {
  assertCount(input.shortBy, "stockout shortfall");
  return { ...state, stockouts: [...state.stockouts, { ...input }] };
}

/** Days a central order waits for the group's consolidation run. */
export const CONSOLIDATION_DELAY_DAYS = 3;

/**
 * The central-purchasing trade, stated plainly. Buying through the group is
 * cheaper per unit and slower to arrive, so a house that centralises
 * everything saves money and runs out more often.
 */
export function centralPurchasingTradeOff(
  contract: SupplierContract,
  groupDiscountBp: number,
): {
  localUnitPriceMinor: number;
  centralUnitPriceMinor: number;
  localLeadTimeDays: number;
  centralLeadTimeDays: number;
} {
  return {
    localUnitPriceMinor: contract.unitPriceMinor,
    centralUnitPriceMinor: discountedUnitPriceMinor(
      contract.unitPriceMinor,
      groupDiscountBp,
    ),
    localLeadTimeDays: contract.leadTimeDays,
    // A central order waits for the consolidation run.
    centralLeadTimeDays: contract.leadTimeDays + CONSOLIDATION_DELAY_DAYS,
  };
}

/**
 * Trade-offs for sustainable or regional supply choices across separate axes
 * (cost, waste sorting share, reputation delta, risk change), with no aggregate score.
 */
export function supplyChainTradeOff(contract: SupplierContract): {
  unitPriceMinor: number;
  sortedWasteShareBp: number;
  reputationDeltaBp: number;
  supplyRiskDeltaBp: number;
} {
  assertNonNegativeMinor(contract.unitPriceMinor, "unit price");
  const tier = contract.tier ?? "standard";
  switch (tier) {
    case "sustainable": {
      const product = safeProductMinor(contract.unitPriceMinor, 12_000, "sustainable unit price");
      return {
        unitPriceMinor: Math.round(product / 10_000),
        sortedWasteShareBp: 7000,
        reputationDeltaBp: 300,
        supplyRiskDeltaBp: -100,
      };
    }
    case "regional": {
      const product = safeProductMinor(contract.unitPriceMinor, 11_000, "regional unit price");
      return {
        unitPriceMinor: Math.round(product / 10_000),
        sortedWasteShareBp: 5000,
        reputationDeltaBp: 150,
        supplyRiskDeltaBp: -50,
      };
    }
    case "standard":
    default:
      return {
        unitPriceMinor: contract.unitPriceMinor,
        sortedWasteShareBp: 2500,
        reputationDeltaBp: 0,
        supplyRiskDeltaBp: 0,
      };
  }
}
