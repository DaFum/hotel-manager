import type { GameState } from "../simulation/initialState";
import type { CareerFacts, RecoveryPath } from "./careerOutcome";
import { MODELLED_RECOVERY_PATHS } from "./careerOutcome";
import { compareIds } from "../domain/ids";
import { assertNonNegativeMinor } from "../domain/units";
import { drawLoan } from "../finance/loans";
import { dismiss } from "../staff/employeeLifecycle";
import { removeHotelFromPortfolio } from "../company/portfolio";
import { closeHotelAccount } from "../treasury/treasury";
import { valueCompany, valueHotel } from "../ma/valuation";
import { financingAccessBonusBasisPoints } from "../prestige/prestige";
import { consequencesForClosure } from "../narrative/choiceConsequences";
import { applyReputationEvent } from "../reputation/dimensions";
import { MARKET_GOP_MULTIPLE_BP } from "../content/1991/company";
import { createOperatingContract } from "../ownership/models";
import { headquartersMonthlyCostMinor } from "../company/sharedServices";
import { isInsolvent, MAX_TERM_MONTHS, restructure } from "../finance/debt";
import { balanceSheet, overdueReceivables } from "../finance/statements";

/**
 * The bank's total exposure to the company. Borrowing is bounded, which is
 * what makes running out of it a real position rather than a soft warning.
 */
export const CREDIT_LINE_MINOR = 15_000_000;

/** A house has to keep somebody on each job it still runs. */
const MINIMUM_PER_ROLE = 1;
export const HEADQUARTERS_COST_FLOOR_MINOR = 300_000;
export const RESTRUCTURE_SAVING_BASIS_POINTS = 2_500;
export const REORGANIZATION_COST_MINOR = 500_000;
export const INVESTOR_STAKE_CAP_BASIS_POINTS = 4_900;
export const TURNAROUND_EXTRA_MONTHS = 60;
export const TURNAROUND_PENALTY_BASIS_POINTS = 150;
export const TURNAROUND_ADVISORY_FEE_MINOR = 250_000;
const LEASEBACK_ANNUAL_RENT_BASIS_POINTS = 900;

/** Cash less unpaid obligations: what the company could actually settle. */
export function netLiquidityMinor(state: GameState): number {
  const supplierPayablesMinor = state.finance.supplierInvoices.reduce(
    (sum, invoice) => sum + invoice.amountMinor,
    0,
  );
  const collectibleMinor = overdueReceivables(
    state.statements,
    state.calendar.dateKey,
  ).reduce((sum, receivable) => sum + receivable.amountMinor, 0);
  return (
    state.finance.cashMinor +
    collectibleMinor -
    state.finance.payableMinor -
    supplierPayablesMinor
  );
}

export function creditHeadroomMinor(state: GameState): number {
  const loans = state.loans ?? (state.loan ? [state.loan] : []);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principalMinor, 0);
  return Math.max(0, CREDIT_LINE_MINOR - totalPrincipal);
}

/** Hotels the company could sell and still be a hotel company afterwards. */
export function sellableHotelIds(state: GameState): string[] {
  return state.company.portfolio.hotelIds
    .filter((id) => id !== state.hotel.id)
    .sort(compareIds);
}

export function leasebackableIds(state: GameState): string[] {
  return state.company.portfolio.hotelIds
    .filter(
      (id) =>
        id !== state.hotel.id &&
        state.company.operatingModels[id]?.kind === "owned" &&
        disposalProceedsMinor(state, id) > 0,
    )
    .sort(compareIds);
}

export function hotelsInCity(state: GameState, cityId: string): string[] {
  return state.company.managedHotels
    .filter((hotel) => hotel.cityId === cityId)
    .map((hotel) => hotel.hotelId)
    .filter((hotelId) => state.company.portfolio.hotelIds.includes(hotelId))
    .sort(compareIds);
}

export function exitableCityIds(state: GameState): string[] {
  return [...new Set(state.company.managedHotels.map((hotel) => hotel.cityId))]
    .filter((cityId) => {
      const ids = hotelsInCity(state, cityId);
      return (
        ids.length > 0 &&
        !ids.includes(state.hotel.id) &&
        ids.some((id) => disposalProceedsMinor(state, id) > 0)
      );
    })
    .sort(compareIds);
}

export function headquartersCanRestructure(state: GameState): boolean {
  return (
    state.company.headquarters.baseMonthlyCostMinor >
    HEADQUARTERS_COST_FLOOR_MINOR
  );
}

export function remainingInvestorCapacityMinor(state: GameState): number {
  const companyValueMinor = valueCompany(state);
  const remainingBasisPoints = Math.max(
    0,
    INVESTOR_STAKE_CAP_BASIS_POINTS - state.company.investorStakeBasisPoints,
  );
  return companyValueMinor > 0
    ? Math.trunc((companyValueMinor * remainingBasisPoints) / 10_000)
    : 0;
}

