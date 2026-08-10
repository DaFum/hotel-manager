import type { GameState } from "../simulation/initialState";
import type { CareerFacts, RecoveryPath } from "./careerOutcome";
import { MODELLED_RECOVERY_PATHS } from "./careerOutcome";
import { compareIds } from "../domain/ids";
import { assertNonNegativeMinor } from "../domain/units";
import { drawLoan } from "../finance/loans";
import { dismiss } from "../staff/employeeLifecycle";
import { removeHotelFromPortfolio } from "../company/portfolio";
import { closeHotelAccount } from "../treasury/treasury";
import { valueHotel } from "../ma/valuation";
import { financingAccessBonusBasisPoints } from "../prestige/prestige";
import { consequencesForClosure } from "../narrative/choiceConsequences";
import { applyReputationEvent } from "../reputation/dimensions";
import { MARKET_GOP_MULTIPLE_BP } from "../content/1991/company";

/**
 * The bank's total exposure to the company. Borrowing is bounded, which is
 * what makes running out of it a real position rather than a soft warning.
 */
export const CREDIT_LINE_MINOR = 15_000_000;

/** A house has to keep somebody on each job it still runs. */
const MINIMUM_PER_ROLE = 1;

/** Cash less unpaid obligations: what the company could actually settle. */
export function netLiquidityMinor(state: GameState): number {
  return state.finance.cashMinor - state.finance.payableMinor;
}

export function creditHeadroomMinor(state: GameState): number {
  return Math.max(0, CREDIT_LINE_MINOR - state.loan.principalMinor);
}

/** Hotels the company could sell and still be a hotel company afterwards. */
export function sellableHotelIds(state: GameState): string[] {
  return state.company.portfolio.hotelIds
    .filter((id) => id !== state.hotel.id)
    .sort(compareIds);
}

/** Everybody above the minimum roster, in stable id order so cuts replay. */
export function reducibleEmployeeIds(state: GameState): string[] {
  const roleOf = (staffId: string) =>
    state.staff.find((s) => s.id === staffId)?.role ?? "staff";
  const working = state.workforce.employees
    .filter((e) => e.status === "working")
    .sort((a, b) => compareIds(a.id, b.id));
  const keptPerRole = new Map<string, number>();
  const reducible: string[] = [];
  for (const employee of working) {
    const role = roleOf(employee.staffId);
    const kept = keptPerRole.get(role) ?? 0;
    if (kept < MINIMUM_PER_ROLE) keptPerRole.set(role, kept + 1);
    else reducible.push(employee.id);
  }
  return reducible;
}

/** The position the career reading is taken from, read from real state. */
export function careerFacts(state: GameState): CareerFacts {
  return {
    netLiquidityMinor: netLiquidityMinor(state),
    creditHeadroomMinor: creditHeadroomMinor(state),
    sellableHotelCount: saleableForCashIds(state).length,
    reducibleStaffCount: reducibleEmployeeIds(state).length,
    year: Number(state.calendar.dateKey.slice(0, 4)),
  };
}

/**
 * What selling one house would actually raise. Validation and execution read
 * the same number, so a measure can never be offered on one calculation and
 * carried out on another.
 */
export function disposalProceedsMinor(
  state: GameState,
  hotelId: string,
): number {
  const result = state.company.hotelResults[hotelId];
  const annualGopMinor = Math.max(
    0,
    (result?.grossOperatingProfitMinor ?? 0) * 12,
  );
  const { equityValueMinor } = valueHotel({
    annualGopMinor,
    multipleBasisPoints: MARKET_GOP_MULTIPLE_BP,
    renovationNeedMinor: 0,
    debtAssumedMinor: 0,
  });
  return Math.max(0, equityValueMinor);
}

/** Houses whose sale would actually raise cash. */
export function saleableForCashIds(state: GameState): string[] {
  return sellableHotelIds(state).filter(
    (id) => disposalProceedsMinor(state, id) > 0,
  );
}

/** Roughly what a managed house employs; enough to say what a sale costs. */
function managedStaffCount(state: GameState, hotelId: string): number {
  const managed = state.company.managedHotels.find(
    (h) => h.hotelId === hotelId,
  );
  return Math.max(0, Math.trunc((managed?.rooms ?? 0) / 3));
}

export interface RecoveryContext {
  earn(amountMinor: number, account: string, memo: string): void;
  spend(amountMinor: number, account: string, memo: string): void;
}

export type Verdict = { ok: true } | { ok: false; reason: string };

export function validateRecoveryPath(
  state: GameState,
  path: RecoveryPath,
): Verdict {
  if (!(MODELLED_RECOVERY_PATHS as readonly string[]).includes(path))
    return { ok: false, reason: `${path} is not modelled yet` };
  if (netLiquidityMinor(state) >= 0)
    return { ok: false, reason: "the company is not in distress" };
  if (path === "refinance" && creditHeadroomMinor(state) <= 0)
    return { ok: false, reason: "the credit line is exhausted" };
  if (path === "sell-hotel" && saleableForCashIds(state).length === 0)
    return {
      ok: false,
      // A sale that raises nothing is not a way out of a liquidity problem.
      reason: "no hotel would raise anything on a sale",
    };
  if (path === "staff-reduction" && reducibleEmployeeIds(state).length === 0)
    return { ok: false, reason: "the roster is already minimal" };
  return { ok: true };
}

