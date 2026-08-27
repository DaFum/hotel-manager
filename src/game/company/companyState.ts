import { compareIds } from "../domain/ids";
import type { BrandAuditRecord } from "../brands/brandAudit";
import type { Brand, BrandAssignment } from "../brands/brandTypes";
import { createBrand } from "../brands/brandTypes";
import type { OperatingModel } from "../ownership/models";
import type { AssignedHotelBudget } from "./budgets";
import type { Escalation } from "../management/escalation";
import type { HotelManager } from "../management/managerAuthority";
import { createManager } from "../management/managerAuthority";
import type { PreOpeningProject } from "../development/preOpening";
import type { FeasibilityResult } from "../development/feasibility";
import type { ManagedHotelRecord } from "./managedHotels";
import type { AcquisitionTarget } from "../ma/acquisition";
import { createAcquisitionTarget } from "../ma/acquisition";
import type { DueDiligenceReport } from "../ma/dueDiligence";
import type { TreasuryState } from "../treasury/treasury";
import { createTreasury, openHotelAccount } from "../treasury/treasury";
import {
  addHotelToPortfolio,
  createPortfolio,
  type CompanyPortfolio,
} from "./portfolio";
import { createLegalEntity, type LegalEntity } from "./legalEntities";
import {
  ACQUISITION_TARGETS,
  HEADQUARTERS,
  PLAYER_COMPANY,
  STARTER_BRANDS,
  STARTER_LEGAL_ENTITY,
  STARTER_MANAGER,
  STARTER_REGION,
} from "../content/1991/company";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import type { GroupTargets } from "./groupTargets";

/**
 * A scheme from the day the group first studies it to the day it takes
 * guests. Feasibility, pre-opening and the opening date all live on the same
 * record, because they are three stages of one decision.
 */
export interface DevelopmentProject {
  id: string;
  /** The hotel id the scheme will become when it opens. */
  hotelId: string;
  name: string;
  cityId: string;
  rooms: number;
  /** The occupancy the study underwrote, and the house then trades at. */
  occupancyBasisPoints: number;
  investmentMinor: number;
  feasibility: FeasibilityResult;
  preOpening: PreOpeningProject;
  /** Set on the day the house opens; null while it is still a building site. */
  openedDateKey: string | null;
}

/**
 * What one hotel publishes upward each month. Hotels do not read the company
 * layer and the company layer does not reach into a hotel; this record is the
 * whole of the traffic between them.
 */
export interface HotelOperatingResult {
  hotelId: string;
  periodKey: string;
  roomRevenueMinor: number;
  eventRevenueMinor: number;
  otherRevenueMinor: number;
  operatingExpenseMinor: number;
  grossOperatingProfitMinor: number;
  gopparMinor?: number;
  occupancyBasisPoints: number;
  soldRoomNights: number;
  availableRoomNights: number;
  qualityStars: number;
  cashNeedMinor: number;
  renovationNeedMinor: number;
}

/** The corporate layer, in full. Everything here is persisted save state. */
export interface CompanyState {
  companyId: string;
  name: string;
  portfolio: CompanyPortfolio;
  legalEntities: LegalEntity[];
  /** How the group holds each hotel, by hotel id. */
  operatingModels: Record<string, OperatingModel>;
  brands: Brand[];
  brandAssignments: BrandAssignment[];
  /** The audit history, newest last; bounded so a long game stays small. */
  brandAudits: BrandAuditRecord[];
  /** Houses the group owns but does not simulate minute by minute. */
  managedHotels: ManagedHotelRecord[];
  developments: DevelopmentProject[];
  budgets: AssignedHotelBudget[];
  managers: HotelManager[];
  escalations: Escalation[];
  treasury: TreasuryState;
  acquisitionTargets: AcquisitionTarget[];
  /** Diligence the group has already paid for, by target id. */
  dueDiligence: Record<string, DueDiligenceReport>;
  headquarters: {
    baseMonthlyCostMinor: number;
    perHotelMonthlyCostMinor: number;
    analysts: number;
    capacityPerAnalyst: number;
  };
  /** The latest published result per hotel, by hotel id. */
  hotelResults: Record<string, HotelOperatingResult>;
  groupTargets: GroupTargets;
  /** Outside equity ownership accumulated through distress injections. */
  investorStakeBasisPoints: number;
  /** Monotonic counter for ids the company layer mints for itself. */
  sequence: number;
}

/** How much audit history a save carries; older audits are dropped. */
export const BRAND_AUDIT_LIMIT = 48;

