import type { GameState } from "../simulation/initialState";
import type { DomainEventPayload } from "../domain/events";
import { compareIds } from "../domain/ids";
import { auditBrand, recordAudit } from "../brands/brandAudit";
import {
  brandForHotel,
  findBrand,
  removeBrandAssignment,
} from "../brands/brandTypes";
import { monthlyOwnershipPostings } from "../ownership/models";
import { raiseEscalation, escalationReason } from "../management/escalation";
import { managerForHotel } from "../management/managerAuthority";
import { headquartersMonthlyCostMinor } from "./sharedServices";
import { managedHotelMonth } from "./managedHotels";
import {
  appendBrandAudit,
  operatedHotelIds,
  operatingModelFor,
  type CompanyState,
  type HotelOperatingResult,
} from "./companyState";
import { consolidatedCashMinor } from "../treasury/treasury";
import { STARTER_HOTEL } from "../content/1991/starterHotel";

/** What the corporate month needs from the simulation to do its work. */
/** What putting one failed brand standard right is reckoned to cost. */
export const REMEDIATION_COST_PER_FAILURE_MINOR = 1_500_000;

export interface CompanyMonthContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  earn(amountMinor: number, account: string, memo: string): void;
  spend(amountMinor: number, account: string, memo: string): void;
}

/**
 * The company's own month, run once after the flagship hotel has closed its
 * books. Everything here flows in one direction: hotels publish results
 * upward, and budgets, brands, contracts and overheads flow back down.
 */
export function runCompanyMonth(
  state: GameState,
  periodStartDateKey: string,
  ctx: CompanyMonthContext,
): void {
  const c = state.company;
  const periodKey = periodStartDateKey.slice(0, 7);

  publishFlagshipResult(state, periodKey, ctx);
  tradeManagedHotels(state, periodStartDateKey, periodKey, ctx);
  chargeOwnershipContracts(state, ctx);
  auditBrands(state, ctx);
  chargeHeadquarters(state, ctx);
  raiseManagerEscalations(state, periodKey, ctx);
  syncTreasury(state);
  void c;
}

/** The house the player runs in full reports what its own close produced. */
function publishFlagshipResult(
  state: GameState,
  periodKey: string,
  ctx: CompanyMonthContext,
): void {
  const close = state.lastMonthlyClose;
  if (!close) return;
  publishResult(
    state.company,
    {
      hotelId: state.hotel.id,
      periodKey: close.periodKey,
      roomRevenueMinor: close.roomRevenueMinor,
      otherRevenueMinor: close.otherRevenueMinor,
      operatingExpenseMinor: close.operatingExpenseMinor,
      grossOperatingProfitMinor: close.operatingProfitMinor,
      occupancyBasisPoints: close.occupancyBasisPoints,
      soldRoomNights: close.soldRoomNights,
      availableRoomNights: close.availableRoomNights,
    },
    ctx,
  );
  void periodKey;
}

/** Every other house in the group trades its own month and hands up the result. */
function tradeManagedHotels(
  state: GameState,
  periodStartDateKey: string,
  periodKey: string,
  ctx: CompanyMonthContext,
): void {
  const c = state.company;
  for (const hotel of [...c.managedHotels].sort((a, b) =>
    compareIds(a.hotelId, b.hotelId),
  )) {
    const month = managedHotelMonth(hotel, {
      periodStartDateKey,
      brandUpliftBp: compliantBrandUpliftBp(state, hotel.hotelId),
    });
    // Revenue and cost are posted separately so the group's P&L keeps them
    // apart; netting them here would make a busy loss-making house invisible.
    ctx.earn(
      month.roomRevenueMinor + month.otherRevenueMinor,
      "portfolioRevenue",
      `${hotel.name} revenue`,
    );
    ctx.spend(
      month.operatingExpenseMinor,
      "portfolioOperating",
      `${hotel.name} operating cost`,
    );
    c.treasury = {
      ...c.treasury,
      hotelCashMinor: {
        ...c.treasury.hotelCashMinor,
        [hotel.hotelId]:
          (c.treasury.hotelCashMinor[hotel.hotelId] ?? 0) +
          month.grossOperatingProfitMinor,
      },
    };
    publishResult(
      c,
      {
        hotelId: hotel.hotelId,
        periodKey,
        roomRevenueMinor: month.roomRevenueMinor,
        otherRevenueMinor: month.otherRevenueMinor,
        operatingExpenseMinor: month.operatingExpenseMinor,
        grossOperatingProfitMinor: month.grossOperatingProfitMinor,
        occupancyBasisPoints: month.occupancyBasisPoints,
        soldRoomNights: month.soldRoomNights,
        availableRoomNights: month.availableRoomNights,
      },
      ctx,
    );
  }
}

