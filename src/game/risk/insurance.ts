import { compareIds } from "../domain/ids";
import type { XorShift32 } from "../domain/rng";
import { assertBasisPoints, assertNonNegativeMinor } from "../domain/units";

/**
 * Insurance is a contract, not a safety net. Coverage, limit, deductible,
 * exclusions and the value actually declared all decide what a claim pays,
 * and a hotel that under-declares its building finds that out at the worst
 * possible moment — which is the point of modelling it at all.
 */
export type Peril =
  "fire" | "water" | "storm" | "liability" | "businessInterruption";

export interface InsurancePolicy {
  id: string;
  peril: Peril;
  /** What the policy says the property is worth. */
  insuredValueMinor: number;
  /** The most it will ever pay for one loss. */
  limitMinor: number;
  /** What the hotel carries itself before the policy responds. */
  deductibleMinor: number;
  annualRateBasisPoints: number;
  /** Causes the policy will not answer for, whatever the peril. */
  exclusions: string[];
}

export type ClaimStatus = "filed" | "settled" | "declined";

export interface InsuranceClaim {
  id: string;
  policyId: string;
  perilId: string;
  lossMinor: number;
  cause?: string;
  filedAtMinutes: number;
  /** How long the assessor takes; a claim is never instant money. */
  assessmentMinutes: number;
  status: ClaimStatus;
  settlementMinor: number;
  settledAtMinutes: number | null;
}

export interface InsuranceState {
  policies: InsurancePolicy[];
  claims: InsuranceClaim[];
}

export function createInsuranceState(): InsuranceState {
  return { policies: [], claims: [] };
}

export function monthlyPremiumMinor(policy: InsurancePolicy): number {
  assertNonNegativeMinor(policy.insuredValueMinor, "insured value");
  assertBasisPoints(policy.annualRateBasisPoints, "insurance rate");
  return Math.trunc(
    (policy.insuredValueMinor * policy.annualRateBasisPoints) / 10_000 / 12,
  );
}

export function takeOutPolicy(
  state: InsuranceState,
  policy: InsurancePolicy,
): InsuranceState {
  if (!policy.id) throw new Error("a policy id is required");
  assertNonNegativeMinor(policy.insuredValueMinor, "insured value");
  assertNonNegativeMinor(policy.limitMinor, "policy limit");
  assertNonNegativeMinor(policy.deductibleMinor, "policy deductible");
  assertBasisPoints(policy.annualRateBasisPoints, "insurance rate");
  if (policy.limitMinor > policy.insuredValueMinor)
    throw new Error("a policy limit cannot exceed the value it insures");
  if (state.policies.some((p) => p.id === policy.id))
    throw new Error(`policy ${policy.id} already exists`);
  return {
    ...state,
    policies: [
      ...state.policies,
      { ...policy, exclusions: [...policy.exclusions] },
    ].sort((a, b) => compareIds(a.id, b.id)),
  };
}

export function varyPolicy(
  state: InsuranceState,
  policyId: string,
  changes: { deductibleMinor?: number; limitMinor?: number },
): InsuranceState {
  const current = state.policies.find((policy) => policy.id === policyId);
  if (!current) throw new Error(`unknown policy ${policyId}`);
  const policy = { ...current, ...changes };
  assertNonNegativeMinor(policy.limitMinor, "policy limit");
  assertNonNegativeMinor(policy.deductibleMinor, "policy deductible");
  if (policy.limitMinor > policy.insuredValueMinor)
    throw new Error("a policy limit cannot exceed the value it insures");
  return {
    ...state,
    policies: state.policies
      .map((candidate) => (candidate.id === policyId ? policy : candidate))
      .sort((a, b) => compareIds(a.id, b.id)),
  };
}

export function cancelPolicy(
  state: InsuranceState,
  policyId: string,
): InsuranceState {
  if (!state.policies.some((policy) => policy.id === policyId))
    throw new Error(`unknown policy ${policyId}`);
  return {
    ...state,
    policies: state.policies.filter((policy) => policy.id !== policyId),
  };
}

/**
 * Average, in the insurance sense: declare half the value and the policy pays
 * half the loss. The condition is reported as basis points so a partial
 * settlement can always be explained by the number that caused it.
 */
