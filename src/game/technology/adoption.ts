export interface TechnologyProject {
  id: string;
  technologyId: string;
  status: "planned" | "implementing" | "complete";
  remainingMonths: number;
  costMinor: number;
}
export function adoptionCostMinor(baseMinor: number, marketBp: number): number {
  if (
    !Number.isSafeInteger(baseMinor) ||
    !Number.isSafeInteger(marketBp) ||
    baseMinor < 0
  )
    throw new Error("invalid adoption cost inputs");
  return Math.max(
    1,
    Math.round(
      (baseMinor * (13_500 - Math.max(0, Math.min(10_000, marketBp)) / 2)) /
        10_000,
    ),
  );
}
export function advanceTechnologyProject(
  project: TechnologyProject,
  speedBp = 10_000,
): TechnologyProject {
  if (
    !Number.isSafeInteger(project.remainingMonths) ||
    project.remainingMonths < 0
  )
    throw new Error("remaining project months must be whole and non-negative");
  const remainingMonths = Math.max(
    0,
    project.remainingMonths -
      speedScaledProgressMonths(1, { technologySpeedBasisPoints: speedBp }),
  );
  return {
    ...project,
    remainingMonths,
    status: remainingMonths === 0 ? "complete" : "implementing",
  };
}
import { speedScaledProgressMonths } from "../campaign/sandboxEffects";
