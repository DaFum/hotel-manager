export type RivalInteractionKind =
  "outbid-property" | "poach-staff" | "price-war" | "cooperate" | "merge";
export interface RivalMemory {
  kind: RivalInteractionKind;
  year: number;
}
export interface RivalRelationship {
  trust: number;
  rivalry: number;
  memories: RivalMemory[];
}
export function applyRivalInteraction(
  state: RivalRelationship,
  event: RivalMemory,
): RivalRelationship {
  const hostile =
    event.kind === "outbid-property" ||
    event.kind === "poach-staff" ||
    event.kind === "price-war";
  const cooperative = event.kind === "cooperate" || event.kind === "merge";
  return {
    ...state,
    rivalry: clamp(state.rivalry + (hostile ? 10 : cooperative ? -5 : 0)),
    trust: clamp(state.trust + (hostile ? -5 : cooperative ? 10 : 0)),
    memories: [...state.memories, event],
  };
}
const clamp = (n: number) => Math.max(-100, Math.min(100, n));
