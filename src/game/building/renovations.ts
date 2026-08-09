import { assertMinutes, assertNonNegativeMinor } from "../domain/units";
import {
  advanceProject,
  blockedRooms,
  PHASE_MINUTES,
  planProject,
  type Project,
} from "../renovation/projects";

/**
 * The building-side view of a renovation. The lifecycle itself lives in
 * `renovation/projects`; this module owns what a finished project does to the
 * hotel — here, converting a shell module into two saleable rooms.
 */
export interface RenovationJob {
  id: string;
  /** The building module being converted. */
  moduleId: string;
  /** The room product the finished rooms are fitted out to. */
  targetModuleId: string;
  project: Project;
}

/** The one predefined slice conversion: 60000 DM buys two rooms. */
export const RENOVATION_COST_MINOR = 6_000_000;
export const RENOVATION_ROOMS_ADDED = 2;
/** Planning, approval, construction and acceptance end to end. */
export const RENOVATION_MINUTES =
  PHASE_MINUTES.planning +
  PHASE_MINUTES.approval +
  PHASE_MINUTES.construction +
  PHASE_MINUTES.acceptance;

export function startRenovation(
  moduleId: string,
  cashMinor: number,
  options: { targetModuleId?: string; affected?: string[] } = {},
): { cashMinor: number; job: RenovationJob } {
  assertNonNegativeMinor(cashMinor, "cash");
  if (cashMinor < RENOVATION_COST_MINOR) throw new Error("insufficient cash");
  const targetModuleId = options.targetModuleId ?? "room.standard.double";
  return {
    cashMinor: cashMinor - RENOVATION_COST_MINOR,
    job: {
      id: `reno.${moduleId}`,
      moduleId,
      targetModuleId,
      // A shell conversion takes no existing room out of service; converting
      // occupied stock passes the affected ids instead.
      project: planProject(targetModuleId, options.affected ?? []),
    },
  };
}

/**
 * Burns `minutes` of project time and reports the rooms that open when the
 * handover is signed off. Rooms appear once, on the acceptance transition.
 */
export function advanceRenovation(
  job: RenovationJob,
  minutes: number,
): { roomsAdded: number; job: RenovationJob } {
  assertMinutes(minutes, "renovation minutes");
  const project = advanceProject(job.project, minutes);
  const justCompleted =
    project.phase === "complete" && job.project.phase !== "complete";
  return {
    roomsAdded: justCompleted ? RENOVATION_ROOMS_ADDED : 0,
    job: { ...job, project },
  };
}

/** Rooms the site currently holds out of order. */
export function renovationBlockedRooms(job: RenovationJob): string[] {
  return blockedRooms(job.project);
}

export function isRenovationComplete(job: RenovationJob): boolean {
  return job.project.phase === "complete";
}
