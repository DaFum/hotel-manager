import type { RoomProduct } from "../../rooms/product";
import { CORE_CONTENT_REGISTRY } from "../corePack";
export interface RoomModule {
  id: string;
  name: string;
  category: string;
  areaSqm: number;
  comfort: number;
  bath: number;
  technology: number;
  cleanMinutes: number;
  linenPieces: number;
  fitOutCostMinor: number;
}
export const MODULE_LIBRARY: readonly RoomModule[] = [
  ...CORE_CONTENT_REGISTRY.allByKind("roomProduct"),
]
  .sort((a, b) => a.simulationOrder - b.simulationOrder)
  .map((entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    areaSqm: entry.areaSquareMeters,
    comfort: Math.round(entry.comfortBasisPoints / 100),
    bath: Math.round(entry.bathBasisPoints / 100),
    technology: Math.round(entry.technologyBasisPoints / 100),
    cleanMinutes: entry.cleanMinutes,
    linenPieces: entry.linenPieces,
    fitOutCostMinor: entry.fitOutCostMinor,
  }));
export function roomModule(moduleId: string): RoomModule {
  const found = MODULE_LIBRARY.find((module) => module.id === moduleId);
  if (!found) throw new Error(`unknown room module ${moduleId}`);
  return found;
}
export function defaultModuleForCategory(category: string): RoomModule {
  const found = MODULE_LIBRARY.find((module) => module.category === category);
  if (!found) throw new Error(`no module for category ${category}`);
  return found;
}
export function roomProductFor(
  moduleId: string,
  wear: { condition: number; styleAgeYears: number },
): RoomProduct {
  const module = roomModule(moduleId);
  return {
    comfort: module.comfort,
    bath: module.bath,
    technology: module.technology,
    condition: wear.condition,
    styleAgeYears: wear.styleAgeYears,
  };
}
