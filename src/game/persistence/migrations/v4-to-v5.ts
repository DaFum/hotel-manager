import type { SaveEnvelope } from "../saveVersions";
import { createCompanyState } from "../../company/companyState";
import { createManagedHotel } from "../../company/managedHotels";
import { createLegalEntity } from "../../company/legalEntities";
import { createOperatingContract } from "../../ownership/models";
import { createManagerAuthority } from "../../management/managerAuthority";
import { createStatements } from "../../finance/statements";
import { createInsuranceState } from "../../risk/insurance";
import { createUtilityContracts } from "../../utilities/consumption";
import { createCommercialState } from "../../commercial/commercialState";
import { POINT_VALUE_MINOR } from "../../commercial/loyalty";
import { createReputationState } from "../../reputation/dimensions";
import {
  createContract,
  createWorkforceState,
  employ,
} from "../../staff/employeeLifecycle";
import { createProcurementState } from "../../purchasing/contracts";
import { createGuestRelationsState } from "../../guests/partyLifecycle";
import { createCommercialSpaceState } from "../../facilities/commercialSpaces";
import { compareIds } from "../../domain/ids";

/**
 * v4 saves are of a single hotel with no company above it. The migration
 * wraps that hotel — id unchanged — in a player portfolio and supplies every
 * section the corporate layer depends on. Later tasks in this plan extend the
 * same step with the sections they add; there is no intermediate version.
 *
 * Nothing already in the save is reinterpreted: an old field keeps its old
 * meaning, and everything new is created at its documented default or, where
 * the save already carries the information, derived from it explicitly.
 */
export function migrateV4ToV5(save: SaveEnvelope): SaveEnvelope {
  const state = structuredClone((save.state ?? {}) as Record<string, unknown>);
  const hotel = (state.hotel ?? {}) as { id?: string; name?: string };
  const hotelId =
    typeof hotel.id === "string" && hotel.id ? hotel.id : "hotel.frankfurt.1";

  return {
    ...save,
    saveVersion: 5,
    // This migration's target is historical schema data, not a moving build
    // constant: stamping the current version would silently retarget it.
    contentVersion: "plan-05-v5",
    protocolVersion: 2,
    state: {
      ...state,
      company: migratedCompany(state.company, hotelId),
      statements: normalisedSection(state.statements, createStatements()),
      insurance: normalisedSection(state.insurance, createInsuranceState()),
      utilityContracts: normalisedSection(
        state.utilityContracts,
        createUtilityContracts(),
      ),
      meters: normalisedSection(state.meters, {
        energy: 0,
        water: 0,
        waste: 0,
      }),
      outages: Array.isArray(state.outages) ? state.outages : [],
      commercial: normalisedCommercial(state.commercial),
      reputation: normalisedSection(state.reputation, createReputationState()),
      // A v4 save has staff but no employment records; each of them gets a
      // contract on the terms the save already knows they are paid.
      workforce: normalisedSection(
        state.workforce,
        workforceForLegacyStaff(state.staff),
      ),
      procurement: normalisedSection(
        state.procurement,
        createProcurementState(),
      ),
      guestRelations: normalisedSection(
        state.guestRelations,
        createGuestRelationsState(),
      ),
      recoveries: Array.isArray(state.recoveries) ? state.recoveries : [],
      commercialSpaces: normalisedCommercialSpaces(state.commercialSpaces),
      // Derived, and restated on the first snapshot after the load; the save
      // only carries it so the shape is complete.
      lobby: normalisedSection(state.lobby, {
        served: 0,
        unserved: 0,
        cause: "lobby is coping",
        automation: [] as string[],
      }),
    },
  };
}

/** Repairs fields written by early v5 builds without supplying missing sections. */
export function migrateEarlyV5Fields(save: SaveEnvelope): SaveEnvelope {
  const state = structuredClone((save.state ?? {}) as Record<string, unknown>);
  if (state.commercial && typeof state.commercial === "object")
    state.commercial = normalisedCommercial(state.commercial);
  if (state.commercialSpaces && typeof state.commercialSpaces === "object")
    state.commercialSpaces = normalisedCommercialSpaces(state.commercialSpaces);
  return { ...save, state };
}

/**
 * Fills in a section a v4 save never had, and completes a partial one an
 * early development v5 build may have written. Missing keys take their
 * documented default; keys the save already carries are left exactly as they
 * are, so nothing is reinterpreted.
 */
function normalisedSection<T extends object>(raw: unknown, created: T): T {
  return raw && typeof raw === "object"
    ? { ...created, ...(raw as T) }
    : created;
}

