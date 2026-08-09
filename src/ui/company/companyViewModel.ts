import type { GameState } from "../../game/simulation/initialState";
import { evaluateOpeningReadiness } from "../../game/development/preOpening";
import { brandForHotel, findBrand } from "../../game/brands/brandTypes";
import { managerForHotel } from "../../game/management/managerAuthority";
import type { PortfolioHotelRow } from "./PortfolioDashboard";
import type { BrandAuditRow, BrandRow } from "./BrandDashboard";
import type { DevelopmentRow } from "./DevelopmentDashboard";
import type { EscalationRow, ManagerRow } from "./ManagerGovernancePanel";

/**
 * Presentation-only projections of the authoritative company snapshot. The
 * dashboards take plain rows so they can be rendered and tested without a
 * simulation, and every field here is read from state rather than decided.
 */

/** The name a house goes by, whichever kind of house it is. */
export function hotelName(state: GameState, hotelId: string): string {
  if (hotelId === state.hotel.id) return state.hotel.name;
  return (
    state.company.managedHotels.find((h) => h.hotelId === hotelId)?.name ??
    hotelId
  );
}

export function portfolioRows(state: GameState): PortfolioHotelRow[] {
  const c = state.company;
  return c.portfolio.hotelIds.map((hotelId) => {
    const result = c.hotelResults[hotelId];
    const assignment = brandForHotel(c.brandAssignments, hotelId);
    const brand = assignment ? findBrand(c.brands, assignment.brandId) : null;
    const latestAudit = [...c.brandAudits]
      .reverse()
      .find((audit) => audit.hotelId === hotelId);
    return {
      id: hotelId,
      name: hotelName(state, hotelId),
      occupancyBasisPoints:
        result?.occupancyBasisPoints ??
        (hotelId === state.hotel.id ? state.metrics.occupancyBasisPoints : 0),
      monthlyProfitMinor: result?.grossOperatingProfitMinor ?? 0,
      // The flagship's own alerts are its warnings; a portfolio house warns
      // through the audit it last failed.
      warnings:
        (hotelId === state.hotel.id ? state.alerts.length : 0) +
        (latestAudit && !latestAudit.compliant
          ? latestAudit.failures.length
          : 0),
      managerName: managerForHotel(c.managers, hotelId)?.name ?? "unmanaged",
      brandName: brand?.name,
      operatingModel: (c.operatingModels[hotelId] ?? { kind: "owned" }).kind,
    };
  });
}

export function brandRows(state: GameState): BrandRow[] {
  const c = state.company;
  return c.brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    demandUpliftBasisPoints: brand.demandUpliftBasisPoints,
    monthlyProgrammeCostMinor: brand.monthlyProgrammeCostMinor,
    hotelIds: c.brandAssignments
      .filter((a) => a.brandId === brand.id)
      .map((a) => a.hotelId),
  }));
}

/** The most recent audit per house; older ones stay in state, not on screen. */
export function brandAuditRows(state: GameState): BrandAuditRow[] {
  const latest = new Map<string, BrandAuditRow>();
  for (const audit of state.company.brandAudits)
    latest.set(audit.hotelId, {
      hotelId: audit.hotelId,
      hotelName: hotelName(state, audit.hotelId),
      brandId: audit.brandId,
      dateKey: audit.dateKey,
      compliant: audit.compliant,
      failures: audit.failures,
      remediationDueDateKey: audit.remediationDueDateKey,
    });
  return [...latest.values()];
}

export function developmentRows(state: GameState): DevelopmentRow[] {
  return state.company.developments.map((development) => ({
    id: development.id,
    name: development.name,
    rooms: development.rooms,
    investmentMinor: development.investmentMinor,
    downsideAnnualRoomRevenueMinor:
      development.feasibility.downsideAnnualRoomRevenueMinor,
    baseAnnualRoomRevenueMinor:
      development.feasibility.baseAnnualRoomRevenueMinor,
    upsideAnnualRoomRevenueMinor:
      development.feasibility.upsideAnnualRoomRevenueMinor,
    returnOnCostBasisPoints: development.feasibility.returnOnCostBasisPoints,
    missing: evaluateOpeningReadiness(development.preOpening.readiness).missing,
    openedDateKey: development.openedDateKey,
  }));
}

export function managerRows(state: GameState): ManagerRow[] {
  return state.company.managers.map((manager) => ({
    id: manager.id,
    name: manager.name,
    hotelId: manager.hotelId,
    hotelName: hotelName(state, manager.hotelId),
    competence: manager.competence,
    repairLimitMinor: manager.authority.repairLimitMinor,
    capexLimitMinor: manager.authority.capexLimitMinor ?? 0,
    recoveryLimitMinor: manager.authority.recoveryLimitMinor ?? 0,
  }));
}

export function escalationRows(state: GameState): EscalationRow[] {
  const c = state.company;
  return c.escalations.map((escalation) => ({
    id: escalation.id,
    hotelName: hotelName(state, escalation.hotelId),
    managerName:
      c.managers.find((m) => m.id === escalation.managerId)?.name ?? "manager",
    reason: escalation.reason,
    status: escalation.status,
  }));
}
