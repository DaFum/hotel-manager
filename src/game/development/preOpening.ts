/**
 * The gate between a building and a hotel. Every item on the checklist is a
 * real dependency the player has to have arranged somewhere else in the game,
 * so opening is the consequence of being ready rather than a button that
 * grants readiness.
 */
export interface OpeningReadiness {
  staffReady: boolean;
  suppliersReady: boolean;
  inventoryReady: boolean;
  technologyReady: boolean;
  salesOpen: boolean;
}

/** The checklist in the order it is reported; the order is part of the gate. */
export const OPENING_CHECKLIST = [
  "staff",
  "suppliers",
  "inventory",
  "technology",
  "sales",
] as const;

export type OpeningChecklistItem = (typeof OPENING_CHECKLIST)[number];

const FLAG_FOR_ITEM: Record<OpeningChecklistItem, keyof OpeningReadiness> = {
  staff: "staffReady",
  suppliers: "suppliersReady",
  inventory: "inventoryReady",
  technology: "technologyReady",
  sales: "salesOpen",
};

export function evaluateOpeningReadiness(input: OpeningReadiness): {
  ready: boolean;
  missing: OpeningChecklistItem[];
} {
  const missing = OPENING_CHECKLIST.filter(
    (item) => !input[FLAG_FOR_ITEM[item]],
  );
  return { ready: missing.length === 0, missing: [...missing] };
}

/** A scheme between the day it is committed and the day it takes guests. */
export interface PreOpeningProject {
  developmentId: string;
  /** The date the scheme is aiming at; not the date it will actually open. */
  targetOpenDateKey: string;
  readiness: OpeningReadiness;
  status: "preOpening" | "open";
  openedDateKey: string | null;
}

export function createPreOpening(
  developmentId: string,
  targetOpenDateKey: string,
): PreOpeningProject {
  if (!developmentId) throw new Error("a development id is required");
  return {
    developmentId,
    targetOpenDateKey,
    readiness: {
      staffReady: false,
      suppliersReady: false,
      inventoryReady: false,
      technologyReady: false,
      salesOpen: false,
    },
    status: "preOpening",
    openedDateKey: null,
  };
}

export function markPreOpeningTask(
  project: PreOpeningProject,
  item: OpeningChecklistItem,
): PreOpeningProject {
  const flag = FLAG_FOR_ITEM[item];
  if (!flag) throw new Error(`unknown pre-opening checklist item: ${item}`);
  return {
    ...project,
    readiness: { ...project.readiness, [flag]: true },
  };
}

/**
 * Opens the house. Refusing names the outstanding items rather than answering
 * no, because "no" is not something the player can act on.
 */
export function openHotel(
  project: PreOpeningProject,
  dateKey: string,
): PreOpeningProject {
  if (project.status === "open")
    throw new Error(`development ${project.developmentId} is already open`);
  const readiness = evaluateOpeningReadiness(project.readiness);
  if (!readiness.ready)
    throw new Error(`not ready to open: ${readiness.missing.join(", ")}`);
  return { ...project, status: "open", openedDateKey: dateKey };
}
