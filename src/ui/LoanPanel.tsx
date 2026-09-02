import { useState } from "react";
import type { Loan } from "../game/finance/loans";
import {
  calculateCreditStanding,
  type CreditStandingInputs,
} from "../game/finance/creditStanding";
import { formatBasisPoints, formatDm } from "./money";
import type { GameLocale } from "../i18n";
import { entityLabel } from "./entityNames";
import { translateGame } from "../i18n";

export interface LoanPanelProps {
  offeredRateBp: number;
  borrowingCapacityMinor: number;
  creditStandingScore: number;
  totalDebtMinor: number;
  loans: Loan[];
  onTakeLoan: (params: {
    principalMinor: number;
    amortisation: Loan["amortisation"];
    rateType: Loan["rateType"];
    termMonths: number;
    collateralValueMinor?: number;
  }) => void;
  onRepayLoan: (loanId: string, amountMinor: number) => void;
  isPending?: boolean;
  locale?: GameLocale;
  creditStandingInputs?: CreditStandingInputs;
  availableCollateralMinor?: number;
}

export function LoanPanel({
  offeredRateBp,
  borrowingCapacityMinor,
  creditStandingScore,
  totalDebtMinor,
  loans,
  onTakeLoan,
  onRepayLoan,
  isPending = false,
  locale = "en-GB",
  creditStandingInputs,
  availableCollateralMinor,
}: LoanPanelProps) {
  const t = (key: string, values?: Record<string, string | number>) =>
    translateGame(locale, key, values);

  const [proposedCollateralDm, setProposedCollateralDm] = useState(0);
  const rawProposedCollateralMinor = proposedCollateralDm * 100;
  const proposedCollateralMinor =
    availableCollateralMinor !== undefined
      ? Math.min(
          rawProposedCollateralMinor,
          Math.max(0, availableCollateralMinor),
        )
      : rawProposedCollateralMinor;

  const dynamicStanding = creditStandingInputs
    ? calculateCreditStanding({
        ...creditStandingInputs,
        totalCollateralValueMinor:
          creditStandingInputs.totalCollateralValueMinor +
          proposedCollateralMinor,
      })
    : null;

  const displayScore = dynamicStanding?.score ?? creditStandingScore;
  const displayOfferedRateBp = dynamicStanding?.offeredRateBp ?? offeredRateBp;
  const displayBorrowingCapacityMinor =
    dynamicStanding?.borrowingLimitMinor ?? borrowingCapacityMinor;

  return (
    <section aria-label={t("loans.panel.title")}>
      <h2>{t("loans.panel.title")}</h2>
      <div className="loan-summary">
        <dl>
          <div>
            <dt>{t("loans.panel.creditStanding")}</dt>
            <dd
              data-trend={
                displayScore >= 70
                  ? "gain"
                  : displayScore < 40
                    ? "loss"
                    : "flat"
              }
            >
              {displayScore} / 100
            </dd>
          </div>
          <div>
            <dt>{t("loans.panel.offeredRate")}</dt>
            <dd>{formatBasisPoints(displayOfferedRateBp, locale)}</dd>
          </div>
          <div>
            <dt>{t("loans.panel.borrowingCapacity")}</dt>
            <dd>{formatDm(displayBorrowingCapacityMinor, locale)}</dd>
          </div>
          <div>
            <dt>{t("loans.panel.totalOutstanding")}</dt>
            <dd>{formatDm(totalDebtMinor, locale)}</dd>
          </div>
        </dl>
      </div>

      <div className="loan-take-form">
        <h3>{t("loans.panel.takeLoan")}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const principalMinor =
              Number(
                (form.elements.namedItem("principal") as HTMLInputElement)
                  .value,
              ) * 100;
            const termMonths = Number(
              (form.elements.namedItem("term") as HTMLInputElement).value,
            );
            const amortisation = (
              form.elements.namedItem("amortisation") as HTMLSelectElement
            ).value as Loan["amortisation"];
            const rateType = (
              form.elements.namedItem("rateType") as HTMLSelectElement
            ).value as Loan["rateType"];
            const collateralValueMinor = proposedCollateralMinor;

            onTakeLoan({
              principalMinor,
              termMonths,
              amortisation,
              rateType,
              collateralValueMinor,
            });
          }}
        >
          <div>
            <label>
              {t("loans.panel.principal")}
              <input
                name="principal"
                type="number"
                min="100"
                step="100"
                defaultValue="10000"
                required
                disabled={isPending}
              />
            </label>
          </div>
          <div>
            <label>
              {t("loans.panel.termMonths")}
              <input
                name="term"
                type="number"
                min="1"
                max="600"
                defaultValue="12"
                required
                disabled={isPending}
              />
            </label>
          </div>
          <div>
            <label>
              {t("loans.panel.amortisation")}
              <select
                name="amortisation"
                defaultValue="bullet"
                disabled={isPending}
              >
                <option value="annuity">
                  {t("loans.panel.amortisationOption.annuity")}
                </option>
                <option value="linear">
                  {t("loans.panel.amortisationOption.linear")}
                </option>
                <option value="bullet">
                  {t("loans.panel.amortisationOption.bullet")}
                </option>
              </select>
            </label>
          </div>
          <div>
            <label>
              {t("loans.panel.rateType")}
              <select name="rateType" defaultValue="fixed" disabled={isPending}>
                <option value="fixed">
                  {t("loans.panel.rateTypeOption.fixed")}
                </option>
                <option value="variable">
                  {t("loans.panel.rateTypeOption.variable")}
                </option>
              </select>
            </label>
          </div>
          <div>
            <label>
              {t("loans.panel.collateral")}
              <input
                name="collateral"
                type="number"
                min="0"
                value={proposedCollateralDm}
                onChange={(e) =>
                  setProposedCollateralDm(
                    Math.max(0, Number(e.target.value) || 0),
                  )
                }
                disabled={isPending}
              />
            </label>
          </div>
          <button type="submit" disabled={isPending}>
            {t("loans.panel.drawLoan")}
          </button>
        </form>
      </div>

      <div className="loan-list">
        <h3 id="active-loans-heading">{t("loans.panel.activeLoans")}</h3>
        {loans.length > 0 ? (
          <table
            className="register-table hm-responsive-table"
            aria-labelledby="active-loans-heading"
          >
            <thead>
              <tr>
                <th>{t("loans.panel.table.id")}</th>
                <th>{t("loans.panel.table.principal")}</th>
                <th>{t("loans.panel.table.rate")}</th>
                <th>{t("loans.panel.table.profile")}</th>
                <th>{t("loans.panel.table.rateType")}</th>
                <th>{t("loans.panel.table.repay")}</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td data-label={t("loans.panel.table.id")}>
                    {entityLabel(loan.id, locale)}
                  </td>
                  <td data-label={t("loans.panel.table.principal")}>
                    {formatDm(loan.principalMinor, locale)}
                  </td>
                  <td data-label={t("loans.panel.table.rate")}>
                    {formatBasisPoints(loan.annualRateBasisPoints, locale)}
                  </td>
                  <td data-label={t("loans.panel.table.profile")}>
                    {t(`loans.panel.amortisationOption.${loan.amortisation}`)}
                  </td>
                  <td data-label={t("loans.panel.table.rateType")}>
                    {t(`loans.panel.rateTypeOption.${loan.rateType}`)}
                  </td>
                  <td data-label={t("loans.panel.table.repay")}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onRepayLoan(loan.id, loan.principalMinor)}
                    >
                      {t("loans.panel.repayFull")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("finance.dashboard.noLoans")}</p>
        )}
      </div>
    </section>
  );
}