function normalisedCommercial(raw: unknown) {
  const commercial = normalisedSection(raw, createCommercialState());
  const loyalty = normalisedSection(
    commercial.loyalty,
    createCommercialState().loyalty,
  );
  const members = Array.isArray(loyalty.members)
    ? loyalty.members.map((member) => ({ ...member }))
    : [];
  const backedPoints = Math.max(
    0,
    Math.trunc(loyalty.liabilityMinor / POINT_VALUE_MINOR),
  );
  let pointsToRemove = Math.max(
    0,
    members.reduce((sum, member) => sum + member.points, 0) - backedPoints,
  );
  for (const member of members) {
    const removed = Math.min(member.points, pointsToRemove);
    member.points -= removed;
    pointsToRemove -= removed;
  }
  return { ...commercial, loyalty: { ...loyalty, members } };
}

function normalisedCommercialSpaces(raw: unknown) {
  const section = normalisedSection(raw, createCommercialSpaceState());
  return {
    ...section,
    spaces: section.spaces.map((space) => ({
      ...space,
      fitBp: Number.isSafeInteger(space.fitBp)
        ? space.fitBp
        : (space.fit ?? 0) * 100,
    })),
  };
}

/**
 * Gives everybody on a v4 payroll the contract they were implicitly working
 * under. Their wage and skill are already in the save, so nothing is invented
 * beyond the terms the game has always applied to them.
 */
function workforceForLegacyStaff(raw: unknown) {
  const staff = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  return staff.reduce((workforce, raw) => {
    // A malformed row is dropped rather than allowed to throw: one corrupt
    // record must not cost the player the whole campaign.
    const member = raw as {
      id?: unknown;
      monthlyWageMinor?: unknown;
      skill?: unknown;
    };
    if (!member || typeof member !== "object") return workforce;
    if (typeof member.id !== "string" || !member.id) return workforce;
    if (seen.has(member.id)) return workforce;
    seen.add(member.id);
    return employ(workforce, {
      id: `employee.${member.id}`,
      staffId: member.id,
      contract: createContract({
        monthlyWageMinor:
          Number.isSafeInteger(member.monthlyWageMinor) &&
          (member.monthlyWageMinor as number) >= 0
            ? (member.monthlyWageMinor as number)
            : 0,
      }),
      skill:
        Number.isSafeInteger(member.skill) &&
        (member.skill as number) >= 0 &&
        (member.skill as number) <= 100
          ? (member.skill as number)
          : 50,
    });
  }, createWorkforceState());
}

/**
 * Brings an existing company section forward, or creates one. A development
 * v5 save can already carry a partial company, so every field is normalised
 * rather than accepted: loading twice must produce the same state as loading
 * once, whatever shape the earlier build wrote.
 */
function migratedCompany(raw: unknown, hotelId: string): unknown {
  const created = createCompanyState();
  const existing =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const portfolio = normalisedPortfolio(existing.portfolio, hotelId, created);
  const legalEntities = Array.isArray(existing.legalEntities)
    ? existing.legalEntities.map((entity) =>
        createLegalEntity(entity as ReturnType<typeof createLegalEntity>),
      )
    : created.legalEntities;

  const managedHotels = Array.isArray(existing.managedHotels)
    ? existing.managedHotels
        // A record that cannot pass its own constructor is dropped: letting
        // it through would put a corrupt house in front of managedHotelMonth,
        // where it would throw every month for the rest of the campaign.
        .map((hotel) => {
          try {
            return createManagedHotel(
              hotel as ReturnType<typeof createManagedHotel>,
            );
          } catch {
            return null;
          }
        })
        .filter((hotel): hotel is ReturnType<typeof createManagedHotel> =>
          // A managed house that is not in the portfolio would break the
          // invariant, so the portfolio is the authority on membership.
          Boolean(hotel && portfolio.hotelIds.includes(hotel.hotelId)),
        )
    : created.managedHotels;

  const operatingModels: Record<string, unknown> = {};
  for (const id of portfolio.hotelIds) {
    const declared = (existing.operatingModels as Record<string, unknown>)?.[
      id
    ];
    operatingModels[id] = declared
      ? createOperatingContract(
          declared as Parameters<typeof createOperatingContract>[0],
        )
      : { kind: "owned" };
  }

  const treasury = normalisedTreasury(
    existing.treasury,
    portfolio.hotelIds,
    created,
  );

  return {
    ...created,
    ...existing,
    companyId:
      typeof existing.companyId === "string"
        ? existing.companyId
        : created.companyId,
    name: typeof existing.name === "string" ? existing.name : created.name,
    portfolio,
    legalEntities,
    operatingModels,
    brands: Array.isArray(existing.brands) ? existing.brands : created.brands,
    brandAssignments: Array.isArray(existing.brandAssignments)
      ? existing.brandAssignments.filter((assignment) =>
          portfolio.hotelIds.includes(
            (assignment as { hotelId: string }).hotelId,
          ),
        )
      : [],
    brandAudits: Array.isArray(existing.brandAudits)
      ? existing.brandAudits
      : [],
    managedHotels,
    developments: Array.isArray(existing.developments)
      ? existing.developments
      : [],
    budgets: Array.isArray(existing.budgets) ? existing.budgets : [],
    managers: normalisedManagers(
      existing.managers,
      portfolio.hotelIds,
      created,
    ),
    escalations: Array.isArray(existing.escalations)
      ? existing.escalations
      : [],
    treasury,
    acquisitionTargets: Array.isArray(existing.acquisitionTargets)
      ? existing.acquisitionTargets
      : created.acquisitionTargets,
    dueDiligence:
      existing.dueDiligence && typeof existing.dueDiligence === "object"
        ? existing.dueDiligence
        : {},
    headquarters:
      existing.headquarters && typeof existing.headquarters === "object"
        ? { ...created.headquarters, ...(existing.headquarters as object) }
        : created.headquarters,
    hotelResults:
      existing.hotelResults && typeof existing.hotelResults === "object"
        ? existing.hotelResults
        : {},
    sequence: Number.isSafeInteger(existing.sequence)
      ? (existing.sequence as number)
      : 0,
  };
}

