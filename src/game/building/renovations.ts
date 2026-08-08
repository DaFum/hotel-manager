export interface RenovationJob {
  id: string;
  moduleId: string;
  completesAtMinutes: number;
  status: "active" | "completed";
}

/** The one predefined slice conversion: 60000 DM buys two rooms in three days. */
export const RENOVATION_COST_MINOR = 6_000_000;
export const RENOVATION_MINUTES = 3 * 1440;
export const RENOVATION_ROOMS_ADDED = 2;

export function startRenovation(
  moduleId: string,
  nowMinutes: number,
  cashMinor: number,
): { cashMinor: number; job: RenovationJob } {
  if (cashMinor < RENOVATION_COST_MINOR) throw new Error("insufficient cash");
  return {
    cashMinor: cashMinor - RENOVATION_COST_MINOR,
    job: {
      id: `reno.${moduleId}`,
      moduleId,
      completesAtMinutes: nowMinutes + RENOVATION_MINUTES,
      status: "active",
    },
  };
}

export function completeRenovation(
  job: RenovationJob,
  nowMinutes: number,
): { roomsAdded: number; job: RenovationJob } {
  if (job.status === "completed") return { roomsAdded: 0, job };
  return nowMinutes >= job.completesAtMinutes
    ? {
        roomsAdded: RENOVATION_ROOMS_ADDED,
        job: { ...job, status: "completed" },
      }
    : { roomsAdded: 0, job };
}
