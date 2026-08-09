import {
  assertCount,
  assertMinor,
  assertNonNegativeMinor,
} from "../domain/units";

/**
 * The measures MASTER 4.5 puts between a bad year and a closed company. Only
 * the ones this build actually models are ever offered; the rest stay named
 * here as the catalogue the later plans have to fill in, because offering a
 * button that does nothing is worse than not offering it.
 */
export type RecoveryPath =
  | "refinance"
  | "restructure"
  | "sell-hotel"
  | "investor"
  | "asset-sale"
  | "market-exit"
  | "staff-reduction"
  | "turnaround";

export const MODELLED_RECOVERY_PATHS = [
  "refinance",
  "sell-hotel",
  "staff-reduction",
] as const satisfies readonly RecoveryPath[];

export interface CareerOutcomeState {
  distress: "healthy" | "recoverable" | "terminal";
  availableRecoveryPaths: RecoveryPath[];
  careerMilestone2026: boolean;
  continueEndless: boolean;
  ended: boolean;
}

/**
 * What the company can still do about its position.
 *
 * Game over is not "the account went negative": it is the point at which no
 * measure is left. So the facts are the measures — headroom to borrow, a house
 * to sell, a payroll to cut — and terminal closure is what remains when all of
 * them are gone.
 */
export interface CareerFacts {
  /**
   * Cash less what is already owed and unpaid. Cash alone never goes negative
   * in this simulation — an unaffordable expense becomes a payable — so a
   * reading taken from the balance alone would never see distress at all.
   */
  netLiquidityMinor: number;
  /** Undrawn credit the bank would still advance. */
  creditHeadroomMinor: number;
  /** Hotels that could be sold while the company keeps operating one. */
  sellableHotelCount: number;
  /** Positions that could be cut without closing the house. */
  reducibleStaffCount: number;
  year: number;
  /**
   * Whether the player has already chosen to keep going. It is their decision
   * and it survives every later reading: a career that was continued is not
   * re-ended by the next monthly refresh.
   */
  continueEndless?: boolean;
}

export function assessCareerOutcome(input: CareerFacts): CareerOutcomeState {
  assertMinor(input.netLiquidityMinor, "career net liquidity");
  assertNonNegativeMinor(input.creditHeadroomMinor, "credit headroom");
  assertCount(input.sellableHotelCount, "sellable hotels");
  assertCount(input.reducibleStaffCount, "reducible staff");
  assertCount(input.year, "career year");

  const paths: RecoveryPath[] = [];
  if (input.creditHeadroomMinor > 0) paths.push("refinance");
  if (input.sellableHotelCount > 0) paths.push("sell-hotel");
  if (input.reducibleStaffCount > 0) paths.push("staff-reduction");

  const distress =
    input.netLiquidityMinor >= 0
      ? "healthy"
      : paths.length > 0
        ? "recoverable"
        : "terminal";
  const continueEndless = input.continueEndless === true;
  return {
    distress,
    availableRecoveryPaths: distress === "recoverable" ? paths : [],
    // 2026 is a milestone, not a stop. Reaching it offers the choice; only
    // taking the choice sets `continueEndless`.
    careerMilestone2026: input.year >= 2026,
    continueEndless,
    ended: distress === "terminal" && !continueEndless,
  };
}

export function chooseEndlessContinuation(
  state: CareerOutcomeState,
): CareerOutcomeState {
  return { ...state, continueEndless: true, ended: false };
}

export function restartCareer(): { action: "restart"; dateKey: "1991-01-01" } {
  return { action: "restart", dateKey: "1991-01-01" };
}
