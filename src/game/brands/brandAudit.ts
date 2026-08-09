import { addDays } from "../domain/calendar";
import {
  brandForHotel,
  findBrand,
  type Brand,
  type BrandAssignment,
  type BrandStandard,
} from "./brandTypes";

/** What the auditor can actually see when they walk the house. */
export interface BrandAuditInput {
  roomQuality: number;
  facilities: string[];
  guestSatisfaction?: number;
  stars?: number;
}

export interface BrandAuditResult {
  compliant: boolean;
  /**
   * The promises this house is breaking, named so each one can be fixed. A
   * facility failure carries the facility's own id; nothing collapses into a
   * score the player cannot act on.
   */
  failures: string[];
}

/** Days a failed house has to put the fault right before the flag comes down. */
export const REMEDIATION_GRACE_DAYS = 30;

export function auditBrand(
  standard: BrandStandard,
  hotel: BrandAuditInput,
): BrandAuditResult {
  const failures: string[] = [];
  if (hotel.roomQuality < standard.minRoomQuality)
    failures.push("room-quality");
  if (
    standard.minGuestSatisfaction !== undefined &&
    (hotel.guestSatisfaction ?? 0) < standard.minGuestSatisfaction
  )
    failures.push("guest-satisfaction");
  if (standard.minStars !== undefined && (hotel.stars ?? 0) < standard.minStars)
    failures.push("stars");
  // Sorted so the same house always reports the same sequence, whatever order
  // the standard or the hotel happens to list its facilities in.
  for (const id of [...standard.requiredFacilities].sort())
    if (!hotel.facilities.includes(id)) failures.push(id);
  return { compliant: failures.length === 0, failures };
}

/** One audit, kept for the record with its causes and its deadline. */
export interface BrandAuditRecord {
  hotelId: string;
  brandId: string;
  dateKey: string;
  compliant: boolean;
  failures: string[];
  /** When the flag comes down if nothing changes; null when compliant. */
  remediationDueDateKey: string | null;
}

export function recordAudit(input: {
  hotelId: string;
  brandId: string;
  dateKey: string;
  result: BrandAuditResult;
}): BrandAuditRecord {
  return {
    hotelId: input.hotelId,
    brandId: input.brandId,
    dateKey: input.dateKey,
    compliant: input.result.compliant,
    failures: [...input.result.failures],
    remediationDueDateKey: input.result.compliant
      ? null
      : scheduleRemediation(input.dateKey),
  };
}

export function scheduleRemediation(dateKey: string): string {
  return addDays(dateKey, REMEDIATION_GRACE_DAYS);
}

/**
 * What the flag is worth today. A brand pays only while the house keeps its
 * promises, so the uplift is a consequence of compliance rather than of
 * having signed the contract.
 */
export function brandDemandUpliftBp(
  brands: readonly Brand[],
  assignments: readonly BrandAssignment[],
  hotelId: string,
  hotel: BrandAuditInput,
): number {
  const assignment = brandForHotel(assignments, hotelId);
  if (!assignment) return 0;
  const brand = findBrand(brands, assignment.brandId);
  if (!brand) return 0;
  return auditBrand(brand.standard, hotel).compliant
    ? brand.demandUpliftBasisPoints
    : 0;
}