function publishResult(
  company: CompanyState,
  result: HotelOperatingResult,
  ctx: CompanyMonthContext,
): void {
  company.hotelResults = { ...company.hotelResults, [result.hotelId]: result };
  ctx.emit(
    {
      type: "HOTEL_RESULT_PUBLISHED",
      hotelId: result.hotelId,
      periodKey: result.periodKey,
      grossOperatingProfitMinor: result.grossOperatingProfitMinor,
    },
    [result.hotelId],
  );
}

/** Rent, management fees and royalties, each posted to its own account. */
function chargeOwnershipContracts(
  state: GameState,
  ctx: CompanyMonthContext,
): void {
  const c = state.company;
  for (const hotelId of operatedHotelIds(c)) {
    const result = c.hotelResults[hotelId];
    if (!result) continue;
    for (const posting of monthlyOwnershipPostings(
      operatingModelFor(c, hotelId),
      result.roomRevenueMinor,
    ))
      if (posting.amountMinor < 0)
        ctx.spend(
          -posting.amountMinor,
          posting.account,
          `${posting.memo} ${hotelId}`,
        );
      else
        ctx.earn(
          posting.amountMinor,
          posting.account,
          `${posting.memo} ${hotelId}`,
        );
  }
}

/**
 * The brand programme's monthly cost and its audit. A house that has been out
 * of compliance past its remediation date loses the flag, so a brand is a
 * standing obligation rather than a one-off purchase.
 */
function auditBrands(state: GameState, ctx: CompanyMonthContext): void {
  const c = state.company;
  for (const hotelId of operatedHotelIds(c)) {
    const assignment = brandForHotel(c.brandAssignments, hotelId);
    if (!assignment) continue;
    const brand = findBrand(c.brands, assignment.brandId);
    if (!brand) continue;
    ctx.spend(
      brand.monthlyProgrammeCostMinor,
      "brandProgramme",
      `${brand.name} programme at ${hotelId}`,
    );
    const result = auditBrand(brand.standard, auditInputFor(state, hotelId));
    const audit = recordAudit({
      hotelId,
      brandId: brand.id,
      dateKey: state.calendar.dateKey,
      result,
    });
    c.brandAudits = appendBrandAudit(c.brandAudits, audit);
    ctx.emit(
      {
        type: "BRAND_AUDIT_COMPLETED",
        hotelId,
        brandId: brand.id,
        compliant: audit.compliant,
        failures: audit.failures,
      },
      [hotelId, brand.id],
    );
    if (audit.compliant) continue;
    // Two consecutive failures on the same flag is the point at which the
    // brand stops waiting: the grace period has been and gone.
    const failures = c.brandAudits.filter(
      (a) => a.hotelId === hotelId && a.brandId === brand.id && !a.compliant,
    );
    if (failures.length >= 2) {
      c.brandAssignments = removeBrandAssignment(c.brandAssignments, hotelId);
      ctx.emit({ type: "HOTEL_REBRANDED", hotelId, brandId: null }, [hotelId]);
    }
  }
}

/** What a brand actually earns a house today; nothing while it is failing. */
export function compliantBrandUpliftBp(
  state: GameState,
  hotelId: string,
): number {
  const c = state.company;
  const assignment = brandForHotel(c.brandAssignments, hotelId);
  if (!assignment) return 0;
  const brand = findBrand(c.brands, assignment.brandId);
  if (!brand) return 0;
  return auditBrand(brand.standard, auditInputFor(state, hotelId)).compliant
    ? brand.demandUpliftBasisPoints
    : 0;
}

