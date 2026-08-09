import { assertNonNegativeMinor } from "../domain/units";

/**
 * What a delegated manager may decide alone. Authority is per hotel and
 * per kind of decision, because "trusted" is not a single number: a manager
 * who may buy linen is not thereby allowed to sell the building.
 */
export interface ManagerAuthority {
  /** Repairs and maintenance the manager may commission unasked. */
  repairLimitMinor: number;
  /** Capital spend the manager may commit unasked. */
  capexLimitMinor?: number;
  /** Guest service recovery the manager may authorise unasked. */
  recoveryLimitMinor?: number;
  /** Whether the manager may hire without the group's agreement. */
  mayHire?: boolean;
  /** Whether the manager may reprice rooms without the group's agreement. */
  mayReprice?: boolean;
}

/** A named manager and the authority the group has given them. */
export interface HotelManager {
  id: string;
  name: string;
  hotelId: string;
  /** 0-100; how well the manager runs the house when left to it. */
  competence: number;
  authority: ManagerAuthority;
}

export const DEFAULT_MANAGER_AUTHORITY: ManagerAuthority = {
  repairLimitMinor: 500_000,
  capexLimitMinor: 0,
  recoveryLimitMinor: 20_000,
  mayHire: false,
  mayReprice: true,
};

export function createManagerAuthority(
  authority: Partial<ManagerAuthority> = {},
): ManagerAuthority {
  const merged = { ...DEFAULT_MANAGER_AUTHORITY, ...authority };
  assertNonNegativeMinor(merged.repairLimitMinor, "repair limit");
  assertNonNegativeMinor(merged.capexLimitMinor ?? 0, "capex limit");
  assertNonNegativeMinor(merged.recoveryLimitMinor ?? 0, "recovery limit");
  return merged;
}

export function createManager(input: {
  id: string;
  name: string;
  hotelId: string;
  competence: number;
  authority?: Partial<ManagerAuthority>;
}): HotelManager {
  if (!input.id) throw new Error("a manager id is required");
  if (!input.hotelId) throw new Error("a manager needs a hotel");
  if (
    !Number.isSafeInteger(input.competence) ||
    input.competence < 0 ||
    input.competence > 100
  )
    throw new Error("invalid manager competence");
  return {
    id: input.id,
    name: input.name,
    hotelId: input.hotelId,
    competence: input.competence,
    authority: createManagerAuthority(input.authority),
  };
}

export function managerForHotel(
  managers: readonly HotelManager[],
  hotelId: string,
): HotelManager | null {
  return managers.find((m) => m.hotelId === hotelId) ?? null;
}

/** Raises or lowers a limit without touching the rest of the delegation. */
export function setAuthorityLimit(
  manager: HotelManager,
  limits: Partial<ManagerAuthority>,
): HotelManager {
  return {
    ...manager,
    authority: createManagerAuthority({ ...manager.authority, ...limits }),
  };
}
