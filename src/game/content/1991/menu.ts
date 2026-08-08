export type Outlet = "breakfast" | "restaurant" | "bar" | "roomservice";

export interface MenuItem {
  id: string;
  name: string;
  outlet: Outlet;
  /** Selling price in Pfennig. */
  priceMinor: number;
  /** Recipe cost in Pfennig at the current supplier prices. */
  ingredientMinor: number;
  /** Kitchen or bar time for one cover, in simulated minutes. */
  prepMinutes: number;
}

/** The 1991 card. Prices and recipes are content, never UI conditionals. */
export const MENU: readonly MenuItem[] = [
  {
    id: "menu.breakfast.buffet",
    name: "Frühstücksbuffet",
    outlet: "breakfast",
    priceMinor: 1800,
    ingredientMinor: 650,
    prepMinutes: 4,
  },
  {
    id: "menu.restaurant.tagesgericht",
    name: "Tagesgericht",
    outlet: "restaurant",
    priceMinor: 2400,
    ingredientMinor: 900,
    prepMinutes: 12,
  },
  {
    id: "menu.restaurant.rumpsteak",
    name: "Rumpsteak",
    outlet: "restaurant",
    priceMinor: 3800,
    ingredientMinor: 1700,
    prepMinutes: 18,
  },
  {
    id: "menu.bar.pils",
    name: "Pils vom Fass",
    outlet: "bar",
    priceMinor: 450,
    ingredientMinor: 110,
    prepMinutes: 2,
  },
  {
    id: "menu.bar.aperitif",
    name: "Aperitif",
    outlet: "bar",
    priceMinor: 900,
    ingredientMinor: 260,
    prepMinutes: 3,
  },
  {
    id: "menu.roomservice.club",
    name: "Club-Sandwich",
    outlet: "roomservice",
    priceMinor: 1900,
    ingredientMinor: 620,
    prepMinutes: 10,
  },
];

export function menuItem(id: string): MenuItem {
  const found = MENU.find((i) => i.id === id);
  if (!found) throw new Error(`unknown menu item ${id}`);
  return found;
}

export function outletMenu(outlet: Outlet): readonly MenuItem[] {
  return MENU.filter((i) => i.outlet === outlet);
}

/** The card's average cover value, used to price an outlet against the city. */
export function averageCoverMinor(outlet: Outlet): number {
  const items = outletMenu(outlet);
  if (items.length === 0) return 0;
  return Math.round(
    items.reduce((sum, i) => sum + i.priceMinor, 0) / items.length,
  );
}
