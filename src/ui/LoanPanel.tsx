import type { Loan } from "../game/finance/loans";
import { formatBasisPoints, formatDm } from "./money";
import type { GameLocale } from "../i18n";
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
}: LoanPanelProps) {
  const t = (key: string, values?: Record<string, string | number>) =>
    translateGame(locale, key, values);

  return (
    <section aria-label={t("loans.panel.title")}>
      <h2>{t("loans.panel.title")}</h2>
      <div className="loan-summary">
        <dl>
          <div>
            <dt>{t("loans.panel.creditStanding")}</dt>
            <dd
              data-trend={
                creditStandingScore >= 70
                  ? "gain"
                  : creditStandingScore < 40
                    ? "loss"
                    : "flat"
              }
            >
              {creditStandingScore} / 100
            </dd>
          </div>
          <div>
            <dt>{t("loans.panel.offeredRate")}</dt>
            <dd>{formatBasisPoints(offeredRateBp, locale)}</dd>
          </div>
          <div>
            <dt>{t("loans.panel.borrowingCapacity")}</dt>
            <dd>{formatDm(borrowingCapacityMinor, locale)}</dd>
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
            const collateralValueMinor =
              Number(
                (form.elements.namedItem("collateral") as HTMLInputElement)
                  .value || 0,
              ) * 100;

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
                <option value="annuity">Annuity</option>
                <option value="linear">Linear</option>
                <option value="bullet">Bullet</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              {t("loans.panel.rateType")}
              <select name="rateType" defaultValue="fixed" disabled={isPending}>
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
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
                defaultValue="0"
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
        <h3>{t("loans.panel.activeLoans")}</h3>
        {loans.length > 0 ? (
          <table className="register-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Principal</th>
                <th>Rate</th>
                <th>Profile</th>
                <th>Rate Type</th>
                <th>Repay</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>{formatDm(loan.principalMinor, locale)}</td>
                  <td>
                    {formatBasisPoints(loan.annualRateBasisPoints, locale)}
                  </td>
                  <td>{loan.amortisation}</td>
                  <td>{loan.rateType}</td>
                  <td>
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
