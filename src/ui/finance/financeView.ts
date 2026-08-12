import type { GameState } from "../../game/simulation/initialState";
import {
  profitAndLoss,
  cashFlowStatement,
  accountClass,
} from "../../game/finance/statements";
import { debtSchedule } from "../../game/finance/debt";
import { totalForAccountMinor } from "../../game/finance/ledger";
import { totalMonthlyPremiumMinor } from "../../game/risk/insurance";
import { budgetVariance } from "../../game/company/budgets";
import { explainCause } from "../../game/explanations/causeExplanations";

export type FinanceViewInput = Pick<
  GameState,
  | "finance"
  | "statements"
  | "loan"
  | "insurance"
  | "lastMonthlyClose"
  | "renovation"
> & {
  company: Pick<GameState["company"], "treasury" | "budgets">;
  hotelId: string;
  periodKey: string;
};

export interface FinanceView {
  profitAndLoss: ReturnType<typeof profitAndLoss>;
  cashFlow: ReturnType<typeof cashFlowStatement>;
  balanceSheet: {
    cashMinor: number;
    receivablesMinor: number;
    fixedAssetsNetMinor: number;
    totalAssetsMinor: number;
    payablesMinor: number;
    debtMinor: number;
    totalLiabilitiesMinor: number;
    equityMinor: null;
    equityAvailable: false;
  };
  loans: {
    principalMinor: number;
    annualRateBasisPoints: number;
    termMonths: number;
    schedule: ReturnType<typeof debtSchedule>;
  }[];
  investments: {
    capexMinor: number;
    renovation: null | { id: string; phase: string; targetModuleId: string };
    capexVariance: ReturnType<typeof budgetVariance> | null;
  };
  costs: { account: string; amountMinor: number; shareBasisPoints: number }[];
  costCause: ReturnType<typeof explainCause>;
  policies: GameState["insurance"]["policies"];
  claims: GameState["insurance"]["claims"];
  monthlyPremiumMinor: number;
}

/** Ledger-only attribution: this intentionally stops before operational cause chains. */
export function financeView(input: FinanceViewInput): FinanceView {
  const ledger = input.finance.ledger;
  const pnl = profitAndLoss(ledger);
  const accounts = [...new Set(ledger.map((entry) => entry.account))].sort();
  const costs = accounts
    .filter(
      (account) =>
        account !== "otherRevenue" && accountClass(account) === "operating",
    )
    .map((account) => ({
      account,
      amountMinor: Math.max(0, -totalForAccountMinor(ledger, account)),
    }))
    .filter((row) => row.amountMinor > 0)
    .sort(
      (a, b) =>
        b.amountMinor - a.amountMinor || (a.account < b.account ? -1 : 1),
    )
    .map((row) => ({
      ...row,
      shareBasisPoints: pnl.operatingExpenseMinor
        ? Math.trunc((row.amountMinor * 10_000) / pnl.operatingExpenseMinor)
        : 0,
    }));
  const budget =
    input.company.budgets.find(
      (item) =>
        item.hotelId === input.hotelId && item.periodKey === input.periodKey,
    ) ?? null;
  const fixedAssetsNetMinor =
    input.statements.fixedAssetsMinor -
    input.statements.accumulatedDepreciationMinor;
  return {
    profitAndLoss: pnl,
    cashFlow: cashFlowStatement(ledger, {
      openingCashMinor: input.finance.month.openingCashMinor,
    }),
    balanceSheet: {
      cashMinor: input.finance.cashMinor,
      receivablesMinor: input.statements.receivablesMinor,
      fixedAssetsNetMinor,
      totalAssetsMinor:
        input.finance.cashMinor +
        input.statements.receivablesMinor +
        fixedAssetsNetMinor,
      payablesMinor: input.finance.payableMinor,
      debtMinor: input.loan.principalMinor,
      totalLiabilitiesMinor:
        input.finance.payableMinor + input.loan.principalMinor,
      equityMinor: null,
      equityAvailable: false,
    },
    loans:
      input.loan.principalMinor > 0
        ? [{ ...input.loan, schedule: debtSchedule(input.loan) }]
        : [],
    investments: {
      capexMinor: Math.max(0, -totalForAccountMinor(ledger, "capex")),
      renovation: input.renovation
        ? {
            id: input.renovation.id,
            phase: input.renovation.project.phase,
            targetModuleId: input.renovation.targetModuleId,
          }
        : null,
      capexVariance: budget
        ? budgetVariance({
            targetMinor: budget.capexBudgetMinor,
            actualMinor: budget.capexSpentMinor,
            kind: "cost",
          })
        : null,
    },
    costs,
    costCause: explainCause(
      "profitDown",
      costs.slice(0, 3).map((row) => ({
        factor: row.account,
        weight: Math.round(row.shareBasisPoints / 100),
      })),
    ),
    policies: input.insurance.policies,
    claims: input.insurance.claims,
    monthlyPremiumMinor: totalMonthlyPremiumMinor(input.insurance),
  };
}
