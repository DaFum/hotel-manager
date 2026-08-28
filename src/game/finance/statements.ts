import { compareIds } from "../domain/ids";
import { assertMinor, assertNonNegativeMinor } from "../domain/units";
import type { LedgerEntry } from "./ledger";

/**
 * The three statements, kept apart on purpose. Profit is not cash and cash is
 * not solvency: a hotel can be profitable and unable to pay its wages, and the
 * player has to be able to see that happening rather than discover it.
 */

export type AccountClass =
  | "revenue"
  | "operating"
  | "capital"
  | "investing"
  | "borrowing"
  | "equity"
  | "financing"
  | "tax"
  | "settlement";

/**
 * Which statement each account belongs to. An account missing from here is
 * treated as operating, which is the safe reading: a cost of unknown kind is
 * a cost of trading, never quietly capitalised into an asset.
 *
 * That default is safe for a cost and wrong for everything else, which is why
 * money that is not trading has to be named here. Capital contributed by the
 * owner, a loan drawn down and a hotel sold are not things the hotel earned,
 * and a stake bought in something is not a cost of running it; left to the
 * default, each of them would move operating profit by its full amount.
 */
export const ACCOUNT_CLASSES: Record<string, AccountClass> = {
  roomRevenue: "revenue",
  breakfastRevenue: "revenue",
  restaurantRevenue: "revenue",
  barRevenue: "revenue",
  roomServiceRevenue: "revenue",
  wellnessRevenue: "revenue",
  eventRevenue: "revenue",
  portfolioRevenue: "revenue",
  managementFee: "revenue",
  loyaltyBreakage: "revenue",
  commercialSpaces: "revenue",
  otherRevenue: "revenue",
  wages: "operating",
  foodCost: "operating",
  supplies: "operating",
  maintenance: "operating",
  utilities: "operating",
  laundry: "operating",
  marketResearch: "operating",
  advisory: "operating",
  headquarters: "operating",
  brandProgramme: "operating",
  leaseRent: "operating",
  franchiseRoyalty: "operating",
  portfolioOperating: "operating",
  insurancePremium: "operating",
  insuranceSettlement: "revenue",
  campaignSpend: "operating",
  loyaltyBenefit: "operating",
  groupDeposit: "settlement",
  serviceRecovery: "operating",
  receivableSettlement: "settlement",
  receivableCollection: "settlement",
  supplierSettlement: "settlement",
  capex: "capital",
  // A stake bought in a venture and a house sold out of the group are both the
  // group moving capital about, not the hotel trading.
  investment: "investing",
  disposal: "investing",
  // Principal drawn from the bank is money owed, not money earned; the cost of
  // having borrowed it is the interest, and that is a financing cost.
  loan: "borrowing",
  loanPrincipal: "borrowing",
  capital: "equity",
  interest: "financing",
  tax: "tax",
  // Paying an overdue bill is cash leaving for an expense already recognised.
  // Counting it again would double the cost and inflate interest.
  payables: "settlement",
  supplierAccrual: "settlement",
  receivableAccrual: "settlement",
};

export function accountClass(account: string): AccountClass {
  return ACCOUNT_CLASSES[account] ?? "operating";
}

export function isCapitalAccount(account: string): boolean {
  return accountClass(account) === "capital";
}

export interface ProfitAndLoss {
  revenueMinor: number;
  operatingExpenseMinor: number;
  operatingProfitMinor: number;
  interestMinor: number;
  taxMinor: number;
  netProfitMinor: number;
}

/** Trading only: capital spend buys an asset and belongs nowhere in here. */
export function profitAndLoss(
  ledger: readonly LedgerEntry[],
  outstandingTaxMinor = 0,
): ProfitAndLoss {
  let revenueMinor = 0;
  let operatingExpenseMinor = 0;
  let interestMinor = 0;
  let taxPaidMinor = 0;
  for (const entry of ledger)
    switch (accountClass(entry.account)) {
      case "revenue":
        revenueMinor += entry.amountMinor;
        break;
      case "operating":
        // Expenses are stored signed; the statement quotes them positive.
        operatingExpenseMinor += -entry.amountMinor;
        break;
      case "financing":
        interestMinor += -entry.amountMinor;
        break;
      case "tax":
        taxPaidMinor += -entry.amountMinor;
        break;
      case "capital":
      case "investing":
      case "borrowing":
      case "equity":
      case "settlement":
        break;
    }
  const operatingProfitMinor = revenueMinor - operatingExpenseMinor;
  const taxMinor = taxPaidMinor + outstandingTaxMinor;
  return {
    revenueMinor,
    operatingExpenseMinor,
    operatingProfitMinor,
    interestMinor,
    taxMinor,
    netProfitMinor: operatingProfitMinor - interestMinor - taxMinor,
  };
}

