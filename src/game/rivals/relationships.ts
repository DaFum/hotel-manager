import { assertCount } from "../domain/units";

export type RivalInteractionKind =
  "outbid-property" | "poach-staff" | "price-war" | "cooperate" | "merge";

export interface RivalMemory {
  kind: RivalInteractionKind;
  year: number;
}

/**
 * What one rival remembers about the player. Rivals are not scripted to
 * forgive or to escalate; they carry what actually happened between the two
 * companies and act on it years later.
 */
export interface RivalRelationship {
  trust: number;
  rivalry: number;
  memories: RivalMemory[];
}

/** How many interactions one rival keeps. */
export const MEMORY_LIMIT = 32;

export function applyRivalInteraction(
  state: RivalRelationship,
  event: RivalMemory,
): RivalRelationship {
  const trust = assertRelationshipScore(state.trust, "rival trust");
  const rivalry = assertRelationshipScore(state.rivalry, "rival rivalry");
  assertCount(event.year, "rival interaction year");
  const hostile =
    event.kind === "outbid-property" ||
    event.kind === "poach-staff" ||
    event.kind === "price-war";
  const cooperative = event.kind === "cooperate" || event.kind === "merge";
  return {
    ...state,
    rivalry: clamp(rivalry + (hostile ? 10 : cooperative ? -5 : 0)),
    trust: clamp(trust + (hostile ? -5 : cooperative ? 10 : 0)),
    // Copies throughout: neither the caller's event nor the memories it
    // handed in stay reachable from what the rival remembers, so a later edit
    // to either cannot rewrite history. Bounded, so a thirty-five year career
    // does not carry an unbounded grudge list.
    memories: [...state.memories, event]
      .slice(-MEMORY_LIMIT)
      .map((memory) => ({ kind: memory.kind, year: memory.year })),
  };
}

function assertRelationshipScore(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < -100 || value > 100)
    throw new Error(`invalid ${label}`);
  return value;
}

const clamp = (n: number) => Math.max(-100, Math.min(100, n));
