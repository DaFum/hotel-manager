import { compareIds } from "../domain/ids";
import {
  assertCount,
  assertMinor,
  assertNonNegativeMinor,
} from "../domain/units";
import type { DueDiligenceFinding } from "./dueDiligence";

/**
 * Buying a hotel is one transaction. Cash leaves and ownership arrives
 * together, or neither happens: a half-completed acquisition would leave the
 * group paying for a house it does not have, and no later correction can find
 * that money again.
 */
export interface AcquisitionState {
  cashMinor: number;
  hotelIds: string[];
}

export interface AcquisitionDeal {
  hotelId: string;
  priceMinor: number;
}

export function executeAcquisition(
  state: AcquisitionState,
  deal: AcquisitionDeal,
): AcquisitionState {
  // Every check happens before the first write, so the throw path cannot have
  // left anything behind to undo.
  if (!Number.isSafeInteger(deal.priceMinor) || deal.priceMinor < 0)
    throw new Error("invalid acquisition price");
  if (state.hotelIds.includes(deal.hotelId))
    throw new Error(`hotel ${deal.hotelId} is already owned`);
  if (deal.priceMinor > state.cashMinor)
    throw new Error("insufficient cash for the acquisition");
  return {
    cashMinor: state.cashMinor - deal.priceMinor,
    hotelIds: [...state.hotelIds, deal.hotelId].sort(compareIds),
  };
}

/**
 * What the deal actually costs in cash on the day: the price, the seller's
 * debt the buyer chooses to clear, and the diligence already paid for.
 */
export function acquisitionCostMinor(input: {
  priceMinor: number;
  debtRepaidMinor: number;
  diligenceCostMinor: number;
}): number {
  assertNonNegativeMinor(input.priceMinor, "acquisition price");
  assertNonNegativeMinor(input.debtRepaidMinor, "debt repaid");
  assertNonNegativeMinor(input.diligenceCostMinor, "diligence cost");
  return input.priceMinor + input.debtRepaidMinor + input.diligenceCostMinor;
}

export type AcquisitionTargetStatus = "available" | "acquired" | "withdrawn";

/**
 * A house on the market. Its hidden findings are authoritative state that
 * only diligence reveals: the world knows what is wrong with the building
 * whether or not the buyer paid to find out.
 */
export interface AcquisitionTarget {
  id: string;
  hotelId: string;
  name: string;
  rooms: number;
  askingPriceMinor: number;
  annualGopMinor: number;
  debtAssumedMinor: number;
  renovationNeedMinor: number;
  hiddenFindings: DueDiligenceFinding[];
  status: AcquisitionTargetStatus;
}

export function createAcquisitionTarget(input: {
  id: string;
  hotelId: string;
  name: string;
  rooms: number;
  askingPriceMinor: number;
  annualGopMinor: number;
  debtAssumedMinor: number;
  renovationNeedMinor: number;
  hiddenFindings?: readonly DueDiligenceFinding[];
}): AcquisitionTarget {
  if (!input.id) throw new Error("an acquisition target id is required");
  if (!input.hotelId) throw new Error("a target hotel id is required");
  if (input.rooms <= 0) throw new Error("invalid rooms");
  assertCount(input.rooms, "rooms");
  assertNonNegativeMinor(input.askingPriceMinor, "asking price");
  assertMinor(input.annualGopMinor, "annual gop");
  assertNonNegativeMinor(input.debtAssumedMinor, "debt assumed");
  assertNonNegativeMinor(input.renovationNeedMinor, "renovation need");
  return {
    id: input.id,
    hotelId: input.hotelId,
    name: input.name,
    rooms: input.rooms,
    askingPriceMinor: input.askingPriceMinor,
    annualGopMinor: input.annualGopMinor,
    debtAssumedMinor: input.debtAssumedMinor,
    renovationNeedMinor: input.renovationNeedMinor,
    hiddenFindings: [...(input.hiddenFindings ?? [])],
    status: "available",
  };
}

export function markTargetStatus(
  targets: readonly AcquisitionTarget[],
  id: string,
  status: AcquisitionTargetStatus,
): AcquisitionTarget[] {
  const target = targets.find((t) => t.id === id);
  if (!target) throw new Error(`unknown acquisition target ${id}`);
  if (target.status !== "available")
    throw new Error(`acquisition target ${id} is already ${target.status}`);
  return targets.map((t) => (t.id === id ? { ...t, status } : t));
}
