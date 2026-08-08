import { formatDm } from "./money";

export function FinanceDashboard(props: {
  cashMinor: number;
  loanPrincipalMinor: number;
  monthToDateProfitMinor: number;
}) {
  return (
    <section aria-label="Finance">
      <h2>Finance</h2>
      <dl>
        <dt>Cash</dt>
        <dd>{formatDm(props.cashMinor)}</dd>
        <dt>Loan principal</dt>
        <dd>{formatDm(props.loanPrincipalMinor)}</dd>
        <dt>Profit month to date</dt>
        <dd>{formatDm(props.monthToDateProfitMinor)}</dd>
      </dl>
    </section>
  );
}
