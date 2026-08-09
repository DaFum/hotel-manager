import { compareIds } from "../domain/ids";
import { assertCount, assertNonNegativeMinor } from "../domain/units";

/**
 * What the engineer does first. Safety comes before money, money comes before
 * tidiness, and anything that will break something else if it is left is
 * treated as more urgent than its own cost suggests — which is the judgement
 * a maintenance schedule exists to encode.
 */
export type WorkClass = "safety" | "revenue" | "followOnDamage" | "cosmetic";

export interface EngineeringJob {
  id: string;
  assetId: string;
  workClass: WorkClass;
  /** Minutes of an engineer's time. */
  minutes: number;
  costMinor: number;
  /** Rooms or facilities out of service until it is done. */
  blocksUnits: number;
  /** What it will cost if it is left another month. */
  deferredCostMinor: number;
}

const CLASS_RANK: Record<WorkClass, number> = {
  safety: 0,
  followOnDamage: 1,
  revenue: 2,
  cosmetic: 3,
};

/**
 * The order the work is actually done in. Within a class the job that keeps
 * the most of the hotel out of sale goes first, and ties break on a stable id
 * so a schedule never depends on the order the faults were reported.
 */
export function prioritiseJobs(
  jobs: readonly EngineeringJob[],
): EngineeringJob[] {
  return [...jobs].sort(
    (a, b) =>
      CLASS_RANK[a.workClass] - CLASS_RANK[b.workClass] ||
      b.blocksUnits - a.blocksUnits ||
      b.deferredCostMinor - a.deferredCostMinor ||
      compareIds(a.id, b.id),
  );
}

/**
 * What the shift can actually get through, and what it had to leave. Deferred
 * work is named with what leaving it will cost, so a backlog is a decision
 * rather than an accident.
 */
export function scheduleShift(input: {
  jobs: readonly EngineeringJob[];
  availableMinutes: number;
  budgetMinor: number;
}): {
  done: EngineeringJob[];
  deferred: EngineeringJob[];
  deferredCostMinor: number;
  cause: string;
} {
  assertCount(input.availableMinutes, "available minutes");
  assertNonNegativeMinor(input.budgetMinor, "engineering budget");
  const done: EngineeringJob[] = [];
  const deferred: EngineeringJob[] = [];
  let minutesLeft = input.availableMinutes;
  let budgetLeft = input.budgetMinor;
  let blocker = "everything scheduled";

  for (const job of prioritiseJobs(input.jobs)) {
    if (job.minutes <= minutesLeft && job.costMinor <= budgetLeft) {
      done.push(job);
      minutesLeft -= job.minutes;
      budgetLeft -= job.costMinor;
      continue;
    }
    if (deferred.length === 0)
      blocker =
        job.minutes > minutesLeft
          ? `out of engineer hours at ${job.id}`
          : `out of budget at ${job.id}`;
    deferred.push(job);
  }
  return {
    done,
    deferred,
    deferredCostMinor: deferred.reduce(
      (sum, job) => sum + job.deferredCostMinor,
      0,
    ),
    cause: blocker,
  };
}

/**
 * A safety job nobody did. The house cannot sell what is unsafe, so deferring
 * safety work is not a saving — it is a decision to take rooms off sale.
 */
export function unsafeUnits(deferred: readonly EngineeringJob[]): number {
  return deferred
    .filter((job) => job.workClass === "safety")
    .reduce((sum, job) => sum + job.blocksUnits, 0);
}
