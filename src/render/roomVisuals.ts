import { detailFor, lightingFor } from "./camera";
import type { Phase } from "../game/renovation/projects";

export interface RoomLighting {
  period: ReturnType<typeof lightingFor>;
  lit: boolean;
  tint: number;
}

const PERIOD_TINT = {
  day: 0xffffff,
  evening: 0xc5cad0,
  night: 0x697684,
} as const;

/** Occupied windows become warm signals after dark; empty stock recedes. */
export function roomLighting(state: string, minuteOfDay: number): RoomLighting {
  const period = lightingFor(minuteOfDay);
  const lit = state === "Occupied" && period !== "day";
  return {
    period,
    lit,
    tint: lit ? 0xffc66d : PERIOD_TINT[period],
  };
}

export function roomLodFor(zoom: number): {
  tier: ReturnType<typeof detailFor>;
  drawFloorStructure: true;
  drawRoomTiles: boolean;
  drawFineStatus: boolean;
} {
  const tier = detailFor(zoom);
  return {
    tier,
    drawFloorStructure: true,
    drawRoomTiles: tier !== "aggregate",
    drawFineStatus: tier === "people",
  };
}

const STATE_PRIORITY: Record<string, number> = {
  VacantClean: 0,
  Inspected: 1,
  Reserved: 10,
  Occupied: 11,
  VacantDirty: 20,
  Blocked: 30,
  OutOfOrder: 40,
};

export function aggregateRoomState(states: readonly string[]): string {
  return states.reduce(
    (current, state) =>
      (STATE_PRIORITY[state] ?? 10) > (STATE_PRIORITY[current] ?? 10)
        ? state
        : current,
    "VacantClean",
  );
}

const PHASE_VISUALS: Record<Phase, { notation: string; colour: number }> = {
  planning: { notation: "outline", colour: 0x6d9dc5 },
  approval: { notation: "permit", colour: 0xe9e5db },
  construction: { notation: "hatch", colour: 0xe8a33d },
  acceptance: { notation: "inspection", colour: 0x5cc98f },
  complete: { notation: "reopened", colour: 0x4c9f70 },
};

export function renovationVisualFor(phase: Phase) {
  return PHASE_VISUALS[phase];
}
