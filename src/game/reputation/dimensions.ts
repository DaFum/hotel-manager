import { compareIds } from "../domain/ids";
import { assertScore } from "../domain/units";

/**
 * Reputation is not one number. A hotel guests love can be an employer nobody
 * will work for; a group the press admires can have one house that is a
 * disaster. Each dimension has its own causes, its own decay and its own
 * effects, and none of them is prestige.
 */
export const REPUTATION_DIMENSIONS = [
  "hotel",
  "brand",
  "group",
  "employer",
  "media",
  "channel",
] as const;

export type ReputationDimension = (typeof REPUTATION_DIMENSIONS)[number];

/** One thing that happened, and what it did to the score. */
export interface ReputationContributor {
  cause: string;
  delta: number;
  atMinutes: number;
}

export interface ReputationRecord {
  /** 0-100. */
  score: number;
  /** Newest last; bounded so a decades-long campaign stays small. */
  contributors: ReputationContributor[];
}

export type ReputationState = Record<
  ReputationDimension,
  Record<string, ReputationRecord>
>;

/** How many causes each scoped record keeps. */
export const CONTRIBUTOR_LIMIT = 16;

/** Where each dimension settles when nothing is happening to it. */
export const NEUTRAL_SCORE = 50;

export function createReputationState(): ReputationState {
  return {
    hotel: {},
    brand: {},
    group: {},
    employer: {},
    media: {},
    channel: {},
  };
}

export function reputationFor(
  state: ReputationState,
  dimension: ReputationDimension,
  scopeId: string,
): ReputationRecord {
  return (
    state[dimension][scopeId] ?? { score: NEUTRAL_SCORE, contributors: [] }
  );
}

/**
 * Moves one dimension for one scope, and records why. A move with no cause is
 * refused: an unexplainable reputation is exactly the thing this module
 * exists to prevent.
 */
export function applyReputationEvent(
  state: ReputationState,
  input: {
    dimension: ReputationDimension;
    scopeId: string;
    delta: number;
    cause: string;
    atMinutes: number;
  },
): ReputationState {
  if (!input.cause) throw new Error("a reputation change needs a cause");
  if (!input.scopeId) throw new Error("a reputation change needs a scope");
  if (!Number.isSafeInteger(input.delta))
    throw new Error("a reputation change must be whole points");
  const current = reputationFor(state, input.dimension, input.scopeId);
  const score = assertScore(
    Math.max(0, Math.min(100, current.score + input.delta)),
    "reputation score",
  );
  return {
    ...state,
    [input.dimension]: {
      ...state[input.dimension],
      [input.scopeId]: {
        score,
        contributors: [
          ...current.contributors,
          {
            cause: input.cause,
            delta: input.delta,
            atMinutes: input.atMinutes,
          },
        ].slice(-CONTRIBUTOR_LIMIT),
      },
    },
  };
}

/**
 * Reputation drifts back toward neutral when nothing keeps it up. Repair is
 * therefore slow and continuous rather than a purchase, and damage fades
 * rather than being erased.
 */
export function decayReputation(
  state: ReputationState,
  step = 1,
): ReputationState {
  const next = createReputationState();
  for (const dimension of REPUTATION_DIMENSIONS)
    for (const scopeId of Object.keys(state[dimension]).sort(compareIds)) {
      const record = state[dimension][scopeId];
      const towards =
        record.score > NEUTRAL_SCORE
          ? -Math.min(step, record.score - NEUTRAL_SCORE)
          : Math.min(step, NEUTRAL_SCORE - record.score);
      next[dimension][scopeId] = {
        score: record.score + towards,
        contributors: record.contributors,
      };
    }
  return next;
}

/**
 * What a dimension actually does. Each one reaches a different part of the
 * game, which is why collapsing them would remove decisions rather than
 * simplify them.
 */
export const DIMENSION_EFFECTS: Record<ReputationDimension, string> = {
  hotel: "guest demand for this house",
  brand: "demand for every house flying the flag",
  group: "cost of capital and what sellers will deal with",
  employer: "who applies, and what they must be paid",
  media: "how loudly an incident travels",
  channel: "placement and commission with intermediaries",
};

/** Named causes, newest first, for the explanation surfaces. */
export function reputationCauses(
  state: ReputationState,
  dimension: ReputationDimension,
  scopeId: string,
): ReputationContributor[] {
  return [...reputationFor(state, dimension, scopeId).contributors].reverse();
}
