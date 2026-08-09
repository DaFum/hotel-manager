import { compareIds } from "../domain/ids";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";

/**
 * Corporate sales: the negotiated half of the business. A rate agreed with an
 * account is a promise the hotel has to keep all year, so a good negotiation
 * is one the hotel can still afford in a strong month.
 */
export type LeadStage = "lead" | "qualified" | "proposed" | "won" | "lost";

export interface SalesLead {
  id: string;
  accountName: string;
  segmentId: string;
  /** Room nights the account expects to place over the contract year. */
  expectedRoomNights: number;
  stage: LeadStage;
}

export interface NegotiatedContract {
  id: string;
  accountName: string;
  segmentId: string;
  /** The rate the account pays, whatever the house is asking that day. */
  negotiatedRateMinor: number;
  expectedRoomNights: number;
  /** Extras thrown in to win it: breakfast, late checkout, meeting space. */
  concessions: string[];
  validFromDateKey: string;
  validToDateKey: string;
  /** Whether the account has said it will come back next year. */
  renewalIntent: "unknown" | "renewing" | "leaving";
}

export interface SalesState {
  leads: SalesLead[];
  contracts: NegotiatedContract[];
}

export function createSalesState(): SalesState {
  return { leads: [], contracts: [] };
}

export function addLead(state: SalesState, lead: SalesLead): SalesState {
  if (state.leads.some((l) => l.id === lead.id))
    throw new Error(`lead ${lead.id} already exists`);
  assertCount(lead.expectedRoomNights, "expected room nights");
  return {
    ...state,
    leads: [...state.leads, lead].sort((a, b) => compareIds(a.id, b.id)),
  };
}

/** Stages only ever move forwards, so a pipeline report cannot be gamed. */
const STAGE_ORDER: LeadStage[] = [
  "lead",
  "qualified",
  "proposed",
  "won",
  "lost",
];

export function advanceLead(
  state: SalesState,
  leadId: string,
  stage: LeadStage,
): SalesState {
  const lead = state.leads.find((l) => l.id === leadId);
  if (!lead) throw new Error(`unknown lead ${leadId}`);
  if (lead.stage === "won" || lead.stage === "lost")
    throw new Error(`lead ${leadId} is already ${lead.stage}`);
  if (
    stage !== "lost" &&
    STAGE_ORDER.indexOf(stage) <= STAGE_ORDER.indexOf(lead.stage)
  )
    throw new Error("a lead cannot move backwards through the pipeline");
  return {
    ...state,
    leads: state.leads.map((l) => (l.id === leadId ? { ...l, stage } : l)),
  };
}

export function signContract(
  state: SalesState,
  contract: NegotiatedContract,
): SalesState {
  if (state.contracts.some((c) => c.id === contract.id))
    throw new Error(`contract ${contract.id} already exists`);
  assertNonNegativeMinor(contract.negotiatedRateMinor, "negotiated rate");
  assertCount(contract.expectedRoomNights, "expected room nights");
  if (contract.validToDateKey <= contract.validFromDateKey)
    throw new Error("a contract must end after it starts");
  return {
    ...state,
    contracts: [...state.contracts, { ...contract }].sort((a, b) =>
      compareIds(a.id, b.id),
    ),
  };
}

export function activeContracts(
  state: SalesState,
  dateKey: string,
): NegotiatedContract[] {
  return state.contracts.filter(
    (c) => c.validFromDateKey <= dateKey && dateKey < c.validToDateKey,
  );
}

/**
 * Whether the account is worth having. A negotiated rate below the cost of
 * servicing the room is a loss the hotel has agreed to make repeatedly, and
 * the concessions are part of that cost.
 */
export function contractProfitabilityMinor(
  contract: NegotiatedContract,
  costs: { variableCostPerNightMinor: number; concessionCostMinor: number },
): number {
  assertNonNegativeMinor(
    costs.variableCostPerNightMinor,
    "variable cost per night",
  );
  assertNonNegativeMinor(costs.concessionCostMinor, "concession cost");
  const perNight =
    contract.negotiatedRateMinor -
    costs.variableCostPerNightMinor -
    contract.concessions.length * costs.concessionCostMinor;
  return perNight * contract.expectedRoomNights;
}

/**
 * What the account is actually charged: the negotiated rate, never the rack
 * rate, however the market has moved. That is what "negotiated" means.
 */
export function rateForAccountMinor(
  state: SalesState,
  accountName: string,
  dateKey: string,
  rackRateMinor: number,
): number {
  const contract = activeContracts(state, dateKey).find(
    (c) => c.accountName === accountName,
  );
  return contract ? contract.negotiatedRateMinor : rackRateMinor;
}

/** How much of the coming year is already committed, in basis points. */
export function committedShareBasisPoints(
  state: SalesState,
  dateKey: string,
  availableRoomNights: number,
): number {
  assertCount(availableRoomNights, "available room nights");
  if (availableRoomNights === 0) return 0;
  const committed = activeContracts(state, dateKey).reduce(
    (sum, c) => sum + c.expectedRoomNights,
    0,
  );
  return Math.min(
    10_000,
    Math.trunc((committed * 10_000) / availableRoomNights),
  );
}

export function setRenewalIntent(
  state: SalesState,
  contractId: string,
  intent: NegotiatedContract["renewalIntent"],
): SalesState {
  if (!state.contracts.some((c) => c.id === contractId))
    throw new Error(`unknown contract ${contractId}`);
  return {
    ...state,
    contracts: state.contracts.map((c) =>
      c.id === contractId ? { ...c, renewalIntent: intent } : c,
    ),
  };
}

/** Discount the account negotiated off the rack rate, for the record. */
export function negotiatedDiscountBasisPoints(
  contract: NegotiatedContract,
  rackRateMinor: number,
): number {
  assertNonNegativeMinor(rackRateMinor, "rack rate");
  if (rackRateMinor === 0) return 0;
  const discount = Math.trunc(
    ((rackRateMinor - contract.negotiatedRateMinor) * 10_000) / rackRateMinor,
  );
  assertBasisPoints(Math.max(0, discount), "negotiated discount");
  return discount;
}
