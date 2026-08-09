import { compareIds } from "../domain/ids";
import { assertBasisPoints, assertScore } from "../domain/units";

/**
 * What a brand promises. A standard is a list of concrete requirements, not a
 * quality score: the player must be able to read exactly which promise a house
 * is breaking, and fix that one thing.
 */
export interface BrandStandard {
  /** 0-100 room product score the house must reach. */
  minRoomQuality: number;
  /** Facility ids every house carrying the brand must operate. */
  requiredFacilities: string[];
  /** 0-100 guest satisfaction the brand will tolerate before it is a failure. */
  minGuestSatisfaction?: number;
  /** Stars the brand's classification promises. */
  minStars?: number;
}

/**
 * A brand as the group owns it. Its name is player-facing text; its id is the
 * authoritative reference, so renaming a brand never rewrites a save.
 */
export interface Brand {
  id: string;
  name: string;
  standard: BrandStandard;
  /**
   * What the brand is worth in demand: extra market capture, in basis points,
   * for a house that is actually compliant. Non-compliance does not earn it.
   */
  demandUpliftBasisPoints: number;
  /** Recurring cost of running the brand programme, per hotel per month. */
  monthlyProgrammeCostMinor: number;
}

/** Which brand a hotel carries, and since when. */
export interface BrandAssignment {
  hotelId: string;
  brandId: string;
  /** Game date the flag went up; a rebrand replaces the assignment. */
  sinceDateKey: string;
}

export function createBrand(input: Brand): Brand {
  if (!input.id) throw new Error("a brand id is required");
  if (!input.name) throw new Error("a brand name is required");
  assertBasisPoints(input.demandUpliftBasisPoints, "brand demand uplift");
  if (input.demandUpliftBasisPoints > 10_000)
    throw new Error("invalid brand demand uplift");
  if (
    !Number.isSafeInteger(input.monthlyProgrammeCostMinor) ||
    input.monthlyProgrammeCostMinor < 0
  )
    throw new Error("invalid brand programme cost");
  return { ...input, standard: createBrandStandard(input.standard) };
}

export function createBrandStandard(standard: BrandStandard): BrandStandard {
  assertScore(standard.minRoomQuality, "brand minimum room quality");
  if (standard.minGuestSatisfaction !== undefined)
    assertScore(
      standard.minGuestSatisfaction,
      "brand minimum guest satisfaction",
    );
  if (standard.minStars !== undefined) {
    if (
      !Number.isSafeInteger(standard.minStars) ||
      standard.minStars < 0 ||
      standard.minStars > 5
    )
      throw new Error("invalid brand minimum stars");
  }
  return {
    ...standard,
    // Stable order so two standards written in a different order audit the
    // same way and report failures in the same sequence.
    requiredFacilities: [...standard.requiredFacilities].sort(compareIds),
  };
}

export function registerBrand(brands: readonly Brand[], brand: Brand): Brand[] {
  if (brands.some((b) => b.id === brand.id))
    throw new Error(`brand ${brand.id} already exists`);
  return [...brands, brand].sort((a, b) => compareIds(a.id, b.id));
}

export function findBrand(
  brands: readonly Brand[],
  brandId: string,
): Brand | null {
  return brands.find((b) => b.id === brandId) ?? null;
}

export function brandForHotel(
  assignments: readonly BrandAssignment[],
  hotelId: string,
): BrandAssignment | null {
  return assignments.find((a) => a.hotelId === hotelId) ?? null;
}

/**
 * Flies a brand over a hotel, replacing whatever it carried. Rebranding is a
 * replacement rather than an addition: a house carries one flag at a time.
 */
export function assignBrand(
  assignments: readonly BrandAssignment[],
  assignment: BrandAssignment,
): BrandAssignment[] {
  if (!assignment.hotelId) throw new Error("a hotel id is required");
  if (!assignment.brandId) throw new Error("a brand id is required");
  return [
    ...assignments.filter((a) => a.hotelId !== assignment.hotelId),
    { ...assignment },
  ].sort((a, b) => compareIds(a.hotelId, b.hotelId));
}

export function removeBrandAssignment(
  assignments: readonly BrandAssignment[],
  hotelId: string,
): BrandAssignment[] {
  return assignments.filter((a) => a.hotelId !== hotelId);
}