export function createCompanyState(): CompanyState {
  const portfolio = addHotelToPortfolio(createPortfolio(PLAYER_COMPANY.id), {
    hotelId: STARTER_HOTEL.id,
    legalEntityId: STARTER_LEGAL_ENTITY.id,
    regionId: STARTER_REGION,
  });
  return {
    companyId: PLAYER_COMPANY.id,
    name: PLAYER_COMPANY.name,
    portfolio,
    legalEntities: [createLegalEntity({ ...STARTER_LEGAL_ENTITY })],
    // The house the player starts in is theirs outright; the group owns no
    // contracts until it signs one.
    operatingModels: { [STARTER_HOTEL.id]: { kind: "owned" } },
    brands: STARTER_BRANDS.map((brand) =>
      createBrand({
        id: brand.id,
        name: brand.name,
        standard: {
          minRoomQuality: brand.standard.minRoomQuality,
          requiredFacilities: [...brand.standard.requiredFacilities],
          minGuestSatisfaction: brand.standard.minGuestSatisfaction,
          // Spread rather than assigned: a brand that promises no star rating
          // should not persist an explicit `undefined` for one.
          ...("minStars" in brand.standard &&
          Object.hasOwn(brand.standard, "minStars") &&
          brand.standard.minStars !== undefined
            ? { minStars: brand.standard.minStars }
            : {}),
        },
        demandUpliftBasisPoints: brand.demandUpliftBasisPoints,
        monthlyProgrammeCostMinor: brand.monthlyProgrammeCostMinor,
      }),
    ),
    brandAssignments: [],
    brandAudits: [],
    managedHotels: [],
    developments: [],
    budgets: [],
    managers: [
      createManager({
        id: STARTER_MANAGER.id,
        name: STARTER_MANAGER.name,
        hotelId: STARTER_HOTEL.id,
        competence: STARTER_MANAGER.competence,
      }),
    ],
    escalations: [],
    // All the group's cash starts unallocated: a one-hotel owner has one
    // pot, and an account per house only starts to mean something once there
    // is more than one house to divide it between.
    treasury: openHotelAccount(
      createTreasury({
        hqMinor: STARTER_HOTEL.startingCashMinor,
        reportingCurrency: PLAYER_COMPANY.reportingCurrency,
      }),
      STARTER_HOTEL.id,
      0,
    ),
    acquisitionTargets: ACQUISITION_TARGETS.map((target) =>
      createAcquisitionTarget({ ...target }),
    ),
    dueDiligence: {},
    headquarters: {
      baseMonthlyCostMinor: HEADQUARTERS.baseMonthlyCostMinor,
      perHotelMonthlyCostMinor: HEADQUARTERS.perHotelMonthlyCostMinor,
      analysts: HEADQUARTERS.analysts,
      capacityPerAnalyst: HEADQUARTERS.capacityPerAnalyst,
    },
    hotelResults: {},
    groupTargets: {
      gopparMinor: 0,
      guestSatisfaction: 0,
      staffTurnoverBasisPoints: 0,
      marketShareBasisPoints: 0,
      brandStandard: 0,
    },
    investorStakeBasisPoints: 0,
    sequence: 0,
  };
}

export function findManagedHotel(
  company: CompanyState,
  hotelId: string,
): ManagedHotelRecord | null {
  return company.managedHotels.find((h) => h.hotelId === hotelId) ?? null;
}

export function findDevelopment(
  company: CompanyState,
  developmentId: string,
): DevelopmentProject | null {
  return company.developments.find((d) => d.id === developmentId) ?? null;
}

export function budgetForHotel(
  company: CompanyState,
  hotelId: string,
): AssignedHotelBudget | null {
  return company.budgets.find((b) => b.hotelId === hotelId) ?? null;
}

export function operatingModelFor(
  company: CompanyState,
  hotelId: string,
): OperatingModel {
  return company.operatingModels[hotelId] ?? { kind: "owned" };
}

/** Appends an audit and keeps the history bounded; oldest go first. */
export function appendBrandAudit(
  audits: readonly BrandAuditRecord[],
  audit: BrandAuditRecord,
): BrandAuditRecord[] {
  const next = [...audits, audit];
  return next.length > BRAND_AUDIT_LIMIT
    ? next.slice(next.length - BRAND_AUDIT_LIMIT)
    : next;
}

/** Every hotel the group operates, in stable order, for phase processing. */
export function operatedHotelIds(company: CompanyState): string[] {
  return [...company.portfolio.hotelIds].sort(compareIds);
}
