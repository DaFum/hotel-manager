import { translateKey } from "../localization";
import type { GameState } from "../../game/simulation/initialState";
import { evaluateOpeningReadiness } from "../../game/development/preOpening";
import { brandForHotel, findBrand } from "../../game/brands/brandTypes";
import { managerForHotel } from "../../game/management/managerAuthority";
import type { PortfolioHotelRow } from "./PortfolioDashboard";
import type { BrandAuditRow, BrandRow } from "./BrandDashboard";
import type { DevelopmentRow } from "./DevelopmentDashboard";
import type { EscalationRow, ManagerRow } from "./ManagerGovernancePanel";
import type {
  AccountRow,
  CampaignRow,
  ReputationRow,
} from "./CommercialDashboard";
import {
  ATTRIBUTION_LAG_DAYS,
  campaignEffectBasisPoints,
  campaignUncertaintyBand,
} from "../../game/commercial/campaigns";
import { contractProfitabilityMinor } from "../../game/commercial/salesPipeline";
import { marketableGuestIds } from "../../game/commercial/crm";
import {
  REPUTATION_DIMENSIONS,
  reputationCauses,
} from "../../game/reputation/dimensions";
import { CORE_CONTENT_REGISTRY } from "../../game/content/corePack";

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

/** City display name from the content record carried by the hotel identity. */
export function cityName(state: GameState, hotelId: string): string {
  const cityId =
    hotelId === state.hotel.id
      ? state.hotel.cityId
      : state.company.managedHotels.find((hotel) => hotel.hotelId === hotelId)
          ?.cityId;
  if (!cityId || !CORE_CONTENT_REGISTRY.has(cityId)) return cityId ?? "unknown";
  return translateKey(CORE_CONTENT_REGISTRY.getByKind(cityId, "city").nameKey);
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
      cityName: cityName(state, hotelId),
      qualityStars: result?.qualityStars ?? 0,
      occupancyBasisPoints:
        result?.occupancyBasisPoints ??
        (hotelId === state.hotel.id ? state.metrics.occupancyBasisPoints : 0),
      monthlyProfitMinor: result?.grossOperatingProfitMinor ?? 0,
      cashNeedMinor: result?.cashNeedMinor ?? 0,
      renovationNeedMinor: result?.renovationNeedMinor ?? 0,
      // The flagship's own alerts are its warnings; a portfolio house warns
      // through the audit it last failed.
      warnings:
        (hotelId === state.hotel.id ? state.alerts.length : 0) +
        (latestAudit && !latestAudit.compliant
          ? latestAudit.failures.length
          : 0),
      managerName: managerForHotel(c.managers, hotelId)?.name ?? "unmanaged",
      brandName: brand ? translateKey(brand.name) : undefined,
      operatingModel: (c.operatingModels[hotelId] ?? { kind: "owned" }).kind,
    };
  });
}

export function brandRows(state: GameState): BrandRow[] {
  const c = state.company;
  return c.brands.map((brand) => ({
    id: brand.id,
    name: translateKey(brand.name),
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
    capexLimitMinor: manager.authority.capexLimitMinor,
    recoveryLimitMinor: manager.authority.recoveryLimitMinor,
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

/** The audience a Frankfurt campaign is bought against; a balancing constant. */
const CAMPAIGN_AUDIENCE = 40_000;
/** What one night costs to service, for judging a negotiated account. */
const VARIABLE_COST_PER_NIGHT_MINOR = 3_000;
const CONCESSION_COST_MINOR = 800;

export function campaignRows(state: GameState): CampaignRow[] {
  return state.commercial.campaigns.map((campaign) => {
    const band = campaignUncertaintyBand(
      campaignEffectBasisPoints(campaign, CAMPAIGN_AUDIENCE),
      2500,
    );
    const age = state.commercial.campaignAgeDays[campaign.id] ?? 0;
    return {
      id: campaign.id,
      objective: campaign.objective,
      channel: campaign.channel,
      targetSegmentId: campaign.targetSegmentId,
      budgetMinor: campaign.budgetMinor,
      status: campaign.status,
      lowBasisPoints: band.lowBasisPoints,
      highBasisPoints: band.highBasisPoints,
      daysUntilAttribution: Math.max(0, ATTRIBUTION_LAG_DAYS - age),
    };
  });
}

export function accountRows(state: GameState): AccountRow[] {
  return state.commercial.sales.contracts.map((contract) => ({
    id: contract.id,
    accountName: contract.accountName,
    negotiatedRateMinor: contract.negotiatedRateMinor,
    expectedRoomNights: contract.expectedRoomNights,
    concessions: contract.concessions,
    renewalIntent: contract.renewalIntent,
    profitabilityMinor: contractProfitabilityMinor(contract, {
      variableCostPerNightMinor: VARIABLE_COST_PER_NIGHT_MINOR,
      concessionCostMinor: CONCESSION_COST_MINOR,
    }),
  }));
}

/** Every dimension that has actually been scored, with what it affects. */
export function reputationRows(state: GameState): ReputationRow[] {
  const rows: ReputationRow[] = [];
  for (const dimension of REPUTATION_DIMENSIONS)
    for (const scopeId of Object.keys(state.reputation[dimension]).sort())
      rows.push({
        dimension,
        scopeId,
        score: state.reputation[dimension][scopeId].score,
        effect: `commercial.effect.${dimension}`,
        topCause:
          reputationCauses(state.reputation, dimension, scopeId)[0]?.cause ??
          null,
      });
  return rows;
}

export function marketableGuestCount(state: GameState): number {
  return marketableGuestIds(state.commercial.crm).length;
}
