import type { RivalRelationship } from "./relationships";

export type RivalStrategy =
  | "budget-standardisation"
  | "luxury-focus"
  | "family-business"
  | "aggressive-expansion";

/**
 * A competitor the player comes to know by name. The simulation stores who
 * they are and what they want; what the player reads on screen is resolved
 * from `nameKey` at the presentation edge, so no display string is baked into
 * authoritative state.
 */
export interface NamedRival {
  id: string;
  nameKey: string;
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
      nameKey: "rival.klara-voss.name",
      portraitId: "portrait.klara-voss",
      personality: "patient-dealmaker",
      riskAppetite: 62,
      strategy: "family-business",
      relationship: { trust: 0, rivalry: 0, memories: [] },
      active: true,
    },
  ];
}
