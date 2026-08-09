import { compareIds } from "../domain/ids";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
} from "../domain/units";

/**
 * The parts of a hotel that are not bedrooms: shops, parking, outdoor areas
 * and the security that has to cover all of it. Each one declares capacity,
 * hours, its own economics and its own staffing, and each can be run by the
 * hotel or let to somebody else — which is the same ownership decision the
 * group makes about a whole hotel, one floor down.
 */
export type SpaceKind =
  "shop" | "parking" | "outdoor" | "mobility" | "security";

/** How a commercial space is run, and therefore what the hotel earns from it. */
export type OperatorModel =
  | { kind: "self"; marginBasisPoints: number }
  | { kind: "lease"; monthlyRentMinor: number }
  | { kind: "concession"; revenueShareBasisPoints: number };

export interface CommercialSpace {
  id: string;
  kind: SpaceKind;
  /** Units the space can serve at once: covers, bays, seats, guests. */
  capacity: number;
  openMinute: number;
  closeMinute: number;
  /** What one unit of use is sold for; zero for spaces that sell nothing. */
  unitPriceMinor: number;
  operator: OperatorModel;
  /** People it needs on duty to open at all. */
  staffRequired: number;
  /** 0-100; how well it suits the house's guests. */
  fit: number;
  /** Monthly upkeep, whoever runs it. */
  maintenanceMinor: number;
}

export function createCommercialSpace(space: CommercialSpace): CommercialSpace {
  if (!space.id) throw new Error("a commercial space id is required");
  assertCount(space.capacity, "space capacity");
  assertCount(space.staffRequired, "space staffing");
  assertNonNegativeMinor(space.unitPriceMinor, "space unit price");
  assertNonNegativeMinor(space.maintenanceMinor, "space maintenance");
  if (space.closeMinute <= space.openMinute)
    throw new Error("a space must close after it opens");
  switch (space.operator.kind) {
    case "self":
      assertBasisPoints(space.operator.marginBasisPoints, "operating margin");
      break;
    case "lease":
      assertNonNegativeMinor(space.operator.monthlyRentMinor, "space rent");
      break;
    case "concession":
      assertBasisPoints(
        space.operator.revenueShareBasisPoints,
        "concession share",
      );
      break;
  }
  return { ...space };
}

/** Whether the space is open at a given minute of the hotel day. */
export function isOpen(space: CommercialSpace, minuteOfDay: number): boolean {
  return minuteOfDay >= space.openMinute && minuteOfDay < space.closeMinute;
}

/**
 * What the space actually served, and why it could not serve more. Staffing
 * is a hard gate: a shop nobody is standing in does not open, whatever its
 * capacity says.
 */
export function spaceThroughput(input: {
  space: CommercialSpace;
  demand: number;
  staffOnDuty: number;
  minuteOfDay: number;
}): { served: number; turnedAway: number; cause: string } {
  assertCount(input.demand, "space demand");
  assertCount(input.staffOnDuty, "staff on duty");
  const { space } = input;
  if (!isOpen(space, input.minuteOfDay))
    return { served: 0, turnedAway: input.demand, cause: "closed" };
  if (input.staffOnDuty < space.staffRequired)
    return {
      served: 0,
      turnedAway: input.demand,
      cause: `unstaffed: needs ${space.staffRequired}, has ${input.staffOnDuty}`,
    };
  const served = Math.min(space.capacity, input.demand);
  return {
    served,
    turnedAway: input.demand - served,
    cause: served < input.demand ? "at capacity" : "demand",
  };
}

/**
 * What the hotel earns from the space this month. The three operator models
 * differ in exactly what the hotel keeps and what risk it carries, which is
 * the whole reason to have a choice.
 */
export function monthlyContributionMinor(
  space: CommercialSpace,
  unitsSold: number,
): { grossRevenueMinor: number; hotelShareMinor: number; memo: string } {
  assertCount(unitsSold, "units sold");
  const grossRevenueMinor = unitsSold * space.unitPriceMinor;
  switch (space.operator.kind) {
    case "self":
      return {
        grossRevenueMinor,
        // Self-operation keeps the margin and carries the whole cost.
        hotelShareMinor:
          Math.trunc(
            (grossRevenueMinor * space.operator.marginBasisPoints) / 10_000,
          ) - space.maintenanceMinor,
        memo: `${space.id} self-operated`,
      };
    case "lease":
      return {
        grossRevenueMinor,
        // A lease is rent whether the tenant trades well or badly.
        hotelShareMinor:
          space.operator.monthlyRentMinor - space.maintenanceMinor,
        memo: `${space.id} let`,
      };
    case "concession":
      return {
        grossRevenueMinor,
        hotelShareMinor:
          Math.trunc(
            (grossRevenueMinor * space.operator.revenueShareBasisPoints) /
              10_000,
          ) - space.maintenanceMinor,
        memo: `${space.id} concession`,
      };
  }
}

/**
 * Security load. Guests, events and the commercial spaces the hotel opened
 * all add to it, so a shopping arcade is a staffing decision as well as an
 * income one.
 */
export function securityLoad(input: {
  inHouseGuests: number;
  eventGuests: number;
  openSpaces: number;
}): { load: number; guardsRequired: number; cause: string } {
  assertCount(input.inHouseGuests, "in-house guests");
  assertCount(input.eventGuests, "event guests");
  assertCount(input.openSpaces, "open spaces");
  const load =
    input.inHouseGuests + input.eventGuests * 2 + input.openSpaces * 25;
  return {
    load,
    guardsRequired: Math.max(1, Math.ceil(load / 120)),
    cause: `${input.inHouseGuests} in house, ${input.eventGuests} at events, ${input.openSpaces} spaces open`,
  };
}

export interface CommercialSpaceState {
  spaces: CommercialSpace[];
  /** Units each space has sold this month, by space id. */
  unitsSold: Record<string, number>;
}

export function createCommercialSpaceState(): CommercialSpaceState {
  return { spaces: [], unitsSold: {} };
}

export function addSpace(
  state: CommercialSpaceState,
  space: CommercialSpace,
): CommercialSpaceState {
  if (state.spaces.some((s) => s.id === space.id))
    throw new Error(`commercial space ${space.id} already exists`);
  return {
    ...state,
    spaces: [...state.spaces, createCommercialSpace(space)].sort((a, b) =>
      compareIds(a.id, b.id),
    ),
  };
}

export function recordUse(
  state: CommercialSpaceState,
  spaceId: string,
  units: number,
): CommercialSpaceState {
  assertCount(units, "units used");
  if (!state.spaces.some((s) => s.id === spaceId))
    throw new Error(`unknown commercial space ${spaceId}`);
  return {
    ...state,
    unitsSold: {
      ...state.unitsSold,
      [spaceId]: (state.unitsSold[spaceId] ?? 0) + units,
    },
  };
}

export function startSpaceMonth(
  state: CommercialSpaceState,
): CommercialSpaceState {
  return { ...state, unitsSold: {} };
}
