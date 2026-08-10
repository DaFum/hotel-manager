import type { OpeningChecklistItem } from "../../game/development/preOpening";
import { formatBasisPoints, formatDm } from "../money";

export interface DevelopmentRow {
  id: string;
  name: string;
  rooms: number;
  investmentMinor: number;
  downsideAnnualRoomRevenueMinor: number;
  baseAnnualRoomRevenueMinor: number;
  upsideAnnualRoomRevenueMinor: number;
  returnOnCostBasisPoints: number | null;
  /** Checklist items still outstanding before the house can open. */
  missing: readonly OpeningChecklistItem[];
  openedDateKey: string | null;
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: keep a scheme's forecast and its readiness on the same page, so
 *   the player never opens a hotel that is not staffed or stocked.
 * - Tone: a development file — a banded forecast quoted as a range, and a
 *   checklist that has to be signed off item by item.
 * - Constraints: the open button is disabled with a written reason rather
 *   than silently absent; every outstanding item is named.
 * - Differentiator: the downside case is printed first, because the downside
 *   is what actually decides whether a scheme should be built.
 */
export function DevelopmentDashboard(props: {
  developments: readonly DevelopmentRow[];
  onCompleteTask: (developmentId: string, item: OpeningChecklistItem) => void;
  onOpen: (developmentId: string) => void;
}) {
  if (props.developments.length === 0)
    return (
      <section aria-label="Development pipeline">
        <h2>Development pipeline</h2>
        <p>No scheme is in the pipeline.</p>
      </section>
    );

  return (
    <section aria-label="Development pipeline">
      <h2>Development pipeline</h2>
      {props.developments.map((development) => (
        <article key={development.id} aria-label={development.name}>
          <h3>{development.name}</h3>
          <p>
            {development.rooms} rooms for{" "}
            {formatDm(development.investmentMinor)}
          </p>
          <p aria-label={`${development.name} forecast`}>
            Room revenue {formatDm(development.downsideAnnualRoomRevenueMinor)}{" "}
            to {formatDm(development.upsideAnnualRoomRevenueMinor)} a year, base{" "}
            {formatDm(development.baseAnnualRoomRevenueMinor)}
            {development.returnOnCostBasisPoints === null
              ? ""
              : ` - ${formatBasisPoints(development.returnOnCostBasisPoints)} return on cost`}
          </p>
          {development.openedDateKey ? (
            <p>Opened {development.openedDateKey}</p>
          ) : (
            <>
              <p id={`${development.id}.outstanding`}>
                {development.missing.length === 0
                  ? "Ready to open"
                  : `Outstanding: ${development.missing.join(", ")}`}
              </p>
              {development.missing.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => props.onCompleteTask(development.id, item)}
                  aria-label={`Complete ${item} for ${development.name}`}
                >
                  Sign off {item}
                </button>
              ))}
              <button
                type="button"
                disabled={development.missing.length > 0}
                // A disabled control has to say why, or it is just a dead end.
                aria-describedby={`${development.id}.outstanding`}
                onClick={() => props.onOpen(development.id)}
                aria-label={`Open ${development.name}`}
              >
                Open hotel
              </button>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
