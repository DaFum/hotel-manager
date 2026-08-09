import type { RoomProduct } from "../../rooms/product";

/**
 * A room module is the structural unit the player converts, splits, and
 * upgrades. Fit-out quality lives in data so pricing, appeal, and renovation
 * costs never become UI conditionals.
 */
export interface RoomModule {
  id: string;
  name: string;
  /** The rate category the module sells under. */
  category: string;
  /** Floor area in square metres; drives conversion cost and capacity. */
  areaSqm: number;
  /** Fit-out scores, 0..100. */
  comfort: number;
  bath: number;
  technology: number;
  /** Housekeeping labour for one turnaround, in simulated minutes. */
  cleanMinutes: number;
  /** Linen pieces generated per occupied night. */
  linenPieces: number;
  /** One-off fit-out cost when a module is converted to this product. */
  fitOutCostMinor: number;
}

export const MODULE_LIBRARY: readonly RoomModule[] = [
  {
    id: "room.standard.single",
    name: "Standard single",
    category: "single",
    areaSqm: 16,
    comfort: 55,
    bath: 55,
    technology: 25,
    cleanMinutes: 25,
    linenPieces: 4,
    fitOutCostMinor: 1_800_000,
  },
  {
    id: "room.standard.double",
    name: "Standard double",
    category: "double",
    areaSqm: 22,
    comfort: 62,
    bath: 60,
    technology: 30,
    cleanMinutes: 30,
    linenPieces: 6,
    fitOutCostMinor: 2_400_000,
  },
  {
    id: "room.comfort.double",
    name: "Comfort double",
    category: "double",
    areaSqm: 26,
    comfort: 76,
    bath: 74,
    technology: 55,
    cleanMinutes: 35,
    linenPieces: 7,
    fitOutCostMinor: 3_600_000,
  },
  {
    id: "room.suite.junior",
    name: "Junior suite",
    category: "suite",
    areaSqm: 38,
    comfort: 90,
    bath: 88,
    technology: 70,
    cleanMinutes: 50,
    linenPieces: 9,
    fitOutCostMinor: 6_200_000,
  },
];

export function roomModule(moduleId: string): RoomModule {
  const found = MODULE_LIBRARY.find((m) => m.id === moduleId);
  if (!found) throw new Error(`unknown room module ${moduleId}`);
  return found;
}

/** The default module a rate category is built from at game start. */
export function defaultModuleForCategory(category: string): RoomModule {
  const found = MODULE_LIBRARY.find((m) => m.category === category);
  if (!found) throw new Error(`no module for category ${category}`);
  return found;
}

/**
 * Combines the module's fit-out with a room's own physical and commercial age
 * into the product the appeal rules score.
 */
export function roomProductFor(
  moduleId: string,
  wear: { condition: number; styleAgeYears: number },
): RoomProduct {
  const m = roomModule(moduleId);
  return {
    comfort: m.comfort,
    bath: m.bath,
    technology: m.technology,
    condition: wear.condition,
    styleAgeYears: wear.styleAgeYears,
  };
}
