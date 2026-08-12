import "./guests.css";
import { translateKey } from "../localization";

export interface SatisfactionRow {
  score: number;
  causes: string[];
}

export interface ComplaintRow {
  complaintId: string;
  partyId: string;
  bookingId: string;
  roomId: string | null;
  stayLabel: string;
  segment: string;
  stage: string;
  cause: string;
  why: { key: string; values: Record<string, string | number> };
  status: "offered" | "accepted" | "refused" | "escalated";
  cost: string;
  handled: boolean;
}

export interface ReviewRow {
  partyId: string;
  bookingId: string;
  roomId: string | null;
  stayLabel: string;
  segment: string;
  stage: string;
  score: number;
  reasons: string[];
}

export interface ReceptionRow {
  bookingId: string;
  waitedMinutes: number;
  waitingTooLong: boolean;
}

export interface LoyaltyRow {
  guestId: string;
  tier: string;
  points: number;
  qualifyingNights: number;
  liability: string;
}

export interface RepeatGuestRow {
  guestId: string;
  visits: number;
  consent: string;
  preferences: string[];
}

export interface GuestReputationRow {
  dimension: string;
  scopeId: string;
  score: number;
  effect: string;
  topCause: string | null;
}

function EmptyList({ message }: { message: string }) {
  return <p>{message}</p>;
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: show why guests are unhappy and let the player reach the stay,
 *   room, or department behind a complaint or review.
 * - Tone: an editorial guest-relations ledger — composed, candid and precise.
 * - Constraints: snapshot rows only, semantic lists and disclosures, and no
 *   status communicated by colour alone.
 * - Differentiator: every poor experience opens into a compact case file that
 *   connects the feeling, operational cause and physical room.
 */
export function GuestsDashboard(props: {
  satisfaction: SatisfactionRow;
  complaints: readonly ComplaintRow[];
  reviews: readonly ReviewRow[];
  reception: readonly ReceptionRow[];
  loyalty: readonly LoyaltyRow[];
  repeatGuests: readonly RepeatGuestRow[];
  reputation: readonly GuestReputationRow[];
  openComplaintId: string | null;
  onOpen: (id: string) => void;
  onSelectRoom?: (roomId: string) => void;
}) {
  return (
    <section aria-label="Guests" className="guest-ledger">
      <header className="guest-ledger__masthead">
        <p>Guest relations · case ledger</p>
        <h2>Guests</h2>
      </header>

      <section aria-label="Guest satisfaction" className="guest-ledger__score">
        <h3>Guest satisfaction</h3>
        <p className="guest-ledger__score-value">
          {props.satisfaction.score}
          <span>/100</span>
        </p>
        {props.satisfaction.causes.length ? (
          <ul>
            {props.satisfaction.causes.map((cause, index) => (
              <li key={`${index}:${cause}`}>{cause}</li>
            ))}
          </ul>
        ) : (
          <p>No satisfaction drivers have been recorded yet.</p>
        )}
      </section>

      <section aria-label="Complaints" className="guest-ledger__cases">
        <h3>Complaints</h3>
        {props.complaints.length ? (
          <ul>
            {props.complaints.map((row) => {
              const open = props.openComplaintId === row.complaintId;
              return (
                <li key={row.complaintId}>
                  <strong>{row.cause}</strong> — {row.status};{" "}
                  {row.handled ? "handled" : "pending"}; {row.cost}
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => props.onOpen(row.complaintId)}
                  >
                    {open ? "Close case" : "Open case"}
                  </button>
                  {row.roomId ? (
                    <button
                      type="button"
                      onClick={() => props.onSelectRoom?.(row.roomId!)}
                    >
                      Select room {row.roomId}
                    </button>
                  ) : null}
                  {open ? (
                    <div aria-live="polite">
                      <p>
                        {translateKey(row.stayLabel)}; room{" "}
                        {row.roomId ?? "unknown room"}; department: {row.stage};
                        segment: {row.segment}
                      </p>
                      <p>{translateKey(row.why.key, row.why.values)}</p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyList message="No complaints have been raised yet." />
        )}
      </section>

      <section aria-label="Guest reviews">
        <h3>Guest reviews</h3>
        {props.reviews.length ? (
          <ul>
            {props.reviews.map((row) => {
              const disclosureId = `review.${row.partyId}`;
              const open = props.openComplaintId === disclosureId;
              return (
                <li key={row.partyId}>
                  <strong>{row.score}/100</strong> — {row.segment}
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => props.onOpen(disclosureId)}
                  >
                    {open ? "Close review" : "Open review"}
                  </button>
                  {row.roomId ? (
                    <button
                      type="button"
                      onClick={() => props.onSelectRoom?.(row.roomId!)}
                    >
                      Select room {row.roomId}
                    </button>
                  ) : null}
                  {open ? (
                    <div aria-live="polite">
                      <p>
                        {translateKey(row.stayLabel)}; room{" "}
                        {row.roomId ?? "unknown room"}; department: {row.stage}
                      </p>
                      <ul>
                        {row.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyList message="No guests have left a review yet." />
        )}
      </section>

      <section aria-label="Reception queue">
        <h3>Reception queue</h3>
        {props.reception.length ? (
          <ul>
            {props.reception.map((row) => (
              <li key={row.bookingId}>
                {row.bookingId}: {row.waitedMinutes} minutes —{" "}
                {row.waitingTooLong ? "waiting too long" : "within tolerance"}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message="Nobody is waiting at reception." />
        )}
      </section>

      <section aria-label="Guest loyalty">
        <h3>Guest loyalty</h3>
        {props.loyalty.length ? (
          <ul>
            {props.loyalty.map((row) => (
              <li key={row.guestId}>
                {row.guestId}: {row.tier}, {row.points} points,{" "}
                {row.qualifyingNights} qualifying nights — scheme liability{" "}
                {row.liability}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message="No guests have joined the loyalty scheme." />
        )}
      </section>

      <section aria-label="Repeat guests">
        <h3>Repeat guests</h3>
        {props.repeatGuests.length ? (
          <ul>
            {props.repeatGuests.map((row) => (
              <li key={row.guestId}>
                {row.guestId}: {row.visits} visits; consent: {row.consent};
                preferences:{" "}
                {row.preferences.length
                  ? row.preferences.join(", ")
                  : "none recorded"}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message="No repeat guest profiles have been recorded." />
        )}
      </section>

      <section aria-label="Guest reputation">
        <h3>Guest reputation</h3>
        {props.reputation.length ? (
          <ul>
            {props.reputation.map((row) => (
              <li key={`${row.dimension}.${row.scopeId}`}>
                {row.dimension} ({row.scopeId}): {row.score}/100 — affects{" "}
                {row.effect}
                {row.topCause ? `; latest: ${row.topCause}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message="No guest-facing reputation has been recorded." />
        )}
      </section>
    </section>
  );
}
