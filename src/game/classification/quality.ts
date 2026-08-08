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

/** The 1991 German classification bands, as content rather than conditionals. */
export const STAR_STANDARDS: readonly StarStandard[] = [
  {
    stars: 1,
    required: { room: 25, reception: 25, maintenance: 25, facilities: 0 },
  },
  {
    stars: 2,
    required: { room: 40, reception: 40, maintenance: 40, facilities: 15 },
  },
  {
    stars: 3,
    required: { room: 60, reception: 60, maintenance: 60, facilities: 40 },
  },
  {
    stars: 4,
    required: { room: 75, reception: 75, maintenance: 75, facilities: 65 },
  },
  {
    stars: 5,
    required: { room: 88, reception: 90, maintenance: 88, facilities: 85 },
  },
];

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
