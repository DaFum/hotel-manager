import { formatBasisPoints, formatDm } from "./money";

export function RevenueDashboard(props: {
  adrMinor: number;
  revParMinor: number;
  occupancyBasisPoints: number;
  singleRateMinor: number;
  onSetSingleRate: (rateMinor: number) => void;
}) {
  return (
    <section aria-label="Revenue">
      <h2>Revenue</h2>
      <dl>
        <dt>ADR</dt>
        <dd>{formatDm(props.adrMinor)}</dd>
        <dt>RevPAR</dt>
        <dd>{formatDm(props.revParMinor)}</dd>
        <dt>Occupancy</dt>
        <dd>{formatBasisPoints(props.occupancyBasisPoints)}</dd>
        <dt>Single rate</dt>
        <dd>{formatDm(props.singleRateMinor)}</dd>
      </dl>
      <button
        type="button"
        onClick={() => props.onSetSingleRate(props.singleRateMinor + 500)}
      >
        Set single rate
      </button>
    </section>
  );
}