export interface CashFlowStatement {
  openingCashMinor: number;
  operatingCashMinor: number;
  investingCashMinor: number;
  /** Money from the owner and the bank, and principal handed back to them. */
  financingCashMinor: number;
  closingCashMinor: number;
}

/**
 * The same period as money actually moving, where capital spend does count.
 *
 * Interest stays in operating: it is what this month's trading cost to
 * finance. Principal and contributed capital do not, because a hotel that
 * covers its wages out of a new loan is not a hotel that covered its wages.
 */
export function cashFlowStatement(
  ledger: readonly LedgerEntry[],
  input: { openingCashMinor: number },
): CashFlowStatement {
  assertMinor(input.openingCashMinor, "opening cash");
  let operatingCashMinor = 0;
  let investingCashMinor = 0;
  let financingCashMinor = 0;
  for (const entry of ledger)
    switch (accountClass(entry.account)) {
      case "capital":
      case "investing":
        investingCashMinor += entry.amountMinor;
        break;
      case "borrowing":
      case "equity":
        financingCashMinor += entry.amountMinor;
        break;
      case "tax":
      default:
        operatingCashMinor += entry.amountMinor;
    }
  return {
    openingCashMinor: input.openingCashMinor,
    operatingCashMinor,
    investingCashMinor,
    financingCashMinor,
    closingCashMinor:
      input.openingCashMinor +
      operatingCashMinor +
      investingCashMinor +
      financingCashMinor,
  };
}

export interface BalanceSheetInput {
  cashMinor: number;
  receivablesMinor: number;
  fixedAssetsMinor: number;
  accumulatedDepreciationMinor: number;
  payablesMinor: number;
  taxPayableMinor: number;
  debtMinor: number;
  contributedCapitalMinor: number;
  retainedEarningsMinor: number;
}

export interface BalanceSheet {
  totalAssetsMinor: number;
  totalLiabilitiesMinor: number;
  equityMinor: number;
  /** Whether assets equal liabilities plus equity; reported, never forced. */
  balances: boolean;
}

export function balanceSheet(input: BalanceSheetInput): BalanceSheet {
  const totalAssetsMinor =
    input.cashMinor +
    input.receivablesMinor +
    input.fixedAssetsMinor -
    input.accumulatedDepreciationMinor;
  const totalLiabilitiesMinor =
    input.payablesMinor + input.taxPayableMinor + input.debtMinor;
  const equityMinor =
    input.contributedCapitalMinor + input.retainedEarningsMinor;
  return {
    totalAssetsMinor,
    totalLiabilitiesMinor,
    equityMinor,
    balances: totalAssetsMinor === totalLiabilitiesMinor + equityMinor,
  };
}

/** Straight line, and never more than the asset has left to give up. */
export function depreciationMinor(input: {
  costMinor: number;
  usefulLifeMonths: number;
  accumulatedMinor?: number;
}): number {
  assertNonNegativeMinor(input.costMinor, "asset cost");
  if (
    !Number.isSafeInteger(input.usefulLifeMonths) ||
    input.usefulLifeMonths <= 0
  )
    throw new Error("invalid useful life");
  const accumulated = input.accumulatedMinor ?? 0;
  assertNonNegativeMinor(accumulated, "accumulated depreciation");
  return Math.max(
    0,
    Math.min(
      Math.trunc(input.costMinor / input.usefulLifeMonths),
      input.costMinor - accumulated,
    ),
  );
}

/** Money the hotel has earned but not yet been paid. */
export interface Receivable {
  id: string;
  amountMinor: number;
  dueDateKey: string;
}

/** The accrual half of the accounts, alongside the cash the ledger records. */
export interface StatementsState {
  receivables: Receivable[];
  receivablesMinor: number;
  fixedAssetsMinor: number;
  accumulatedDepreciationMinor: number;
  depreciationThisPeriodMinor: number;
  /** Depreciation already posted per asset, so a reload cannot repeat it. */
  depreciationByAsset: Record<string, number>;
  /** The last period depreciation was posted for; a guard against duplicates. */
  lastDepreciationPeriodKey: string | null;
  contributedCapitalMinor: number;
  retainedEarningsMinor: number;
}

