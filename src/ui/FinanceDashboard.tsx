import type { FinanceView } from "./finance/financeView";
import {
  formatBasisPoints,
  formatDm,
  formatSignedDm,
  trendForMinor,
} from "./money";
import "./theme/data.css";
import "./theme/status.css";

function MoneyRow({
  label,
  amount,
  signed = false,
}: {
  label: string;
  amount: number;
  signed?: boolean;
}) {
  return (
    <div className="ledger-row">
      <dt>{label}</dt>
      <dd data-trend={signed ? trendForMinor(amount) : undefined}>
        {signed ? formatSignedDm(amount) : formatDm(amount)}
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
export function FinanceDashboard({ view }: { view: FinanceView }) {
  const pnl = view.profitAndLoss;
  return (
    <div aria-label="Finance">
      <section aria-label="Profit and loss">
        <h2>Profit and loss</h2>
        <dl>
          <MoneyRow label="Revenue" amount={pnl.revenueMinor} />
          <MoneyRow
            label="Operating expense"
            amount={pnl.operatingExpenseMinor}
          />
          <MoneyRow
            label="Operating profit"
            amount={pnl.operatingProfitMinor}
            signed
          />
          <MoneyRow label="Interest" amount={pnl.interestMinor} />
          <MoneyRow label="Net profit" amount={pnl.netProfitMinor} signed />
        </dl>
      </section>
      <section aria-label="Cashflow">
        <h2>Cashflow</h2>
        <dl>
          <MoneyRow
            label="Opening cash"
            amount={view.cashFlow.openingCashMinor}
          />
          <MoneyRow
            label="Operating cash"
            amount={view.cashFlow.operatingCashMinor}
            signed
          />
          <MoneyRow
            label="Investing cash"
            amount={view.cashFlow.investingCashMinor}
            signed
          />
          <MoneyRow
            label="Financing cash"
            amount={view.cashFlow.financingCashMinor}
            signed
          />
          <MoneyRow
            label="Closing cash"
            amount={view.cashFlow.closingCashMinor}
          />
        </dl>
      </section>
      <section aria-label="Balance sheet">
        <h2>Balance sheet</h2>
        <dl>
          <MoneyRow label="Cash" amount={view.balanceSheet.cashMinor} />
          <MoneyRow
            label="Receivables"
            amount={view.balanceSheet.receivablesMinor}
          />
          <MoneyRow
            label="Net fixed assets"
            amount={view.balanceSheet.fixedAssetsNetMinor}
          />
          <MoneyRow
            label="Total assets"
            amount={view.balanceSheet.totalAssetsMinor}
          />
          <MoneyRow
            label="Total liabilities"
            amount={view.balanceSheet.totalLiabilitiesMinor}
          />
        </dl>
        <p>
          Equity is not yet available: contributed capital and retained earnings
          have no verified snapshot source.
        </p>
      </section>
      <section aria-label="Loans">
        <h2>Loans</h2>
        {view.loans.length ? (
          <table className="register-table">
            <thead>
              <tr>
                <th>Principal</th>
                <th>Rate</th>
                <th>Term</th>
                <th>Next payment</th>
              </tr>
            </thead>
            <tbody>
              {view.loans.map((loan, index) => (
                <tr key={index}>
                  <td>{formatDm(loan.principalMinor)}</td>
                  <td>{formatBasisPoints(loan.annualRateBasisPoints)}</td>
                  <td>{loan.termMonths} months</td>
                  <td>
                    {formatDm(
                      (loan.schedule[0]?.principalMinor ?? 0) +
                        (loan.schedule[0]?.interestMinor ?? 0),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No loans are outstanding.</p>
        )}
      </section>
      <section aria-label="Investments">
        <h2>Investments</h2>
        <p>Capital-account total: {formatDm(view.investments.capexMinor)}</p>
        {view.investments.renovation ? (
          <p>
            {view.investments.renovation.id}:{" "}
            {view.investments.renovation.phase}, target{" "}
            {view.investments.renovation.targetModuleId}
          </p>
        ) : (
          <p>No investment projects are active.</p>
        )}
        {view.investments.capexVariance ? (
          <p
            data-trend={
              view.investments.capexVariance.favourable ? "gain" : "loss"
            }
          >
            {formatSignedDm(view.investments.capexVariance.varianceMinor)} —{" "}
            {view.investments.capexVariance.favourable
              ? "within capital budget"
              : "capital budget overspent"}
          </p>
        ) : null}
      </section>
      <section aria-label="Cost analysis">
        <h2>Cost analysis</h2>
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
                  <th>{row.account}</th>
                  <td>{formatDm(row.amountMinor)}</td>
                  <td>{formatBasisPoints(row.shareBasisPoints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No operating costs have been posted.</p>
        )}
        <p>{view.costCause}</p>
        <p>
          This explanation is ledger-level only; it does not follow multi-hop
          operational causes.
        </p>
      </section>
      <section aria-label="Insurance">
        <h2>Insurance</h2>
        {view.policies.length ? (
          <>
            <p>Monthly premium: {formatDm(view.monthlyPremiumMinor)}</p>
            <ul>
              {view.policies.map((policy) => (
                <li key={policy.id}>
                  {policy.peril}: {formatDm(policy.limitMinor)} limit,{" "}
                  {formatDm(policy.deductibleMinor)} deductible
                </li>
              ))}
            </ul>
            {view.claims.length ? (
              <ul>
                {view.claims.map((claim) => (
                  <li key={claim.id}>
                    {claim.id}: {claim.status}, loss {formatDm(claim.lossMinor)}
                    , settlement {formatDm(claim.settlementMinor)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No insurance claims have been filed.</p>
            )}
          </>
        ) : (
          <p>No insurance policies are in force.</p>
        )}
      </section>
    </div>
  );
}
