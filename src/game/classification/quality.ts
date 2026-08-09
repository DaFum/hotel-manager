/**
 * Classification is all-or-nothing per star band: a hotel is only as good as
 * the standard it fails, which is why every check reports the shortfall
 * instead of a single opaque score.
 */
export type StandardScores = Record<string, number>;

export function qualifies(a: StandardScores, r: StandardScores): boolean {
  return Object.keys(r).every((k) => (a[k] ?? 0) >= r[k]);
}

export interface StandardFailure {
  standard: string;
  actual: number;
  required: number;
}

export function failedStandards(
  a: StandardScores,
  r: StandardScores,
): StandardFailure[] {
  return Object.keys(r)
    .filter((k) => (a[k] ?? 0) < r[k])
    .map((k) => ({ standard: k, actual: a[k] ?? 0, required: r[k] }));
}

export interface StarStandard {
  stars: number;
  required: StandardScores;
}

import { STAR_STANDARDS } from "../content/1991/classification";

export { STAR_STANDARDS };

export interface Classification {
  stars: number;
  /** The standards that stopped the next star. */
  blockedBy: StandardFailure[];
}

export function classify(a: StandardScores): Classification {
  let stars = 0;
  let blockedBy: StandardFailure[] = [];
  for (const band of STAR_STANDARDS) {
    if (qualifies(a, band.required)) {
      stars = band.stars;
      continue;
    }
    blockedBy = failedStandards(a, band.required);
    break;
  }
  return { stars, blockedBy };
}
