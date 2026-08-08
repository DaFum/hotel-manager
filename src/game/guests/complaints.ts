export type ComplaintCause =
  "longCheckIn" | "dirtyRoom" | "brokenAsset" | "breakfastWait";

export interface Complaint {
  id: string;
  partyId: string;
  cause: ComplaintCause;
}

export type RecoveryAction = "apologize" | "discount10";

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

export function resolveComplaint(
  c: { cause: string; satisfaction: number },
  action: RecoveryAction,
  roomChargeMinor: number,
): RecoveryOutcome {
  if (action === "apologize")
    return { expenseMinor: 0, satisfaction: Math.min(100, c.satisfaction + 5) };
  return {
    expenseMinor: Math.round(roomChargeMinor * 0.1),
    satisfaction: Math.min(100, c.satisfaction + 15),
  };
}
