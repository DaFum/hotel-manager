import type { RivalRelationship } from "./relationships";
export type RivalStrategy =
  | "budget-standardisation"
  | "luxury-focus"
  | "family-business"
  | "aggressive-expansion";
export interface NamedRival {
  id: string;
  name: string;
  portraitId: string;
  personality: string;
  riskAppetite: number;
  strategy: RivalStrategy;
  relationship: RivalRelationship;
  active: boolean;
}
export function createNamedRivals(): NamedRival[] {
  return [
    {
      id: "rival.klara-voss",
      name: "Klara Voss",
      portraitId: "portrait.klara-voss",
      personality: "patient-dealmaker",
      riskAppetite: 62,
      strategy: "family-business",
      relationship: { trust: 0, rivalry: 0, memories: [] },
      active: true,
    },
  ];
}