/**
 * What the auditor sees. The flagship is inspected against its real product;
 * a portfolio house is inspected against the standard of the group it joined,
 * which is what the group actually knows about it.
 */
function auditInputFor(state: GameState, hotelId: string) {
  if (hotelId === state.hotel.id)
    return {
      roomQuality: state.classification.stars * 20,
      facilities: state.facilities.map((f) => f.id),
      guestSatisfaction: Math.round(state.guestSatisfaction.score),
      stars: state.classification.stars,
    };
  const managed = state.company.managedHotels.find(
    (h) => h.hotelId === hotelId,
  );
  const quality = managed
    ? Math.min(100, Math.round(managed.gopMarginBasisPoints / 100) + 30)
    : 0;
  return {
    roomQuality: quality,
    facilities: ["facility.breakfast_room"],
    guestSatisfaction: quality,
    stars: Math.min(5, Math.floor(quality / 20)),
  };
}

function chargeHeadquarters(state: GameState, ctx: CompanyMonthContext): void {
  const c = state.company;
  ctx.spend(
    headquartersMonthlyCostMinor({
      hotelCount: c.portfolio.hotelIds.length,
      baseMinor: c.headquarters.baseMonthlyCostMinor,
      perHotelMinor: c.headquarters.perHotelMonthlyCostMinor,
    }),
    "headquarters",
    "head office",
  );
}

/**
 * What the group has to answer for. A house that failed its brand audit needs
 * remediation capital its manager is not authorised to commit, so the decision
 * comes up to the centre — which is the delegation model working, not failing.
 */
function raiseManagerEscalations(
  state: GameState,
  periodKey: string,
  ctx: CompanyMonthContext,
): void {
  const c = state.company;
  for (const hotelId of operatedHotelIds(c)) {
    const audit = [...c.brandAudits]
      .reverse()
      .find((a) => a.hotelId === hotelId);
    const result = c.hotelResults[hotelId];
    const manager = managerForHotel(c.managers, hotelId);
    if (!manager) continue;
    // Either a failed standard to put right, or a house that lost money and
    // cannot fund its own recovery.
    const decision =
      audit && !audit.compliant
        ? {
            kind: "capex" as const,
            amountMinor:
              REMEDIATION_COST_PER_FAILURE_MINOR * audit.failures.length,
          }
        : result && result.grossOperatingProfitMinor < 0
          ? {
              kind: "repair" as const,
              amountMinor: -result.grossOperatingProfitMinor,
            }
          : null;
    if (!decision) continue;
    const reason = escalationReason(manager.authority, decision);
    if (!reason) continue;
    const id = `escalation.${hotelId}.${periodKey}`;
    if (c.escalations.some((e) => e.id === id)) continue;
    c.escalations = raiseEscalation(c.escalations, {
      id,
      hotelId,
      managerId: manager.id,
      raisedAtMinutes: state.elapsedMinutes,
      decision,
      reason,
    });
    ctx.emit(
      { type: "DECISION_ESCALATED", escalationId: id, hotelId, reason },
      [hotelId, id],
    );
  }
}

/**
 * Headquarters holds whatever the hotels have not been allocated. Group cash
 * is one number; the treasury only says where inside the group it sits, so
 * the two can never drift apart.
 */
export function syncTreasury(state: GameState): void {
  const c = state.company;
  const allocated = Object.keys(c.treasury.hotelCashMinor)
    .sort(compareIds)
    .reduce((sum, id) => sum + c.treasury.hotelCashMinor[id], 0);
  c.treasury = {
    ...c.treasury,
    hqMinor: state.finance.cashMinor - allocated,
  };
}

/** The invariant the treasury exists to keep; asserted every quantum. */
export function treasuryReconciles(state: GameState): boolean {
  return (
    consolidatedCashMinor(state.company.treasury) === state.finance.cashMinor
  );
}

export { STARTER_HOTEL };