export function createStatements(): StatementsState {
  return {
    receivables: [],
    receivablesMinor: 0,
    fixedAssetsMinor: 0,
    accumulatedDepreciationMinor: 0,
    depreciationThisPeriodMinor: 0,
    depreciationByAsset: {},
    lastDepreciationPeriodKey: null,
    contributedCapitalMinor: 0,
    retainedEarningsMinor: 0,
  };
}

export function recogniseReceivable(
  statements: StatementsState,
  receivable: Receivable,
): StatementsState {
  assertNonNegativeMinor(receivable.amountMinor, "receivable");
  if (statements.receivables.some((r) => r.id === receivable.id))
    throw new Error(`receivable ${receivable.id} already exists`);
  return {
    ...statements,
    receivables: [...statements.receivables, { ...receivable }].sort((a, b) =>
      compareIds(a.id, b.id),
    ),
    receivablesMinor: statements.receivablesMinor + receivable.amountMinor,
  };
}

export function settleReceivable(
  statements: StatementsState,
  id: string,
): StatementsState {
  const receivable = statements.receivables.find((r) => r.id === id);
  if (!receivable) throw new Error(`unknown receivable ${id}`);
  return {
    ...statements,
    receivables: statements.receivables.filter((r) => r.id !== id),
    receivablesMinor: statements.receivablesMinor - receivable.amountMinor,
  };
}

/**
 * Depreciation is an expense that moves no cash, which is why it is posted
 * here rather than through the ledger's cash path.
 */
export function postDepreciation(
  statements: StatementsState,
  input: { assetId: string; amountMinor: number; periodKey: string },
): StatementsState {
  assertNonNegativeMinor(input.amountMinor, "depreciation");
  const alreadyThisPeriod =
    statements.lastDepreciationPeriodKey === input.periodKey;
  return {
    ...statements,
    accumulatedDepreciationMinor:
      statements.accumulatedDepreciationMinor + input.amountMinor,
    depreciationThisPeriodMinor: alreadyThisPeriod
      ? statements.depreciationThisPeriodMinor + input.amountMinor
      : input.amountMinor,
    depreciationByAsset: {
      ...statements.depreciationByAsset,
      [input.assetId]:
        (statements.depreciationByAsset[input.assetId] ?? 0) +
        input.amountMinor,
    },
    lastDepreciationPeriodKey: input.periodKey,
  };
}

/** Capitalises a purchase; the cash side is the ledger's capex posting. */
export function capitaliseAsset(
  statements: StatementsState,
  amountMinor: number,
): StatementsState {
  assertNonNegativeMinor(amountMinor, "capitalised asset");
  return {
    ...statements,
    fixedAssetsMinor: statements.fixedAssetsMinor + amountMinor,
  };
}

/** Posts asset disposal and gain/loss on investment/asset disposal. */
export function disposeInvestmentAsset(
  statements: StatementsState,
  input: { investedMinor: number; outcomeMinor: number },
): StatementsState {
  assertNonNegativeMinor(input.investedMinor, "invested asset");
  return {
    ...statements,
    fixedAssetsMinor: statements.fixedAssetsMinor - input.investedMinor,
    retainedEarningsMinor:
      statements.retainedEarningsMinor + input.outcomeMinor,
  };
}

/** Receivables that have fallen due on or before a date, in stable order. */
export function overdueReceivables(
  statements: StatementsState,
  dateKey: string,
): Receivable[] {
  return statements.receivables.filter((r) => r.dueDateKey <= dateKey);
}

export function taxChargeMinor(
  preTaxBaseMinor: number,
  rateBasisPoints: number,
): number {
  if (preTaxBaseMinor <= 0) return 0;
  if (!Number.isSafeInteger(rateBasisPoints) || rateBasisPoints < 0)
    throw new Error("invalid tax rate");
  const quotient = Math.trunc(preTaxBaseMinor / 10_000);
  const remainder = preTaxBaseMinor % 10_000;
  return (
    quotient * rateBasisPoints +
    Math.trunc((remainder * rateBasisPoints) / 10_000)
  );
}
