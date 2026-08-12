import "./guests.css";
import { translateGame, type GameLocale } from "../../i18n";

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
  why: {
    key: string;
    values: Record<string, string | number>;
    drivers: { factor: string; weight: number }[];
  };
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

function explanationValues(
  why: ComplaintRow["why"],
  locale: GameLocale,
): Record<string, string | number> {
  const phrases = why.drivers.map(
    (driver) => `${driver.factor} (${driver.weight}%)`,
  );
  const conjunction = translateGame(locale, "guests.and");
  return {
    drivers:
      phrases.length < 2
        ? (phrases[0] ?? "")
        : `${phrases.slice(0, -1).join(", ")} ${conjunction} ${phrases.at(-1)}`,
  };
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
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);
  return (
    <section aria-label={t("guests.title")} className="guest-ledger">
      <header className="guest-ledger__masthead">
        <p>{t("guests.kicker")}</p>
        <h2>{t("guests.title")}</h2>
      </header>

      <section
        aria-label={t("guests.satisfaction.title")}
        className="guest-ledger__score"
      >
        <h3>{t("guests.satisfaction.title")}</h3>
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
          <p>{t("guests.satisfaction.empty")}</p>
        )}
      </section>

      <section
        aria-label={t("guests.complaints.title")}
        className="guest-ledger__cases"
      >
        <h3>{t("guests.complaints.title")}</h3>
        {props.complaints.length ? (
          <ul>
            {props.complaints.map((row) => {
              const open = props.openComplaintId === row.complaintId;
              return (
                <li key={row.complaintId}>
                  <strong>{row.cause}</strong> —{" "}
                  {t(`guests.complaints.status.${row.status}`)};{" "}
                  {row.handled
                    ? t("guests.complaints.handled")
                    : t("guests.complaints.pending")}
                  ; {row.cost}
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => props.onOpen(row.complaintId)}
                  >
                    {open
                      ? t("guests.complaints.close")
                      : t("guests.complaints.open")}
                  </button>
                  {row.roomId ? (
                    <button
                      type="button"
                      onClick={() => props.onSelectRoom?.(row.roomId!)}
                    >
                      {t("guests.selectRoom", { roomId: row.roomId })}
                    </button>
                  ) : null}
                  {open ? (
                    <div aria-live="polite">
                      <p>
                        {t("guests.detail", {
                          stay: row.stayLabel,
                          room: row.roomId ?? "guest.unknown.room",
                          stage: row.stage,
                          segment: row.segment,
                        })}
                      </p>
                      <p>
                        {t(row.why.key, explanationValues(row.why, locale))}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyList message={t("guests.complaints.empty")} />
        )}
      </section>

      <section aria-label={t("guests.reviews.title")}>
        <h3>{t("guests.reviews.title")}</h3>
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
                    {open
                      ? t("guests.reviews.close")
                      : t("guests.reviews.open")}
                  </button>
                  {row.roomId ? (
                    <button
                      type="button"
                      onClick={() => props.onSelectRoom?.(row.roomId!)}
                    >
                      {t("guests.selectRoom", { roomId: row.roomId })}
                    </button>
                  ) : null}
                  {open ? (
                    <div aria-live="polite">
                      <p>
                        {t("guests.reviewDetail", {
                          stay: row.stayLabel,
                          room: row.roomId ?? "guest.unknown.room",
                          stage: row.stage,
                        })}
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
          <EmptyList message={t("guests.reviews.empty")} />
        )}
      </section>

      <section aria-label={t("guests.reception.title")}>
        <h3>{t("guests.reception.title")}</h3>
        {props.reception.length ? (
          <ul>
            {props.reception.map((row) => (
              <li key={row.bookingId}>
                {t("guests.reception.row", {
                  bookingId: row.bookingId,
                  minutes: row.waitedMinutes,
                  status: row.waitingTooLong
                    ? "guests.reception.tooLong"
                    : "guests.reception.withinTolerance",
                })}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message={t("guests.reception.empty")} />
        )}
      </section>

      <section aria-label={t("guests.loyalty.title")}>
        <h3>{t("guests.loyalty.title")}</h3>
        {props.loyalty.length ? (
          <ul>
            {props.loyalty.map((row) => (
              <li key={row.guestId}>
                {t("guests.loyalty.row", {
                  guestId: row.guestId,
                  tier: row.tier,
                  points: row.points,
                  nights: row.qualifyingNights,
                  liability: row.liability,
                })}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message={t("guests.loyalty.empty")} />
        )}
      </section>

      <section aria-label={t("guests.repeat.title")}>
        <h3>{t("guests.repeat.title")}</h3>
        {props.repeatGuests.length ? (
          <ul>
            {props.repeatGuests.map((row) => (
              <li key={row.guestId}>
                {t("guests.repeat.row", {
                  guestId: row.guestId,
                  visits: row.visits,
                  consent: row.consent,
                  preferences: row.preferences.length
                    ? row.preferences.join(", ")
                    : "guests.repeat.noPreferences",
                })}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message={t("guests.repeat.empty")} />
        )}
      </section>

      <section aria-label={t("guests.reputation.title")}>
        <h3>{t("guests.reputation.title")}</h3>
        {props.reputation.length ? (
          <ul>
            {props.reputation.map((row) => (
              <li key={`${row.dimension}.${row.scopeId}`}>
                {t("guests.reputation.row", {
                  dimension: row.dimension,
                  scope: row.scopeId,
                  score: row.score,
                  effect: row.effect,
                  latest: row.topCause
                    ? t("guests.reputation.latest", { cause: row.topCause })
                    : "",
                })}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList message={t("guests.reputation.empty")} />
        )}
      </section>
    </section>
  );
}
