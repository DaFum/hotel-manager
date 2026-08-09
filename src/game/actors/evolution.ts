/**
 * The external economic actors that create the city's demand: employers,
 * congress organisers, attractions and the investors who fund them. They are
 * not hotels — they grow and shrink on their own trade, and the hotels only
 * feel the room nights that follow.
 */
export type ActorKind = "office" | "congress" | "attraction" | "investor";

export const ACTOR_KINDS: readonly ActorKind[] = [
  "office",
  "congress",
  "attraction",
  "investor",
];

export interface CityActor {
  id: string;
  kind: ActorKind;
  /** Size index; 100 is the city's neutral scale. */
  scale: number;
}

/** The most an actor's scale may move in one month, in index points. */
export const MAX_MONTHLY_ACTOR_MOVE = 15;

/**
 * One month of an actor's own trade. Demand above its neutral index and a
 * profitable year both grow it; the move is bounded so no single month can
 * rewrite the city.
 */
export function nextActorScale(i: {
  scale: number;
  demand: number;
  profitBp: number;
}): number {
  for (const [label, value] of [
    ["scale", i.scale],
    ["demand", i.demand],
    ["profitBp", i.profitBp],
  ] as const)
    if (!Number.isSafeInteger(value)) throw new Error(`invalid ${label}`);
  if (i.scale < 0) throw new Error("invalid scale");

  // Demand and its own trade move an actor; the pull back toward the city's
  // neutral scale is what stops a run of soft months compounding into a city
  // with no economy left in it.
  const move = Math.round(
    (i.demand - 100) * 0.2 + i.profitBp / 1000 + (100 - i.scale) / 20,
  );
  const bounded = Math.max(
    -MAX_MONTHLY_ACTOR_MOVE,
    Math.min(MAX_MONTHLY_ACTOR_MOVE, move),
  );
  const next = Math.max(0, i.scale + bounded);
  if (!Number.isSafeInteger(next)) throw new Error("invalid next scale");
  return next;
}

/**
 * The one scale per kind the demand model reads. A kind the city has no actor
 * for sits at its neutral index rather than at zero: an absent congress
 * organiser means no uplift, not a city with no group travel at all.
 */
export function scaleByKind(
  actors: readonly CityActor[],
): Record<ActorKind, number> {
  const byKind = Object.fromEntries(
    ACTOR_KINDS.map((kind) => {
      const of = actors.filter((a) => a.kind === kind);
      if (of.length === 0) return [kind, 100];
      for (const actor of of)
        if (!Number.isSafeInteger(actor.scale) || actor.scale < 0)
          throw new Error(`invalid scale for ${actor.id}`);
      return [
        kind,
        Math.round(of.reduce((sum, a) => sum + a.scale, 0) / of.length),
      ];
    }),
  ) as Record<ActorKind, number>;
  return byKind;
}
