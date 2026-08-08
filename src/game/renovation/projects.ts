import { roomModule } from "../content/rooms/modules";

/**
 * A renovation is a project, not an instant purchase: it is planned, approved,
 * built while the affected rooms are out of order and the house hears it, then
 * handed over at acceptance before the rooms reopen.
 */
export type Phase =
  "planning" | "approval" | "construction" | "acceptance" | "complete";

export interface Project {
  phase: Phase;
  remainingMinutes: number;
  affected: string[];
  /** The module the affected rooms are converted to on acceptance. */
  moduleId?: string;
}

export const PHASE_SEQUENCE: readonly Phase[] = [
  "planning",
  "approval",
  "construction",
  "acceptance",
  "complete",
];

/** Working days per phase, in simulated minutes. */
export const PHASE_MINUTES: Record<Exclude<Phase, "complete">, number> = {
  planning: 2 * 1440,
  approval: 3 * 1440,
  construction: 3 * 1440,
  acceptance: 1440,
};

/** Basis points of satisfaction lost per in-house guest per noisy day. */
const NOISE_BP_PER_GUEST = 15;

export function planProject(moduleId: string, affected: string[]): Project {
  // Fails fast on an unknown target so a project can never build a room
  // product that no content pack defines.
  roomModule(moduleId);
  return {
    phase: "planning",
    remainingMinutes: PHASE_MINUTES.planning,
    affected: [...affected],
    moduleId,
  };
}

export function advanceProject(p: Project, m: number): Project {
  let phase = p.phase;
  let remainingMinutes = p.remainingMinutes;
  // Time carries across phase boundaries so a long step cannot silently stall
  // a project on a phase it already finished.
  let left = Math.max(0, m);
  while (phase !== "complete") {
    const spent = Math.min(left, remainingMinutes);
    remainingMinutes -= spent;
    left -= spent;
    if (remainingMinutes > 0) break;
    phase = PHASE_SEQUENCE[PHASE_SEQUENCE.indexOf(phase) + 1];
    remainingMinutes = phase === "complete" ? 0 : PHASE_MINUTES[phase];
    if (left === 0) break;
  }
  return { ...p, phase, remainingMinutes };
}

/**
 * Rooms are unsellable from the first hammer blow until the handover is
 * signed off; planning and approval are paperwork and sell normally.
 */
export function blockedRooms(p: Project): string[] {
  return p.phase === "construction" || p.phase === "acceptance"
    ? [...p.affected]
    : [];
}

/** Construction noise reaches guests elsewhere in the house; snagging does not. */
export function noisePenaltyBp(p: Project, guestsInHouse: number): number {
  if (p.phase !== "construction") return 0;
  return Math.max(0, guestsInHouse) * NOISE_BP_PER_GUEST;
}

/** The fit-out cost of converting every affected room to the target module. */
export function projectCostMinor(p: Project): number {
  if (!p.moduleId) return 0;
  return roomModule(p.moduleId).fitOutCostMinor * p.affected.length;
}
