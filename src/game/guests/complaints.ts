import { applyBasisPoints, assertNonNegativePfennig } from "../domain/money";

export type ComplaintCause =
  "longCheckIn" | "dirtyRoom" | "brokenAsset" | "breakfastWait";

export interface Complaint {
  id: string;
  partyId: string;
  cause: ComplaintCause;
}

export type RecoveryAction = "apologize" | "discount10";

/** The discount recovery is ten percent of the room charge. */
export const DISCOUNT_RECOVERY_BP = 1000;

/** Guests tolerate twenty minutes at reception before they complain. */
export const CHECK_IN_TOLERANCE_MINUTES = 20;

export function complaintForWait(
  partyId: string,
  minutes: number,
): Complaint | null {
  return minutes > CHECK_IN_TOLERANCE_MINUTES
    ? { id: `complaint.${partyId}`, partyId, cause: "longCheckIn" }
    : null;
}

export interface RecoveryOutcome {
  expenseMinor: number;
  satisfaction: number;
}

/** Who is available to stand behind a gesture, and what the hotel can afford. */
export interface RecoveryAuthority {
  /** Front-desk staff actually on duty; nobody on duty authorises nothing. */
  frontDeskOnDuty: number;
  cashMinor: number;
}

/**
 * Whether this recovery may be made at all.
 *
 * A gesture that nobody is present to make, or that the hotel cannot pay for,
 * is not a gesture — and it must not move money or satisfaction on the way to
 * being refused. Authorisation is therefore decided before anything is
 * resolved, and answers with a reason the player can act on.
 */
export function authorizeRecovery(
  action: RecoveryAction,
  roomChargeMinor: number,
  authority: RecoveryAuthority,
): { ok: true; costMinor: number } | { ok: false; reason: string } {
  if (authority.frontDeskOnDuty <= 0)
    return { ok: false, reason: "nobody is on the desk to authorise it" };
  if (action === "apologize") return { ok: true, costMinor: 0 };
  assertNonNegativePfennig(roomChargeMinor, "room charge");
  const costMinor = applyBasisPoints(roomChargeMinor, DISCOUNT_RECOVERY_BP);
  if (authority.cashMinor < costMinor)
    return { ok: false, reason: "the hotel cannot cover the discount" };
  return { ok: true, costMinor };
}

export function resolveComplaint(
  c: { cause: string; satisfaction: number },
  action: RecoveryAction,
  roomChargeMinor: number,
): RecoveryOutcome {
  if (action === "apologize")
    return { expenseMinor: 0, satisfaction: Math.min(100, c.satisfaction + 5) };
  assertNonNegativePfennig(roomChargeMinor, "room charge");
  return {
    expenseMinor: applyBasisPoints(roomChargeMinor, DISCOUNT_RECOVERY_BP),
    satisfaction: Math.min(100, c.satisfaction + 15),
  };
}
