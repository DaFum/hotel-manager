import { formatDm } from "./money";

function trend(amountMinor: number): "gain" | "loss" | "flat" {
  if (amountMinor > 0) return "gain";
  if (amountMinor < 0) return "loss";
  return "flat";
}

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
        {/* The formatted figure already carries its own sign; the trend only
            colours what the number has already said. */}
        <dd data-trend={trend(props.monthToDateProfitMinor)}>
          {formatDm(props.monthToDateProfitMinor)}
        </dd>
      </dl>
    </section>
  );
}
