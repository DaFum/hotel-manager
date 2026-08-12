import type { GameState } from "../simulation/initialState";
import type { DomainEventPayload } from "../domain/events";
import { compareIds } from "../domain/ids";
import {
  auditBrand,
  brandDemandUpliftBp,
  recordAudit,
} from "../brands/brandAudit";
import type { BrandAuditRecord } from "../brands/brandAudit";
import {
  brandForHotel,
  findBrand,
  removeBrandAssignment,
} from "../brands/brandTypes";
import { monthlyOwnershipPostings } from "../ownership/models";
import { raiseEscalation, escalationReason } from "../management/escalation";
import { managerForHotel } from "../management/managerAuthority";
import { headquartersMonthlyCostMinor } from "./sharedServices";
import { cashNeedForLossMinor, managedHotelMonth } from "./managedHotels";
import {
  appendBrandAudit,
  operatedHotelIds,
  operatingModelFor,
  type CompanyState,
  type HotelOperatingResult,
} from "./companyState";
import { consolidatedCashMinor } from "../treasury/treasury";
import { projectCostMinor } from "../renovation/projects";
import { occupancyBasisPoints } from "../revenue/metrics";
import { assertBasisPoints, assertNonNegativeMinor } from "../domain/units";

/** What putting one failed brand standard right is reckoned to cost. */
export const REMEDIATION_COST_PER_FAILURE_MINOR = 1_500_000;

/** What the corporate month needs from the simulation to do its work. */
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
  const periodKey = periodStartDateKey.slice(0, 7);

  syncTreasury(state);
  publishFlagshipResult(state, periodKey, ctx);
  tradeManagedHotels(state, periodStartDateKey, periodKey, ctx);
  chargeOwnershipContracts(state, ctx);
  auditBrands(state, periodStartDateKey, ctx);
  chargeHeadquarters(state, ctx);
  raiseManagerEscalations(state, periodKey, ctx);
  syncTreasury(state);
}

/**
 * The house the player runs in full reports what its own month produced. It
 * reads the month accumulator rather than the close report, so the corporate
 * month can run before the report is drawn up — and the report can then
 * include what the corporate month charged.
 */
function publishFlagshipResult(
  state: GameState,
  periodKey: string,
  ctx: CompanyMonthContext,
): void {
  const month = state.finance.month;
  // Event revenue is disclosed separately but remains part of the existing
  // other-revenue subtotal, so it must not be counted twice here.
  const revenueMinor = month.roomRevenueMinor + month.otherRevenueMinor;
  const grossOperatingProfitMinor = revenueMinor - month.operatingExpenseMinor;
  publishResult(
    state.company,
    {
      hotelId: state.hotel.id,
      periodKey,
      roomRevenueMinor: month.roomRevenueMinor,
      eventRevenueMinor: month.eventRevenueMinor,
      otherRevenueMinor: month.otherRevenueMinor,
      operatingExpenseMinor: month.operatingExpenseMinor,
      grossOperatingProfitMinor,
      occupancyBasisPoints: occupancyBasisPoints(
        month.soldRoomNights,
        month.availableRoomNights,
      ),
      soldRoomNights: month.soldRoomNights,
      availableRoomNights: month.availableRoomNights,
      qualityStars: state.classification.stars,
      cashNeedMinor: cashNeedForLossMinor(
        state.company.treasury,
        state.hotel.id,
        grossOperatingProfitMinor,
      ),
      renovationNeedMinor: flagshipRenovationNeedMinor(state),
    },
    ctx,
  );
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
      treasury: c.treasury,
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
        eventRevenueMinor: 0,
        otherRevenueMinor: month.otherRevenueMinor,
        operatingExpenseMinor: month.operatingExpenseMinor,
        grossOperatingProfitMinor: month.grossOperatingProfitMinor,
        occupancyBasisPoints: month.occupancyBasisPoints,
        soldRoomNights: month.soldRoomNights,
        availableRoomNights: month.availableRoomNights,
        qualityStars: month.qualityStars,
        cashNeedMinor: month.cashNeedMinor,
        renovationNeedMinor: month.renovationNeedMinor,
      },
      ctx,
    );
  }
}

/** The flagship has real plant and project state, so its estimate uses both. */
function flagshipRenovationNeedMinor(state: GameState): number {
  const conditionNeedMinor = state.assets.reduce((sum, asset) => {
    assertBasisPoints(asset.condition, "asset condition");
    assertNonNegativeMinor(asset.replacementMinor, "asset replacement");
    if (asset.condition > 10_000) throw new Error("invalid asset condition");
    const gap = 10_000 - asset.condition;
    const whole = Math.trunc(asset.replacementMinor / 10_000) * gap;
    const remainder = Math.trunc(
      ((asset.replacementMinor % 10_000) * gap) / 10_000,
    );
    return sum + whole + remainder;
  }, 0);
  const projectNeedMinor = state.renovation
    ? projectCostMinor(state.renovation.project)
    : 0;
  const need = conditionNeedMinor + projectNeedMinor;
  if (!Number.isSafeInteger(need)) throw new Error("invalid renovation need");
  return need;
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
function auditBrands(
  state: GameState,
  periodStartDateKey: string,
  ctx: CompanyMonthContext,
): void {
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
      // The audit covers the month that just closed, so its remediation
      // deadline runs from that month rather than from the day of the close.
      dateKey: periodStartDateKey,
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
    // Two *consecutive* failures on the same flag, with the remediation date
    // already gone by, is the point at which the brand stops waiting. Counting
    // the whole history would take the flag for a failure years ago that the
    // house has since put right.
    const matching = c.brandAudits.filter(
      (a) => a.hotelId === hotelId && a.brandId === brand.id,
    );
    if (shouldRemoveBrand(matching, periodStartDateKey)) {
      c.brandAssignments = removeBrandAssignment(c.brandAssignments, hotelId);
      ctx.emit({ type: "HOTEL_REBRANDED", hotelId, brandId: null }, [hotelId]);
    }
  }
}

/**
 * Whether the flag comes off: the two most recent audits both failed and the
 * grace period the first of them started has run out.
 */
export function shouldRemoveBrand(
  audits: readonly BrandAuditRecord[],
  dateKey: string,
): boolean {
  const recent = [...audits]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 2);
  if (recent.length !== 2 || recent.some((audit) => audit.compliant))
    return false;
  const firstFailure = recent[1];
  return (
    firstFailure.remediationDueDateKey !== null &&
    firstFailure.remediationDueDateKey <= dateKey
  );
}

/**
 * What a brand actually earns a house today; nothing while it is failing.
 * The rule itself lives in the brand module — this only says what the auditor
 * would see when they walked into this particular house.
 */
export function compliantBrandUpliftBp(
  state: GameState,
  hotelId: string,
): number {
  return brandDemandUpliftBp(
    state.company.brands,
    state.company.brandAssignments,
    hotelId,
    auditInputFor(state, hotelId),
  );
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
