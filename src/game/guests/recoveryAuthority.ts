import {
  decideEscalation,
  type ManagerAuthority,
} from "../management/escalation";
import { assertNonNegativeMinor, assertScore } from "../domain/units";

/**
 * Putting a failure right. Recovery is bounded by who is standing there: a
 * receptionist can move a guest and comp a breakfast, and anything larger has
 * to go up. What recovery can never do is unmake the failure — a guest who
 * was moved at midnight remembers being moved at midnight.
 */
export type ComplaintSeverity = "minor" | "serious" | "severe";

export interface Complaint {
  id: string;
  bookingId: string;
  stage: string;
  cause: string;
  severity: ComplaintSeverity;
  raisedAtMinutes: number;
}

export interface RecoveryOffer {
  id: string;
  complaintId: string;
  /** What is being given: an upgrade, a free night, money back. */
  remedy: string;
  costMinor: number;
}

export type RecoveryVerdict =
  { authorised: true } | { authorised: false; reason: string };

/** What a failure of each severity does to the guest, before any recovery. */
export const SEVERITY_IMPACT: Record<ComplaintSeverity, number> = {
  minor: -6,
  serious: -18,
  severe: -35,
};

/**
 * The most recovery can ever win back, as a share of the damage in basis
 * points. Deliberately short of the whole: the failure still happened.
 */
export const MAX_RECOVERY_SHARE_BP = 6000;

export function authoriseRecovery(
  authority: ManagerAuthority,
  offer: RecoveryOffer,
): RecoveryVerdict {
  assertNonNegativeMinor(offer.costMinor, "recovery cost");
  const verdict = decideEscalation(authority, {
    kind: "recovery",
    amountMinor: offer.costMinor,
  });
  return verdict === "allow"
    ? { authorised: true }
    : {
        authorised: false,
        reason: `recovery of ${offer.costMinor} exceeds the ${authority.recoveryLimitMinor} recovery limit`,
      };
}

/**
 * What the guest actually feels afterwards. The recovery mitigates; the
 * original failure is still on the record, and a bigger cheque cannot buy
 * back more than the ceiling allows.
 */
export function satisfactionAfterRecovery(input: {
  before: number;
  severity: ComplaintSeverity;
  recoveryCostMinor: number;
  /** What a full remedy would cost for this severity. */
  fullRemedyCostMinor: number;
}): { after: number; recovered: number; causes: string[] } {
  assertScore(input.before, "satisfaction before");
  assertNonNegativeMinor(input.recoveryCostMinor, "recovery cost");
  assertNonNegativeMinor(input.fullRemedyCostMinor, "full remedy cost");

  const damage = SEVERITY_IMPACT[input.severity];
  const shareBp =
    input.fullRemedyCostMinor === 0
      ? 0
      : Math.min(
          MAX_RECOVERY_SHARE_BP,
          Math.trunc(
            (input.recoveryCostMinor * MAX_RECOVERY_SHARE_BP) /
              input.fullRemedyCostMinor,
          ),
        );
  const recovered = Math.trunc((-damage * shareBp) / 10_000);
  return {
    after: Math.max(0, Math.min(100, input.before + damage + recovered)),
    recovered,
    causes: [
      `${input.severity} failure (${damage})`,
      recovered > 0 ? `recovery (+${recovered})` : "no recovery offered",
    ],
  };
}

export type RecoveryStatus = "offered" | "accepted" | "refused" | "escalated";

/** One failure and everything done about it, kept together for the record. */
export interface RecoveryRecord {
  complaint: Complaint;
  offer: RecoveryOffer | null;
  status: RecoveryStatus;
  /** Only ever posted for an authorised, accepted recovery. */
  postedCostMinor: number;
  authorisedBy: string | null;
}

export function openComplaint(complaint: Complaint): RecoveryRecord {
  if (!complaint.cause) throw new Error("a complaint needs a cause");
  return {
    complaint,
    offer: null,
    status: "offered",
    postedCostMinor: 0,
    authorisedBy: null,
  };
}

/**
 * Applies an offer. A refused authorisation is atomic: the record says it was
 * escalated, and not a Pfennig is posted.
 */
export function applyRecovery(
  record: RecoveryRecord,
  offer: RecoveryOffer,
  authority: ManagerAuthority,
  managerId: string,
): RecoveryRecord {
  if (record.status !== "offered")
    throw new Error(
      `complaint ${record.complaint.id} is already ${record.status}`,
    );
  const verdict = authoriseRecovery(authority, offer);
  if (!verdict.authorised)
    return { ...record, offer, status: "escalated", postedCostMinor: 0 };
  return {
    ...record,
    offer,
    status: "accepted",
    postedCostMinor: offer.costMinor,
    authorisedBy: managerId,
  };
}

/** A complaint the house decided not to answer at all. */
export function refuseRecovery(record: RecoveryRecord): RecoveryRecord {
  if (record.status !== "offered")
    throw new Error(
      `complaint ${record.complaint.id} is already ${record.status}`,
    );
  return { ...record, status: "refused", postedCostMinor: 0 };
}
