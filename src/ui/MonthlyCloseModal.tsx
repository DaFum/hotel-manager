import type { MonthlyCloseReport } from "../game/finance/monthlyClose";
import { formatBasisPoints, formatDm } from "./money";

export function MonthlyCloseModal(props: {
  report: MonthlyCloseReport | null;
  onDismiss: () => void;
}) {
  if (!props.report) return null;
  const r = props.report;
  return (
    <div role="dialog" aria-modal="true" aria-label="Monthly close">
      <h2>Monthly close</h2>
      <dl>
        <dt>Revenue</dt>
        <dd>{formatDm(r.revenueMinor)}</dd>
        <dt>Operating profit</dt>
        <dd>{formatDm(r.operatingProfitMinor)}</dd>
        <dt>Occupancy</dt>
        <dd>{formatBasisPoints(r.occupancyBasisPoints)}</dd>
        <dt>ADR</dt>
        <dd>{formatDm(r.adrMinor)}</dd>
        <dt>RevPAR</dt>
        <dd>{formatDm(r.revParMinor)}</dd>
      </dl>
      <button type="button" onClick={props.onDismiss}>
        Continue
      </button>
    </div>
  );
}