function normalisedPortfolio(
  raw: unknown,
  hotelId: string,
  created: ReturnType<typeof createCompanyState>,
): ReturnType<typeof createCompanyState>["portfolio"] {
  const existing =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const declaredIds = Array.isArray(existing.hotelIds)
    ? (existing.hotelIds as string[]).filter(
        (id) => typeof id === "string" && id,
      )
    : [];
  // The save's own hotel is always a member; that is the whole point of the
  // migration, and it keeps its id.
  const hotelIds = [...new Set([hotelId, ...declaredIds])].sort(compareIds);
  const declaredEntity = (existing.hotelLegalEntity ?? {}) as Record<
    string,
    string
  >;
  const declaredRegion = (existing.hotelRegion ?? {}) as Record<string, string>;
  const hotelLegalEntity: Record<string, string> = {};
  const hotelRegion: Record<string, string> = {};
  const defaultEntityId =
    created.portfolio.hotelLegalEntity[created.portfolio.hotelIds[0]] ??
    "entity.de.1";
  const defaultRegionId =
    created.portfolio.hotelRegion[created.portfolio.hotelIds[0]];
  for (const id of hotelIds) {
    hotelLegalEntity[id] = declaredEntity[id] ?? defaultEntityId;
    const region = declaredRegion[id] ?? defaultRegionId;
    if (region) hotelRegion[id] = region;
  }
  return {
    companyId:
      typeof existing.companyId === "string"
        ? existing.companyId
        : created.portfolio.companyId,
    hotelIds,
    hotelLegalEntity,
    hotelRegion,
  };
}

function normalisedManagers(
  raw: unknown,
  hotelIds: readonly string[],
  created: ReturnType<typeof createCompanyState>,
): ReturnType<typeof createCompanyState>["managers"] {
  const declared = Array.isArray(raw)
    ? (raw as ReturnType<typeof createCompanyState>["managers"])
    : [];
  const managers = declared
    .filter((manager) => manager && hotelIds.includes(manager.hotelId))
    .map((manager) => ({
      ...manager,
      authority: createManagerAuthority(manager.authority ?? {}),
    }));
  // Every house in the portfolio has somebody accountable for it.
  for (const hotelId of hotelIds)
    if (!managers.some((manager) => manager.hotelId === hotelId))
      managers.push(
        created.managers.find((m) => m.hotelId === hotelId) ?? {
          id: `manager.${hotelId}`,
          name: `Manager, ${hotelId}`,
          hotelId,
          competence: 55,
          authority: createManagerAuthority(),
        },
      );
  return managers.sort((a, b) => compareIds(a.id, b.id));
}

function normalisedTreasury(
  raw: unknown,
  hotelIds: readonly string[],
  created: ReturnType<typeof createCompanyState>,
): ReturnType<typeof createCompanyState>["treasury"] {
  const existing =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const declared = (existing.hotelCashMinor ?? {}) as Record<string, number>;
  const hotelCashMinor: Record<string, number> = {};
  for (const id of hotelIds)
    hotelCashMinor[id] = Number.isSafeInteger(declared[id]) ? declared[id] : 0;
  return {
    // Headquarters' balance is restated from group cash on the first quantum
    // after the load, so an old or missing figure cannot survive as a lie.
    hqMinor: Number.isSafeInteger(existing.hqMinor)
      ? (existing.hqMinor as number)
      : created.treasury.hqMinor,
    hotelCashMinor,
    reportingCurrency:
      typeof existing.reportingCurrency === "string"
        ? existing.reportingCurrency
        : created.treasury.reportingCurrency,
  };
}
