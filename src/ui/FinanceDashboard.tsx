import type { FinanceView } from "./finance/financeView";
import { LoanPanel } from "./LoanPanel";
import type { Loan } from "../game/finance/loans";
import {
  formatBasisPoints,
  formatDm,
  formatSignedDm,
  trendForMinor,
} from "./money";
import "./theme/data.css";
import "./theme/status.css";
import { translateGame, type GameLocale } from "../i18n";

function financeAccountLabel(locale: GameLocale, account: string): string {
  const key = `finance.dashboard.account.${account}`;
  const translated = translateGame(locale, key);
  return translated === key ? account : translated;
}

function costCauseValues(view: FinanceView, locale: GameLocale) {
  const phrases = view.costCause.drivers.map(
    (driver) =>
      `${financeAccountLabel(locale, driver.factor)} (${driver.weight}%)`,
  );
  return {
    drivers:
      phrases.length < 2
        ? (phrases[0] ?? "")
        : `${phrases.slice(0, -1).join(", ")} ${translateGame(locale, "finance.dashboard.and")} ${phrases.at(-1)}`,
  };
}

function MoneyRow({
  label,
  amount,
  signed = false,
  locale,
}: {
  label: string;
  amount: number;
  signed?: boolean;
  locale: GameLocale;
}) {
  return (
    <div className="ledger-row">
      <dt>{label}</dt>
      <dd data-trend={signed ? trendForMinor(amount) : undefined}>
        {signed ? formatSignedDm(amount, locale) : formatDm(amount, locale)}
        {signed
          ? ` — ${translateGame(locale, `finance.dashboard.trend.${trendForMinor(amount)}`)}`
          : null}
      </dd>
    </div>
  );
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: reconcile profit, cash, solvency, debt, investment and risk.
 * - Tone: a continental hotel comptroller's audited register.
 * - Constraints: pure props, tabular figures, explicit signs and textual status.
 * - Differentiator: the ledger-derived cost cause sits beside the statements it explains.
 */
export function FinanceDashboard({
  view,
  locale = "en-GB",
  creditStanding,
  onTakeLoan,
  onRepayLoan,
}: {
  view: FinanceView;
  locale?: GameLocale;
  creditStanding?: {
    score: number;
    offeredRateBp: number;
    borrowingCapacityMinor: number;
  };
  onTakeLoan?: (params: {
    principalMinor: number;
    amortisation: Loan["amortisation"];
    rateType: Loan["rateType"];
    termMonths: number;
    collateralValueMinor?: number;
  }) => void;
  onRepayLoan?: (loanId: string, amountMinor: number) => void;
}) {
  const pnl = view.profitAndLoss;
  const t = (key: string) => translateGame(locale, key);
  return (
    <div aria-label={t("finance.dashboard.title")}>
      <LoanPanel
        offeredRateBp={creditStanding?.offeredRateBp ?? 600}
        borrowingCapacityMinor={
          creditStanding?.borrowingCapacityMinor ?? 10_000_000_00
        }
        creditStandingScore={creditStanding?.score ?? 50}
        totalDebtMinor={view.balanceSheet.debtMinor}
        loans={view.loans}
        onTakeLoan={onTakeLoan ?? (() => {})}
        onRepayLoan={onRepayLoan ?? (() => {})}
        locale={locale}
      />
      <section aria-label={t("finance.dashboard.pnl")}>
        <h2>{t("finance.dashboard.pnl")}</h2>
        <dl>
          <MoneyRow
            label={t("finance.dashboard.revenue")}
            amount={pnl.revenueMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.operatingExpense")}
            amount={pnl.operatingExpenseMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.operatingProfit")}
            amount={pnl.operatingProfitMinor}
            signed
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.interest")}
            amount={pnl.interestMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.netProfit")}
            amount={pnl.netProfitMinor}
            signed
            locale={locale}
          />
        </dl>
      </section>
      <section aria-label={t("finance.dashboard.cashflow")}>
        <h2>{t("finance.dashboard.cashflow")}</h2>
        <dl>
          <MoneyRow
            label={t("finance.dashboard.openingCash")}
            amount={view.cashFlow.openingCashMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.operatingCash")}
            amount={view.cashFlow.operatingCashMinor}
            signed
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.investingCash")}
            amount={view.cashFlow.investingCashMinor}
            signed
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.financingCash")}
            amount={view.cashFlow.financingCashMinor}
            signed
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.closingCash")}
            amount={view.cashFlow.closingCashMinor}
            locale={locale}
          />
        </dl>
      </section>
      <section aria-label={t("finance.dashboard.balanceSheet")}>
        <h2>{t("finance.dashboard.balanceSheet")}</h2>
        <dl>
          <MoneyRow
            label={t("finance.dashboard.cash")}
            amount={view.balanceSheet.cashMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.receivables")}
            amount={view.balanceSheet.receivablesMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.fixedAssets")}
            amount={view.balanceSheet.fixedAssetsNetMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.totalAssets")}
            amount={view.balanceSheet.totalAssetsMinor}
            locale={locale}
          />
          <MoneyRow
            label={t("finance.dashboard.totalLiabilities")}
            amount={view.balanceSheet.totalLiabilitiesMinor}
            locale={locale}
          />
        </dl>
        <p>{t("finance.dashboard.equityUnavailable")}</p>
      </section>
      <section aria-label={t("finance.dashboard.investments")}>
        <h2>{t("finance.dashboard.investments")}</h2>
        <p>
          {t("finance.dashboard.capex")}:{" "}
          {formatDm(view.investments.capexMinor, locale)}
        </p>
        {view.investments.renovation ? (
          <p>
            {translateGame(locale, "finance.dashboard.renovationDetail", {
              id: view.investments.renovation.id,
              phase: `finance.dashboard.renovationPhase.${view.investments.renovation.phase}`,
              target: view.investments.renovation.targetModuleId,
            })}
          </p>
        ) : (
          <p>{t("finance.dashboard.noInvestments")}</p>
        )}
        {view.investments.capexVariance ? (
          <p
            data-trend={
              view.investments.capexVariance.favourable ? "gain" : "loss"
            }
          >
            {formatSignedDm(
              view.investments.capexVariance.varianceMinor,
              locale,
            )}{" "}
            —{" "}
            {view.investments.capexVariance.favourable
              ? t("finance.dashboard.withinBudget")
              : t("finance.dashboard.overspent")}
          </p>
        ) : null}
      </section>
      <section aria-label={t("finance.dashboard.costAnalysis")}>
        <h2>{t("finance.dashboard.costAnalysis")}</h2>
        {view.costs.length ? (
          <table className="register-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Cost</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {view.costs.map((row) => (
                <tr key={row.account}>
                  <th>{financeAccountLabel(locale, row.account)}</th>
                  <td>{formatDm(row.amountMinor, locale)}</td>
                  <td>{formatBasisPoints(row.shareBasisPoints, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("finance.dashboard.noCosts")}</p>
        )}
        <p>
          {translateGame(
            locale,
            view.costCause.key,
            costCauseValues(view, locale),
          )}
        </p>
        <p>{t("finance.dashboard.causeBoundary")}</p>
      </section>
      <section aria-label={t("finance.dashboard.insurance")}>
        <h2>{t("finance.dashboard.insurance")}</h2>
        {view.policies.length ? (
          <>
            <p>
              {t("finance.dashboard.premium")}:{" "}
              {formatDm(view.monthlyPremiumMinor, locale)}
            </p>
            <ul>
              {view.policies.map((policy) => (
                <li key={policy.id}>
                  {translateGame(
                    locale,
                    `finance.dashboard.peril.${policy.peril}`,
                  )}
                  : {formatDm(policy.limitMinor, locale)}{" "}
                  {t("finance.dashboard.limit")},{" "}
                  {formatDm(policy.deductibleMinor, locale)}{" "}
                  {t("finance.dashboard.deductible")}
                </li>
              ))}
            </ul>
            {view.claims.length ? (
              <ul>
                {view.claims.map((claim) => (
                  <li key={claim.id}>
                    {claim.id}:{" "}
                    {translateGame(
                      locale,
                      `finance.dashboard.claimStatus.${claim.status}`,
                    )}
                    , {t("finance.dashboard.loss")}{" "}
                    {formatDm(claim.lossMinor, locale)},{" "}
                    {t("finance.dashboard.settlement")}{" "}
                    {formatDm(claim.settlementMinor, locale)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("finance.dashboard.noClaims")}</p>
            )}
          </>
        ) : (
          <p>{t("finance.dashboard.noPolicies")}</p>
        )}
      </section>
    </div>
  );
}
