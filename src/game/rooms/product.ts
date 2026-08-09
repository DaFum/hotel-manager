import { assertCount, assertScore } from "../domain/units";
/**
 * A room's saleable product. `condition` is physical upkeep; `styleAgeYears`
 * is how long ago the fit-out was current. The MASTER model keeps them apart:
 * a spotless 1974 room is well maintained and still commercially dated, and
 * only a renovation resets the style clock.
 */
export interface RoomProduct {
  /** Fit-out scores, 0..100. */
  comfort: number;
  bath: number;
  technology: number;
  /** Physical upkeep, 0..100. */
  condition: number;
  /** Years since the fit-out was current. */
  styleAgeYears: number;
}

export interface RoomAppeal {
  condition: number;
  appeal: number;
}

/** Weights in percent; they sum to 100 so `appeal` stays on a 0..100 scale. */
const WEIGHTS = { comfort: 35, bath: 25, technology: 20, condition: 20 };
/** Commercial aging costs 1.5 appeal points a year, capped at 35. */
const AGING_PER_YEAR_CENTI = 150;
const MAX_AGING_CENTI = 3500;

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** The commercial penalty alone, so callers can explain the two causes apart. */
export function agingPenalty(styleAgeYears: number): number {
  const years = Math.max(0, styleAgeYears);
  return Math.min(MAX_AGING_CENTI, Math.round(years * AGING_PER_YEAR_CENTI));
}

/** Applies commercial aging to an already-scored appeal value. */
export function agedAppeal(appeal: number, styleAgeYears: number): number {
  return Math.max(
    0,
    Math.round((appeal * 100 - agingPenalty(styleAgeYears)) / 100),
  );
}

function assertProduct(r: RoomProduct): void {
  assertScore(r.comfort, "comfort");
  assertScore(r.bath, "bath");
  assertScore(r.technology, "technology");
  assertScore(r.condition, "condition");
  assertCount(r.styleAgeYears, "style age years");
}

export function roomAppeal(r: RoomProduct): RoomAppeal {
  assertProduct(r);
  // Integer centi-points throughout: appeal feeds pricing and demand, so it
  // must not drift with floating-point accumulation.
  const raw =
    clamp100(r.comfort) * WEIGHTS.comfort +
    clamp100(r.bath) * WEIGHTS.bath +
    clamp100(r.technology) * WEIGHTS.technology +
    clamp100(r.condition) * WEIGHTS.condition;
  return {
    condition: clamp100(r.condition),
    appeal: Math.max(
      0,
      Math.round((raw - agingPenalty(r.styleAgeYears)) / 100),
    ),
  };
}

/** What each segment actually pays attention to, in percent weights. */
const SEGMENT_WEIGHTS: Record<
  string,
  { comfort: number; bath: number; technology: number; condition: number }
> = {
  "segment.business": {
    comfort: 25,
    bath: 20,
    technology: 35,
    condition: 20,
  },
  "segment.corporate": {
    comfort: 25,
    bath: 25,
    technology: 30,
    condition: 20,
  },
  "segment.leisure": { comfort: 45, bath: 30, technology: 5, condition: 20 },
  "segment.budget": { comfort: 25, bath: 25, technology: 5, condition: 45 },
};

/**
 * How well a room matches a segment, in basis points of a perfect match. Used
 * to explain conversion, not to silently multiply demand somewhere else.
 */
export function segmentFitBp(r: RoomProduct, segmentId: string): number {
  assertProduct(r);
  const w = SEGMENT_WEIGHTS[segmentId] ?? WEIGHTS;
  const raw =
    clamp100(r.comfort) * w.comfort +
    clamp100(r.bath) * w.bath +
    clamp100(r.technology) * w.technology +
    clamp100(r.condition) * w.condition;
  return Math.max(0, raw - agingPenalty(r.styleAgeYears));
}
