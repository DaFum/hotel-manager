import { useEffect, useRef } from "react";
import type { MonthlyCloseReport } from "../game/finance/monthlyClose";
import { formatBasisPoints, formatDm } from "./money";

export function MonthlyCloseModal(props: {
  report: MonthlyCloseReport | null;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // showModal gives focus placement, focus trapping, Escape, and the backdrop.
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (props.report && !node.open) node.showModal?.();
    if (!props.report && node.open) node.close();
  }, [props.report]);

  const r = props.report;
  return (
    <dialog ref={dialog} aria-label="Monthly close" onClose={props.onDismiss}>
      {r ? (
        <>
          <h2>Monthly close {r.periodKey}</h2>
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
          <button type="button" onClick={() => dialog.current?.close()}>
            Continue
          </button>
        </>
      ) : null}
    </dialog>
  );
}