export function underinsuranceBasisPoints(
  policy: InsurancePolicy,
  property: { rebuildValueMinor: number },
): number {
  assertNonNegativeMinor(property.rebuildValueMinor, "rebuild value");
  if (property.rebuildValueMinor === 0) return 10_000;
  return Math.min(
    10_000,
    Math.trunc(
      (policy.insuredValueMinor * 10_000) / property.rebuildValueMinor,
    ),
  );
}

/** What the policy actually pays for one loss, and why it is not more. */
export function settlementMinor(
  policy: InsurancePolicy,
  loss: { perilId: string; lossMinor: number; cause?: string },
  property?: { rebuildValueMinor: number },
): number {
  assertNonNegativeMinor(loss.lossMinor, "loss");
  if (loss.perilId !== policy.peril) return 0;
  if (loss.cause && policy.exclusions.includes(loss.cause)) return 0;
  const averaged = property
    ? Math.trunc(
        (loss.lossMinor * underinsuranceBasisPoints(policy, property)) / 10_000,
      )
    : loss.lossMinor;
  return Math.max(
    0,
    Math.min(policy.limitMinor, averaged - policy.deductibleMinor),
  );
}

/** The shortest and longest an assessor takes, in simulated minutes. */
const MIN_ASSESSMENT_MINUTES = 3 * 1440;
const ASSESSMENT_SPREAD_MINUTES = 11 * 1440;

/**
 * Files a claim. The assessment delay is drawn from the failures stream when
 * one is supplied, so a claim never disturbs the sequence guest demand or the
 * economy will draw from next.
 */
export function fileClaim(
  state: InsuranceState,
  claim: {
    id: string;
    policyId: string;
    perilId: string;
    lossMinor: number;
    filedAtMinutes: number;
    cause?: string;
  },
  failures?: XorShift32,
): InsuranceState {
  if (!state.policies.some((p) => p.id === claim.policyId))
    throw new Error(`unknown policy ${claim.policyId}`);
  if (state.claims.some((c) => c.id === claim.id))
    throw new Error(`claim ${claim.id} already exists`);
  assertNonNegativeMinor(claim.lossMinor, "claim loss");
  const assessmentMinutes = failures
    ? MIN_ASSESSMENT_MINUTES +
      (failures.nextUint32() % ASSESSMENT_SPREAD_MINUTES)
    : MIN_ASSESSMENT_MINUTES;
  return {
    ...state,
    claims: [
      ...state.claims,
      {
        ...claim,
        assessmentMinutes,
        status: "filed" as const,
        settlementMinor: 0,
        settledAtMinutes: null,
      },
    ].sort((a, b) => compareIds(a.id, b.id)),
  };
}

/**
 * Settles a claim once the assessor has finished. Refusing early is the
 * point: the gap between the loss and the money is what makes insurance a
 * cash-flow problem as well as a cost.
 */
export function settleClaim(
  state: InsuranceState,
  claimId: string,
  input: { atMinutes: number; rebuildValueMinor: number },
): InsuranceState {
  const claim = state.claims.find((c) => c.id === claimId);
  if (!claim) throw new Error(`unknown claim ${claimId}`);
  if (claim.status !== "filed")
    throw new Error(`claim ${claimId} was already ${claim.status}`);
  if (input.atMinutes < claim.filedAtMinutes + claim.assessmentMinutes)
    throw new Error(`claim ${claimId} is still being assessed`);
  const policy = state.policies.find((p) => p.id === claim.policyId)!;
  const settlement = settlementMinor(
    policy,
    { perilId: claim.perilId, lossMinor: claim.lossMinor, cause: claim.cause },
    { rebuildValueMinor: input.rebuildValueMinor },
  );
  return {
    ...state,
    claims: state.claims.map((c) =>
      c.id === claimId
        ? {
            ...c,
            status:
              settlement > 0 ? ("settled" as const) : ("declined" as const),
            settlementMinor: settlement,
            settledAtMinutes: input.atMinutes,
          }
        : c,
    ),
  };
}

/** Every policy's premium for the month, in stable id order. */
export function totalMonthlyPremiumMinor(state: InsuranceState): number {
  return [...state.policies]
    .sort((a, b) => compareIds(a.id, b.id))
    .reduce((sum, policy) => sum + monthlyPremiumMinor(policy), 0);
}