export function hasReschedulableLoan(state: GameState): boolean {
  const loans = state.loans ?? (state.loan ? [state.loan] : []);
  return loans.some(
    (l) => l.principalMinor > 0 && l.termMonths < MAX_TERM_MONTHS,
  );
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
  const supplierPayablesMinor = state.finance.supplierInvoices.reduce(
    (sum, invoice) => sum + invoice.amountMinor,
    0,
  );
  const payablesMinor = state.finance.payableMinor + supplierPayablesMinor;
  const loans = state.loans ?? (state.loan ? [state.loan] : []);
  const totalDebtMinor = loans.reduce((sum, l) => sum + l.principalMinor, 0);
  const equityMinor = balanceSheet({
    cashMinor: state.finance.cashMinor,
    receivablesMinor: state.statements.receivablesMinor,
    fixedAssetsMinor: state.statements.fixedAssetsMinor,
    accumulatedDepreciationMinor: state.statements.accumulatedDepreciationMinor,
    payablesMinor,
    taxPayableMinor: state.finance.taxPayableMinor,
    debtMinor: totalDebtMinor,
    contributedCapitalMinor: state.statements.contributedCapitalMinor,
    retainedEarningsMinor: state.statements.retainedEarningsMinor,
  }).equityMinor;
  const collectibleMinor = overdueReceivables(
    state.statements,
    state.calendar.dateKey,
  ).reduce((sum, receivable) => sum + receivable.amountMinor, 0);
  return {
    netLiquidityMinor: netLiquidityMinor(state),
    insolvent: isInsolvent({
      cashMinor: state.finance.cashMinor + collectibleMinor,
      payablesMinor,
      equityMinor,
    }),
    creditHeadroomMinor: creditHeadroomMinor(state),
    assetSaleAvailable: leasebackableIds(state).length > 0,
    marketExitAvailable: exitableCityIds(state).length > 0,
    restructureAvailable: headquartersCanRestructure(state),
    investorAvailable: remainingInvestorCapacityMinor(state) > 0,
    sellableHotelCount: saleableForCashIds(state).length,
    reducibleStaffCount: reducibleEmployeeIds(state).length,
    turnaroundAvailable: hasReschedulableLoan(state),
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
  if (path === "asset-sale" && leasebackableIds(state).length === 0)
    return {
      ok: false,
      reason: "no owned non-flagship hotel can be leased back",
    };
  if (path === "market-exit" && exitableCityIds(state).length === 0)
    return { ok: false, reason: "no city can be exited" };
  if (path === "restructure" && !headquartersCanRestructure(state))
    return {
      ok: false,
      reason: "headquarters overhead is already at the floor",
    };
  if (path === "investor" && remainingInvestorCapacityMinor(state) <= 0)
    return { ok: false, reason: "investor capacity is exhausted" };
  if (path === "sell-hotel" && saleableForCashIds(state).length === 0)
    return {
      ok: false,
      // A sale that raises nothing is not a way out of a liquidity problem.
      reason: "no hotel would raise anything on a sale",
    };
  if (path === "staff-reduction" && reducibleEmployeeIds(state).length === 0)
    return { ok: false, reason: "the roster is already minimal" };
  if (path === "turnaround" && !hasReschedulableLoan(state))
    return { ok: false, reason: "no loan can be rescheduled" };
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
      const spreadRelief = financingAccessBonusBasisPoints(
        state.narrative.prestige.company,
      );
      if (state.loans && state.loans.length > 0) {
        state.loans[0] = drawLoan(
          state.loans[0].principalMinor + drawn,
          Math.max(
            0,
            state.loans[0].annualRateBasisPoints + 200 - spreadRelief,
          ),
          Math.max(1, state.loans[0].termMonths),
          {
            id: state.loans[0].id,
            amortisation: state.loans[0].amortisation,
            rateType: state.loans[0].rateType,
            spreadBasisPoints: state.loans[0].spreadBasisPoints,
            startMonthIndex: state.loans[0].startMonthIndex,
            collateralValueMinor: state.loans[0].collateralValueMinor,
          },
        );
      } else if (state.loan) {
        state.loan = drawLoan(
          state.loan.principalMinor + drawn,
          Math.max(0, state.loan.annualRateBasisPoints + 200 - spreadRelief),
          Math.max(1, state.loan.termMonths),
        );
      }
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
    case "asset-sale": {
      const hotelId = leasebackableIds(state)[0];
      const proceeds = disposalProceedsMinor(state, hotelId);
      state.company.operatingModels[hotelId] = createOperatingContract({
        kind: "lease",
        monthlyRentMinor: Math.trunc(
          (proceeds * LEASEBACK_ANNUAL_RENT_BASIS_POINTS) / 120_000,
        ),
      });
      ctx.earn(proceeds, "disposal", `sale and leaseback of ${hotelId}`);
      return { measure: path, amountMinor: proceeds };
    }
    case "market-exit": {
      const annualizedGop = (cityId: string) =>
        hotelsInCity(state, cityId).reduce(
          (total, id) =>
            total +
            (state.company.hotelResults[id]?.grossOperatingProfitMinor ?? 0) *
              12,
          0,
        );
      const cityId = exitableCityIds(state).sort(
        (a, b) => annualizedGop(a) - annualizedGop(b) || compareIds(a, b),
      )[0];
      const hotelIds = hotelsInCity(state, cityId);
      const total = hotelIds.reduce(
        (sum, id) => sum + disposalProceedsMinor(state, id),
        0,
      );
      for (const hotelId of hotelIds) {
        state.reputation = applyReputationEvent(state.reputation, {
          dimension: "group",
          scopeId: state.company.companyId,
          delta: -2,
          cause: `closure of ${hotelId} in ${cityId}`,
          atMinutes: state.elapsedMinutes,
        });
        retireHotelFromCompany(state, hotelId);
      }
      state.company.developments = state.company.developments.filter(
        (development) => development.cityId !== cityId,
      );
      ctx.earn(total, "disposal", `market exit from ${cityId}`);
      return { measure: path, amountMinor: total };
    }
    case "restructure": {
      const headquarters = state.company.headquarters;
      const monthlyCost = () =>
        headquartersMonthlyCostMinor({
          hotelCount: state.company.portfolio.hotelIds.length,
          baseMinor: headquarters.baseMonthlyCostMinor,
          perHotelMinor: headquarters.perHotelMonthlyCostMinor,
        });
      const before = monthlyCost();
      headquarters.baseMonthlyCostMinor = Math.max(
        HEADQUARTERS_COST_FLOOR_MINOR,
        headquarters.baseMonthlyCostMinor -
          Math.trunc(
            (headquarters.baseMonthlyCostMinor *
              RESTRUCTURE_SAVING_BASIS_POINTS) /
              10_000,
          ),
      );
      state.company.budgets = state.company.budgets.map((budget) => ({
        ...budget,
        operatingBudgetMinor: Math.trunc(
          (budget.operatingBudgetMinor *
            (10_000 - RESTRUCTURE_SAVING_BASIS_POINTS)) /
            10_000,
        ),
      }));
      const recurringSaving = before - monthlyCost();
      ctx.spend(
        REORGANIZATION_COST_MINOR,
        "supplies",
        "headquarters reorganization",
      );
      return { measure: path, amountMinor: recurringSaving };
    }
    case "investor": {
      const companyValueMinor = valueCompany(state);
      const injection = Math.min(
        Math.abs(netLiquidityMinor(state)),
        remainingInvestorCapacityMinor(state),
      );
      const stake = Math.min(
        INVESTOR_STAKE_CAP_BASIS_POINTS -
          state.company.investorStakeBasisPoints,
        Math.max(1, Math.trunc((injection * 10_000) / companyValueMinor)),
      );
      state.company.investorStakeBasisPoints += stake;
      state.reputation = applyReputationEvent(state.reputation, {
        dimension: "group",
        scopeId: state.company.companyId,
        delta: -2,
        cause: "diluting equity injection",
        atMinutes: state.elapsedMinutes,
      });
      ctx.earn(injection, "capital", "equity injection");
      return { measure: path, amountMinor: injection };
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
    case "turnaround": {
      const loans = state.loans ?? (state.loan ? [state.loan] : []);
      const targetLoan =
        loans.find(
          (l) => l.principalMinor > 0 && l.termMonths < MAX_TERM_MONTHS,
        ) ?? loans[0];
      if (targetLoan) {
        const restructured = restructure(targetLoan, {
          extraMonths: Math.min(
            TURNAROUND_EXTRA_MONTHS,
            MAX_TERM_MONTHS - targetLoan.termMonths,
          ),
          penaltyBasisPoints: TURNAROUND_PENALTY_BASIS_POINTS,
        });
        if (state.loans) {
          state.loans = state.loans.map((l) =>
            l.id === targetLoan.id ? restructured : l,
          );
        } else {
          state.loan = restructured;
        }
      }
      state.reputation = applyReputationEvent(state.reputation, {
        dimension: "group",
        scopeId: state.company.companyId,
        delta: -2,
        cause: "debt turnaround",
        atMinutes: state.elapsedMinutes,
      });
      ctx.spend(
        TURNAROUND_ADVISORY_FEE_MINOR,
        "supplies",
        "turnaround advisory fee",
      );
      return { measure: path, amountMinor: TURNAROUND_ADVISORY_FEE_MINOR };
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
