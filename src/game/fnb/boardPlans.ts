import { compareIds } from "../domain/ids";
import {
  assertBasisPoints,
  assertCount,
  assertNonNegativeMinor,
  safeProductMinor,
} from "../domain/units";

/**
 * The parts of a kitchen that are decisions rather than throughput: what the
 * rate includes, what the guest cannot eat, how much was prepared before
 * service, which dishes are worth their place on the menu, and what went in
 * the bin at the end of it.
 */
export type BoardPlan =
  "room-only" | "bed-and-breakfast" | "half-board" | "full-board";

/** Covers each plan owes a guest per night, by service. */
export const BOARD_COVERS: Record<
  BoardPlan,
  { breakfast: number; lunch: number; dinner: number }
> = {
  "room-only": { breakfast: 0, lunch: 0, dinner: 0 },
  "bed-and-breakfast": { breakfast: 1, lunch: 0, dinner: 0 },
  "half-board": { breakfast: 1, lunch: 0, dinner: 1 },
  "full-board": { breakfast: 1, lunch: 1, dinner: 1 },
};

/** What the house owes a party under its plan, for the nights it is staying. */
export function boardCommitment(
  plan: BoardPlan,
  input: { guests: number; nights: number },
): { breakfast: number; lunch: number; dinner: number } {
  assertCount(input.guests, "guests");
  assertCount(input.nights, "nights");
  const per = BOARD_COVERS[plan];
  const stayNights = input.guests * input.nights;
  return {
    breakfast: per.breakfast * stayNights,
    lunch: per.lunch * stayNights,
    dinner: per.dinner * stayNights,
  };
}

/**
 * What the plan is worth on the rate. A board plan is sold at less than the
 * covers would cost à la carte, which is the whole reason a guest takes one.
 */
export function boardSupplementMinor(
  plan: BoardPlan,
  coverPriceMinor: number,
): number {
  assertNonNegativeMinor(coverPriceMinor, "cover price");
  const per = BOARD_COVERS[plan];
  const covers = per.breakfast + per.lunch + per.dinner;
  // Fifteen percent off the à la carte value of what is included.
  return Math.trunc((covers * coverPriceMinor * 8500) / 10_000);
}

/** A dish, and what a kitchen actually needs to know about it. */
export interface Recipe {
  id: string;
  /** The station that cooks it; a station is a capacity, not a label. */
  stationId: string;
  ingredientCostMinor: number;
  sellingPriceMinor: number;
  /** Allergens present; a guest who reacts to one cannot be served it. */
  allergens: string[];
  /** Minutes of prep before service that the dish needs. */
  misePlaceMinutes: number;
}

/** Dishes a guest with these allergies may actually be given. */
export function safeRecipes(
  recipes: readonly Recipe[],
  allergies: readonly string[],
): Recipe[] {
  return recipes.filter(
    (recipe) => !recipe.allergens.some((a) => allergies.includes(a)),
  );
}

/**
 * Whether the kitchen prepared enough before service. Mise-en-place short of
 * what the covers need does not stop service; it slows it, and the shortfall
 * is what the player has to see.
 */
export function misePlaceReadiness(input: {
  recipes: readonly Recipe[];
  expectedCovers: number;
  preparedMinutes: number;
}): { ready: boolean; shortMinutes: number; cause: string } {
  assertCount(input.expectedCovers, "expected covers");
  assertCount(input.preparedMinutes, "prepared minutes");
  const required = input.recipes.reduce(
    (sum, recipe) => sum + recipe.misePlaceMinutes,
    0,
  );
  const needed = required * Math.max(1, Math.ceil(input.expectedCovers / 20));
  const shortMinutes = Math.max(0, needed - input.preparedMinutes);
  return {
    ready: shortMinutes === 0,
    shortMinutes,
    cause:
      shortMinutes === 0
        ? "prepared"
        : `${shortMinutes} minutes of prep short for ${input.expectedCovers} covers`,
  };
}

/**
 * The menu-engineering quadrant a dish sits in. Popularity and margin are
 * kept apart on purpose: a dish everybody orders at no margin is a different
 * problem from one nobody orders at a good one.
 */
export type MenuQuadrant = "star" | "plough-horse" | "puzzle" | "dog";

export function menuQuadrant(input: {
  recipe: Recipe;
  soldShareBasisPoints: number;
  averageMarginBasisPoints: number;
}): { quadrant: MenuQuadrant; marginBasisPoints: number; cause: string } {
  assertBasisPoints(input.soldShareBasisPoints, "sold share");
  assertBasisPoints(input.averageMarginBasisPoints, "average margin");
  const { recipe } = input;
  assertNonNegativeMinor(recipe.sellingPriceMinor, "selling price");
  assertNonNegativeMinor(recipe.ingredientCostMinor, "ingredient cost");
  if (recipe.sellingPriceMinor === 0)
    return {
      quadrant: "dog",
      marginBasisPoints: 0,
      cause: "the dish is given away",
    };
  const marginBasisPoints = Math.trunc(
    ((recipe.sellingPriceMinor - recipe.ingredientCostMinor) * 10_000) /
      recipe.sellingPriceMinor,
  );
  // Popular is more than an even share of an eight-dish menu.
  const popular = input.soldShareBasisPoints >= 1250;
  const profitable = marginBasisPoints >= input.averageMarginBasisPoints;
  const quadrant: MenuQuadrant = popular
    ? profitable
      ? "star"
      : "plough-horse"
    : profitable
      ? "puzzle"
      : "dog";
  return {
    quadrant,
    marginBasisPoints,
    cause: `${popular ? "popular" : "seldom ordered"}, ${profitable ? "good margin" : "thin margin"}`,
  };
}

/**
 * What went in the bin, and what it cost. Waste is reported per station so
 * the player can fix the station rather than the total.
 */
export function foodWaste(input: {
  prepared: number;
  sold: number;
  recipes: readonly Recipe[];
}): {
  wastedCovers: number;
  costMinor: number;
  byStation: Record<string, number>;
} {
  assertCount(input.prepared, "prepared covers");
  assertCount(input.sold, "sold covers");
  const wastedCovers = Math.max(0, input.prepared - input.sold);
  const totalCostMinor = input.recipes.reduce((sum, recipe) => {
    assertNonNegativeMinor(recipe.ingredientCostMinor, "ingredient cost");
    return assertNonNegativeMinor(
      sum + recipe.ingredientCostMinor,
      "food waste recipe cost",
    );
  }, 0);
  const averageCostMinor =
    input.recipes.length === 0
      ? 0
      : assertNonNegativeMinor(
          Math.trunc(totalCostMinor / input.recipes.length),
          "average ingredient cost",
        );
  const byStation: Record<string, number> = {};
  const recipes = [...input.recipes].sort((a, b) =>
    compareIds(a.stationId, b.stationId),
  );
  const quotient =
    recipes.length === 0 ? 0 : Math.trunc(wastedCovers / recipes.length);
  const remainder = recipes.length === 0 ? 0 : wastedCovers % recipes.length;
  recipes.forEach((recipe, index) => {
    byStation[recipe.stationId] =
      (byStation[recipe.stationId] ?? 0) +
      quotient +
      (index < remainder ? 1 : 0);
  });
  return {
    wastedCovers,
    costMinor: safeProductMinor(wastedCovers, averageCostMinor, "food waste"),
    byStation,
  };
}
