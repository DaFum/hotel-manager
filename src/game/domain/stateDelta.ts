import type { GameSnapshot } from "./snapshot";

/**
 * A real difference between two published snapshots.
 *
 * The unit is the top-level section, which is what the UI actually re-renders:
 * a quiet quantum changes the calendar and the metrics and leaves twenty other
 * sections alone, so the delta carries two of them rather than all of it. What
 * it must never be is a whole snapshot wearing the word "delta".
 */
export interface StateDelta {
  /** The publication this delta continues from. */
  basePublication: number;
  /** The publication it produces. */
  publication: number;
  /** Sections whose value changed, by name. */
  changed: Record<string, unknown>;
  /** Sections that are no longer present at all. */
  removed: string[];
}

/** Thrown when a delta is offered to a state it was not computed against. */
export class DeltaBaseMismatchError extends Error {
  constructor(
    readonly expected: number,
    readonly actual: number,
  ) {
    super(
      `delta expects publication ${expected} but the client holds ${actual}`,
    );
    this.name = "DeltaBaseMismatchError";
  }
}

/** A snapshot as a bag of named sections, which is all a delta needs it to be. */
type Sections = Record<string, unknown>;
const sectionsOf = (snapshot: GameSnapshot) => snapshot as unknown as Sections;

/**
 * Structural equality.
 *
 * Serialising both sides would be wrong twice over: `JSON.stringify` drops
 * properties whose value is `undefined`, so a real change could go
 * unpublished, and it is order-sensitive, so an unchanged section could be
 * republished because two keys were inserted in a different order. It is also
 * the expensive option on a path that runs every publication, over sections
 * such as the ledger and the command log that grow with the campaign.
 *
 * The identity check first is what makes the common case cheap: a section the
 * quantum never touched is the very same object.
 */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b)
    return Number.isNaN(a) && Number.isNaN(b);

  const aArray = Array.isArray(a);
  if (aArray !== Array.isArray(b)) return false;
  if (aArray) {
    const left = a as unknown[];
    const right = b as unknown[];
    return (
      left.length === right.length &&
      left.every((value, i) => same(value, right[i]))
    );
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  // Union of keys, so a property present on one side with the value
  // `undefined` is still compared rather than quietly ignored.
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (key in left !== key in right) return false;
    if (!same(left[key], right[key])) return false;
  }
  return true;
}

export function computeStateDelta(
  base: GameSnapshot,
  next: GameSnapshot,
  publications: { basePublication: number; publication: number },
): StateDelta {
  const changed: Record<string, unknown> = {};
  const removed: string[] = [];
  // Stable key order keeps a delta byte-identical across runs, which is what
  // lets a replay compare published output rather than just final state.
  const from = sectionsOf(base);
  const to = sectionsOf(next);
  for (const key of Object.keys(to).sort())
    if (!same(from[key], to[key])) changed[key] = to[key];
  for (const key of Object.keys(from).sort())
    if (!(key in to)) removed.push(key);

  return { ...publications, changed, removed };
}

/**
 * Rebuilds the next snapshot from the one the client holds. It refuses a delta
 * whose base does not match rather than producing a plausible-looking state
 * that never existed.
 */
export function applyStateDelta(
  base: GameSnapshot,
  delta: StateDelta,
  basePublication: number,
): GameSnapshot {
  if (delta.basePublication !== basePublication)
    throw new DeltaBaseMismatchError(delta.basePublication, basePublication);
  const next: Sections = { ...sectionsOf(base), ...delta.changed };
  for (const key of delta.removed) delete next[key];
  return next as unknown as GameSnapshot;
}
