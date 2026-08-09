import { compareIds } from "../domain/ids";
import { assertCount, assertNonNegativeMinor } from "../domain/units";

/**
 * A loyalty scheme is a liability with a marketing department attached. Points
 * earned are money the group owes; points that will never be redeemed are
 * money it can release. Both have to be on the books, or the scheme looks
 * free right up until it is not.
 */
export type LoyaltyTier = "none" | "silver" | "gold";

export interface LoyaltyMember {
  guestId: string;
  points: number;
  tier: LoyaltyTier;
  /** Nights this year; tiers are earned by staying, not by joining. */
  qualifyingNights: number;
}

export interface LoyaltyState {
  members: LoyaltyMember[];
  /** What the outstanding points would cost to honour, in Pfennig. */
  liabilityMinor: number;
}

/** Points earned per Pfennig of room revenue, as points per 100 Pfennig. */
export const POINTS_PER_HUNDRED_MINOR = 1;
/** What one point costs the group when it is burnt. */
export const POINT_VALUE_MINOR = 8;
/** Share of points never redeemed, in basis points; released as breakage. */
export const BREAKAGE_BASIS_POINTS = 1200;

const TIER_THRESHOLDS: readonly { tier: LoyaltyTier; nights: number }[] = [
  { tier: "gold", nights: 40 },
  { tier: "silver", nights: 12 },
  { tier: "none", nights: 0 },
];

export function createLoyaltyState(): LoyaltyState {
  return { members: [], liabilityMinor: 0 };
}

export function tierForNights(qualifyingNights: number): LoyaltyTier {
  assertCount(qualifyingNights, "qualifying nights");
  return (
    TIER_THRESHOLDS.find((t) => qualifyingNights >= t.nights)?.tier ?? "none"
  );
}

/** What a tier is actually worth to the guest; benefits, not badges. */
export function tierBenefits(tier: LoyaltyTier): string[] {
  switch (tier) {
    case "gold":
      return ["late-checkout", "room-upgrade", "free-breakfast"];
    case "silver":
      return ["late-checkout"];
    case "none":
      return [];
  }
}

export function earnPoints(
  state: LoyaltyState,
  input: { guestId: string; roomRevenueMinor: number; nights: number },
): LoyaltyState {
  assertNonNegativeMinor(input.roomRevenueMinor, "room revenue");
  assertCount(input.nights, "nights");
  const points = Math.trunc(
    (input.roomRevenueMinor * POINTS_PER_HUNDRED_MINOR) / 100,
  );
  const existing = state.members.find((m) => m.guestId === input.guestId);
  const qualifyingNights = (existing?.qualifyingNights ?? 0) + input.nights;
  const member: LoyaltyMember = {
    guestId: input.guestId,
    points: (existing?.points ?? 0) + points,
    qualifyingNights,
    tier: tierForNights(qualifyingNights),
  };
  return {
    members: [
      ...state.members.filter((m) => m.guestId !== input.guestId),
      member,
    ].sort((a, b) => compareIds(a.guestId, b.guestId)),
    liabilityMinor: state.liabilityMinor + points * POINT_VALUE_MINOR,
  };
}

/**
 * Burning points costs the group real money and releases the same amount of
 * liability. Refusing a burn the member cannot afford keeps the two sides in
 * step; a negative balance would be a debt the guest owes the hotel.
 */
export function burnPoints(
  state: LoyaltyState,
  input: { guestId: string; points: number },
): { state: LoyaltyState; costMinor: number } {
  assertCount(input.points, "points burnt");
  const member = state.members.find((m) => m.guestId === input.guestId);
  if (!member) throw new Error(`unknown loyalty member ${input.guestId}`);
  if (input.points > member.points)
    throw new Error("a member cannot burn points they have not earned");
  const costMinor = input.points * POINT_VALUE_MINOR;
  return {
    state: {
      members: state.members.map((m) =>
        m.guestId === input.guestId
          ? { ...m, points: m.points - input.points }
          : m,
      ),
      liabilityMinor: state.liabilityMinor - costMinor,
    },
    costMinor,
  };
}

/**
 * Points nobody will ever come back for. Releasing them is income, and the
 * group has to say how much it released rather than letting the liability
 * quietly drift.
 *
 * Releasing writes off the points as well as the money. Taking the money into
 * income while leaving the points on the members' balances would let those
 * same points be burnt later against a liability that no longer covers them,
 * and the group would end up owing a negative amount.
 */
export function releaseBreakageMinor(state: LoyaltyState): {
  state: LoyaltyState;
  releasedMinor: number;
  writtenOffPoints: number;
} {
  const writtenOffPoints = [...state.members]
    .sort((a, b) => compareIds(a.guestId, b.guestId))
    .reduce(
      (sum, member) =>
        sum + Math.trunc((member.points * BREAKAGE_BASIS_POINTS) / 10_000),
      0,
    );
  const releasedMinor = writtenOffPoints * POINT_VALUE_MINOR;
  return {
    state: {
      members: state.members.map((member) => ({
        ...member,
        points:
          member.points -
          Math.trunc((member.points * BREAKAGE_BASIS_POINTS) / 10_000),
      })),
      liabilityMinor: state.liabilityMinor - releasedMinor,
    },
    releasedMinor,
    writtenOffPoints,
  };
}

/** What the group would owe if every outstanding point were burnt today. */
export function outstandingLiabilityMinor(state: LoyaltyState): number {
  return (
    state.members.reduce((sum, member) => sum + member.points, 0) *
    POINT_VALUE_MINOR
  );
}

/**
 * A member earning at one hotel and burning at another is the whole point of
 * a group scheme, and it moves money between them. The cost lands where the
 * points were spent, not where they were earned.
 */
export function crossHotelSettlementMinor(input: {
  earnedAtHotelId: string;
  burntAtHotelId: string;
  costMinor: number;
}): { fromHotelId: string; toHotelId: string; amountMinor: number } | null {
  assertNonNegativeMinor(input.costMinor, "loyalty settlement");
  if (input.earnedAtHotelId === input.burntAtHotelId) return null;
  return {
    fromHotelId: input.earnedAtHotelId,
    toHotelId: input.burntAtHotelId,
    amountMinor: input.costMinor,
  };
}

export function memberFor(
  state: LoyaltyState,
  guestId: string,
): LoyaltyMember | null {
  return state.members.find((m) => m.guestId === guestId) ?? null;
}