/**
 * Carries out one measure. Each one is an ordinary economic transaction: money
 * moves through finance, staff leave through the employment system, a hotel
 * leaves the portfolio at a valuation. None of them is a rescue that appears
 * from nowhere.
 */
export function applyRecoveryPath(
  state: GameState,
  path: RecoveryPath,
  ctx: RecoveryContext,
): { measure: RecoveryPath; amountMinor: number } {
  const verdict = validateRecoveryPath(state, path);
  if (!verdict.ok) throw new Error(verdict.reason);

  switch (path) {
    case "refinance": {
      const needed = Math.abs(netLiquidityMinor(state));
      const drawn = Math.min(creditHeadroomMinor(state), needed);
      assertNonNegativeMinor(drawn, "refinancing draw");
      // Standing with the bank shows up here and nowhere else: a respected
      // operator borrows cheaper, but prestige never becomes cash by itself.
      const spreadRelief = financingAccessBonusBasisPoints(
        state.narrative.prestige.company,
      );
      state.loan = drawLoan(
        state.loan.principalMinor + drawn,
        Math.max(0, state.loan.annualRateBasisPoints + 200 - spreadRelief),
        Math.max(1, state.loan.termMonths),
      );
      ctx.earn(drawn, "loan", "refinancing draw");
      return { measure: path, amountMinor: drawn };
    }
    case "sell-hotel": {
      const hotelId = saleableForCashIds(state)[0];
      const result = state.company.hotelResults[hotelId];
      const proceeds = disposalProceedsMinor(state, hotelId);
      // Selling a house is not only a receipt. The people in it and the town
      // it stands in are consequences too, and both are stated rather than
      // scored: there is no morality meter, only what happens.
      const consequences = consequencesForClosure({
        employees: managedStaffCount(state, hotelId),
        monthlyLossMinor: Math.max(
          0,
          -(result?.grossOperatingProfitMinor ?? 0),
        ),
      });
      state.reputation = applyReputationEvent(state.reputation, {
        dimension: "group",
        scopeId: state.company.companyId,
        delta: consequences.localReputationDelta,
        cause: `sale of ${hotelId}: ${consequences.jobsLost} jobs`,
        atMinutes: state.elapsedMinutes,
      });
      retireHotelFromCompany(state, hotelId);
      ctx.earn(proceeds, "disposal", `sale of ${hotelId}`);
      return { measure: path, amountMinor: proceeds };
    }
    case "staff-reduction": {
      const id = reducibleEmployeeIds(state)[0];
      const staffId = state.workforce.employees.find(
        (e) => e.id === id,
      )?.staffId;
      const { state: workforce, severanceMinor } = dismiss(
        state.workforce,
        id,
        "restructuring",
      );
      state.workforce = workforce;
      // Somebody who has left cannot still be on the roster: the employment
      // day removes the staff record on a resignation and so must this.
      if (staffId)
        state.staff = state.staff.filter((member) => member.id !== staffId);
      // Severance is paid whether or not the company can afford it; that is
      // why cutting staff to survive can push the account further down first.
      if (severanceMinor > 0)
        ctx.spend(severanceMinor, "wages", `severance for ${id}`);
      return { measure: path, amountMinor: severanceMinor };
    }
    default:
      throw new Error(`${path} is not modelled yet`);
  }
}

/**
 * Closes every company record that only existed because the group owned this
 * house. A disposal that removed the house from the portfolio but left the
 * rest behind kept a manager managing nothing, escalations waiting on a
 * decision nobody can take, a brand flying over somebody else's building and
 * cash allocated to a hotel the group no longer owns.
 *
 * The treasury account is swept rather than dropped, so the group's cash still
 * reconciles to the ledger, and the brand audit history goes with the flag:
 * the group cannot be held to a standard at an address it has sold.
 *
 * Retiring a house the group does not own is refused by the portfolio rather
 * than tolerated, because a caller that has the wrong id is a bug worth
 * hearing about, not a no-op worth hiding.
 */
export function retireHotelFromCompany(
  state: GameState,
  hotelId: string,
): void {
  const c = state.company;
  c.portfolio = removeHotelFromPortfolio(c.portfolio, hotelId);
  c.managedHotels = c.managedHotels.filter((h) => h.hotelId !== hotelId);
  delete c.hotelResults[hotelId];
  c.treasury = closeHotelAccount(c.treasury, hotelId);
  c.managers = c.managers.filter((m) => m.hotelId !== hotelId);
  c.escalations = c.escalations.filter((e) => e.hotelId !== hotelId);
  c.budgets = c.budgets.filter((b) => b.hotelId !== hotelId);
  c.brandAssignments = c.brandAssignments.filter((a) => a.hotelId !== hotelId);
  c.brandAudits = c.brandAudits.filter((a) => a.hotelId !== hotelId);
  const { [hotelId]: _sold, ...models } = c.operatingModels;
  c.operatingModels = models;
}
