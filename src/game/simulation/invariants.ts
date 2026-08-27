import type { GameState } from "./initialState";
import { balanceMinor } from "../finance/ledger";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { consolidatedCashMinor } from "../treasury/treasury";
import { balanceSheet } from "../finance/statements";

/**
 * Invariants are checked after every quantum so a determinism break surfaces
 * where it happened instead of many days later in a save file.
 */
export function assertInvariants(state: GameState): void {
  if (!state.finance || !state.hotel || !state.calendar)
    throw new Error("game state is missing a required section");

  const cash = state.finance.cashMinor;
  if (!Number.isSafeInteger(cash))
    throw new Error("cash must be whole Pfennig");
  if (cash < 0) throw new Error("cash must not be negative");

  if (!Number.isSafeInteger(state.finance.payableMinor))
    throw new Error("payables must be whole Pfennig");

  const claimIds = new Set<string>();
  const policyIds = new Set(
    state.insurance.policies.map((policy) => policy.id),
  );
  for (const claim of state.insurance.claims) {
    if (claimIds.has(claim.id))
      throw new Error(`duplicate claim id ${claim.id}`);
    claimIds.add(claim.id);
    if (!policyIds.has(claim.policyId))
      throw new Error(
        `claim ${claim.id} references unknown policy ${claim.policyId}`,
      );
    for (const [label, value] of [
      ["loss", claim.lossMinor],
      ["settlement", claim.settlementMinor],
    ] as const)
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(`claim ${claim.id} ${label} must be non-negative`);
    if (claim.status === "filed" && claim.settledAtMinutes !== null)
      throw new Error(`filed claim ${claim.id} cannot have a settlement time`);
    if (claim.status !== "filed" && claim.settledAtMinutes === null)
      throw new Error(
        `${claim.status} claim ${claim.id} needs a settlement time`,
      );
  }

  if (!state.fnb || !Array.isArray(state.fnb.outlets))
    throw new Error("game state is missing F&B operations");
  for (const outlet of state.fnb.outlets) {
    const counts = [
      ["seats", outlet.seats],
      ["reserved seats", outlet.reservedSeats],
      ["demand", outlet.demand],
      ["capacity", outlet.capacity],
      ["served", outlet.served],
      ["waitlisted", outlet.waitlisted],
      ["service throughput", outlet.serviceThroughput],
      ["kitchen throughput", outlet.kitchenThroughput],
      ["stock", outlet.stockLeft],
      ["waste", outlet.wastedCovers],
      ["average wait", outlet.averageWaitMinutes],
      ["service utilization", outlet.serviceUtilizationBp],
      ["kitchen utilization", outlet.kitchenUtilizationBp],
    ] as const;
    for (const [label, value] of counts)
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(`F&B ${outlet.id} ${label} must be non-negative`);
    if (
      !Number.isSafeInteger(outlet.ingredientExpenseMinor) ||
      outlet.ingredientExpenseMinor < 0
    )
      throw new Error(`F&B ${outlet.id} food cost must be non-negative`);
    if (
      outlet.serviceUtilizationBp > 1_000_000 ||
      outlet.kitchenUtilizationBp > 1_000_000
    )
      throw new Error(`F&B ${outlet.id} utilization is out of range`);
    if (outlet.served > outlet.demand)
      throw new Error(`F&B ${outlet.id} served exceeds demand`);
    if (outlet.served > outlet.capacity)
      throw new Error(`F&B ${outlet.id} served exceeds capacity`);
  }

  // Cash is only ever moved through the ledger, so the two must agree.
  if (
    cash !==
    STARTER_HOTEL.startingCashMinor + balanceMinor(state.finance.ledger)
  )
    throw new Error("cash has drifted from the ledger");

  const supplierPayablesMinor = state.finance.supplierInvoices.reduce(
    (sum, invoice) => sum + invoice.amountMinor,
    0,
  );
  const sheet = balanceSheet({
    cashMinor: cash,
    receivablesMinor: state.statements.receivablesMinor,
    fixedAssetsMinor: state.statements.fixedAssetsMinor,
    accumulatedDepreciationMinor: state.statements.accumulatedDepreciationMinor,
    payablesMinor: state.finance.payableMinor + supplierPayablesMinor,
    taxPayableMinor: state.finance.taxPayableMinor,
    debtMinor: state.loan.principalMinor,
    contributedCapitalMinor: state.statements.contributedCapitalMinor,
    retainedEarningsMinor: state.statements.retainedEarningsMinor,
  });
  if (!sheet.balances)
    throw new Error("the balance sheet equation does not balance");

  const ids = new Set<string>();
  for (const room of state.hotel.rooms) {
    if (ids.has(room.id)) throw new Error(`duplicate room id ${room.id}`);
    ids.add(room.id);
    if (room.cleanliness < 0 || room.cleanliness > 100)
      throw new Error(`room ${room.id} cleanliness out of range`);
  }

  // The city is authoritative state too: a rival with fractional money or a
  // negative house would corrupt every later month of the market.
  const market = state.cityMarket;
  if (!market) throw new Error("game state is missing the city market");
  if (!Number.isSafeInteger(market.landPriceMinor) || market.landPriceMinor < 0)
    throw new Error("land price must be whole Pfennig");
  if (
    !Number.isSafeInteger(market.wagePressureBp) ||
    market.wagePressureBp <= 0
  )
    throw new Error("wage pressure must be a positive whole basis-point value");
  for (const source of Object.values(market.demand))
    if (!Number.isSafeInteger(source) || source < 0)
      throw new Error("city demand must be whole room nights");

  const competitorIds = new Set<string>();
  for (const c of state.competitors) {
    if (competitorIds.has(c.id))
      throw new Error(`duplicate competitor id ${c.id}`);
    competitorIds.add(c.id);
    if (!Number.isSafeInteger(c.rooms) || c.rooms < 0)
      throw new Error(`competitor ${c.id} has an impossible room count`);
    if (!Number.isSafeInteger(c.cashMinor))
      throw new Error(`competitor ${c.id} cash must be whole Pfennig`);
    if (!Number.isSafeInteger(c.debtMinor) || c.debtMinor < 0)
      throw new Error(`competitor ${c.id} debt must be whole Pfennig`);
    if (!Number.isSafeInteger(c.rateMinor) || c.rateMinor <= 0)
      throw new Error(`competitor ${c.id} rate must be whole Pfennig`);
  }

  // The corporate layer must describe the same money the hotel holds. A
  // treasury that has drifted would let the group fund a hotel out of cash
  // that is not there.
  const company = state.company;
  if (company) {
    if (consolidatedCashMinor(company.treasury) !== cash)
      throw new Error("the treasury has drifted from group cash");
    const portfolio = new Set<string>();
    for (const hotelId of company.portfolio.hotelIds) {
      if (portfolio.has(hotelId))
        throw new Error(`duplicate portfolio hotel ${hotelId}`);
      portfolio.add(hotelId);
      if (!company.portfolio.hotelLegalEntity[hotelId])
        throw new Error(`hotel ${hotelId} is held by no legal entity`);
    }
    for (const hotel of company.managedHotels)
      if (!portfolio.has(hotel.hotelId))
        throw new Error(
          `managed hotel ${hotel.hotelId} is not in the portfolio`,
        );
  }

  const minute = state.calendar.minuteOfDay;
  if (!Number.isSafeInteger(minute) || minute < 0 || minute >= 1440)
    throw new Error("minute of day out of range");
}
