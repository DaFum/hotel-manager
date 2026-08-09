import { compareIds } from "../domain/ids";
import type { ManagerAuthority } from "./managerAuthority";

export type { ManagerAuthority } from "./managerAuthority";

/**
 * A decision a delegated manager is about to take. Every kind the group cares
 * about is named, so the authority check is a rule about hotels rather than a
 * number compared against an anonymous amount.
 */
export type LocalDecision =
  | { kind: "repair"; amountMinor: number }
  | { kind: "capex"; amountMinor: number }
  | { kind: "recovery"; amountMinor: number }
  | { kind: "hire"; monthlyWageMinor: number }
  | { kind: "reprice"; rateMinor: number }
  | { kind: "sell-hotel" };

export type EscalationVerdict = "allow" | "escalate";

export function decideEscalation(
  authority: ManagerAuthority,
  decision: LocalDecision,
): EscalationVerdict {
  return escalationReason(authority, decision) === null ? "allow" : "escalate";
}

/**
 * Why a decision has to go up, or null when it does not. The reason is the
 * point: an escalation the group cannot read is an escalation it cannot
 * answer, and the manager is left waiting for nothing.
 */
export function escalationReason(
  authority: ManagerAuthority,
  decision: LocalDecision,
): string | null {
  switch (decision.kind) {
    case "sell-hotel":
      return "selling a hotel is never delegated";
    case "repair":
      return withinLimit(
        decision.amountMinor,
        authority.repairLimitMinor,
        "repair",
      );
    case "capex":
      return withinLimit(
        decision.amountMinor,
        authority.capexLimitMinor ?? 0,
        "capex",
      );
    case "recovery":
      return withinLimit(
        decision.amountMinor,
        authority.recoveryLimitMinor ?? 0,
        "recovery",
      );
    case "hire":
      return authority.mayHire
        ? null
        : `hiring at ${decision.monthlyWageMinor} is not delegated`;
    case "reprice":
      return authority.mayReprice
        ? null
        : `repricing to ${decision.rateMinor} is not delegated`;
  }
}

function withinLimit(
  amountMinor: number,
  limitMinor: number,
  label: string,
): string | null {
  // A malformed amount escalates rather than passing: the group answers what
  // the manager could not, and nothing is spent on a number nobody validated.
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
    return `${label} amount ${amountMinor} is not whole Pfennig`;
  return amountMinor <= limitMinor
    ? null
    : `${label} of ${amountMinor} exceeds the ${limitMinor} ${label} limit`;
}

export type EscalationStatus = "open" | "approved" | "rejected";

/** One decision waiting on the group, with everything needed to answer it. */
export interface Escalation {
  id: string;
  hotelId: string;
  managerId: string;
  raisedAtMinutes: number;
  decision: LocalDecision;
  reason: string;
  status: EscalationStatus;
  resolvedAtMinutes: number | null;
}

export function raiseEscalation(
  open: readonly Escalation[],
  input: Omit<Escalation, "status" | "resolvedAtMinutes">,
): Escalation[] {
  if (open.some((e) => e.id === input.id))
    throw new Error(`escalation ${input.id} was already raised`);
  return [
    ...open,
    { ...input, status: "open" as const, resolvedAtMinutes: null },
  ].sort((a, b) => compareIds(a.id, b.id));
}

/**
 * The group's answer. Only an open escalation can be answered, so a late
 * second answer cannot quietly overturn a decision already acted on.
 */
export function resolveEscalation(
  escalations: readonly Escalation[],
  id: string,
  status: Exclude<EscalationStatus, "open">,
  atMinutes: number,
): Escalation[] {
  const target = escalations.find((e) => e.id === id);
  if (!target) throw new Error(`unknown escalation ${id}`);
  if (target.status !== "open")
    throw new Error(`escalation ${id} was already ${target.status}`);
  return escalations.map((e) =>
    e.id === id ? { ...e, status, resolvedAtMinutes: atMinutes } : e,
  );
}

export function openEscalations(
  escalations: readonly Escalation[],
): Escalation[] {
  return escalations.filter((e) => e.status === "open");
}
