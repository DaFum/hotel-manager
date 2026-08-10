import { CORE_CONTENT_REGISTRY } from "../corePack";

export type Outlet = "breakfast" | "restaurant" | "bar" | "roomservice";
export interface MenuItem {
  id: string;
  name: string;
  outlet: Outlet;
  priceMinor: number;
  ingredientMinor: number;
  prepMinutes: number;
}
export const MENU: readonly MenuItem[] = [
  ...CORE_CONTENT_REGISTRY.allByKind("recipe"),
]
  .sort((a, b) => a.simulationOrder - b.simulationOrder)
  .map((entry) => ({
    id: entry.id,
    name: entry.name,
    outlet: entry.outlet,
    priceMinor: entry.priceMinor,
    ingredientMinor: entry.ingredientCostMinor,
    prepMinutes: entry.prepMinutes,
  }));
export function menuItem(id: string): MenuItem {
  const found = MENU.find((item) => item.id === id);
  if (!found) throw new Error(`unknown menu item ${id}`);
  return found;
}
export function outletMenu(outlet: Outlet): readonly MenuItem[] {
  return MENU.filter((item) => item.outlet === outlet);
}
export function averageCoverMinor(outlet: Outlet): number {
  const items = outletMenu(outlet);
  return items.length === 0
    ? 0
    : Math.round(
        items.reduce((sum, item) => sum + item.priceMinor, 0) / items.length,
      );
}
