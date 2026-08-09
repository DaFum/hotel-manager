/**
 * What rivals remember about each other. A price war is not forgotten the
 * month it ends: a house that has been undercut prices defensively for a long
 * time afterwards, which is what makes a rivalry feel like one.
 */

export const MIN_RELATION = 0;
export const MAX_RELATION = 100;

export function neutralRelation(): number {
  return 50;
}

/** How far one undercut moves a relation. */
const GRUDGE_STEP = 12;
/** How far one fair month repairs it; forgiving is slower than resenting. */
const FORGIVE_STEP = 3;

function clamp(relation: number): number {
  if (!Number.isFinite(relation)) throw new Error("invalid relation");
  return Math.max(MIN_RELATION, Math.min(MAX_RELATION, Math.round(relation)));
}

export function rememberPriceCut(relation: number): number {
  return clamp(relation - GRUDGE_STEP);
}

export function rememberFairPlay(relation: number): number {
  return clamp(relation + FORGIVE_STEP);
}

/**
 * How hard a house prices against a rival it distrusts, in basis points of
 * extra discount. Neutral trust and anything above it draw no retaliation;
 * distrust below that anchor increases the response.
 */
export function retaliationBp(relation: number): number {
  const trust = clamp(relation);
  const neutral = neutralRelation();
  return trust >= neutral
    ? 0
    : Math.round(((neutral - trust) * 1500) / neutral);
}
