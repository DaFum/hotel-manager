import { formatMinorCurrency, formatGameDate } from "../i18n/formatters";
import { formatBasisPoints, formatDm } from "./money";
import { translateGame, type GameLocale } from "../i18n";

export type Speed = 0 | 1 | 2 | 4 | 16;

export const SPEEDS: Speed[] = [0, 1, 2, 4, 16];

function trend(amountMinor: number): "gain" | "loss" | "flat" {
  if (amountMinor > 0) return "gain";
  if (amountMinor < 0) return "loss";
  return "flat";
}

/**
 * The command bar: who you are, what time it is, what the house is worth, how
 * fast the clock runs, and the way into the desk drawers.
 *
 * It is the only chrome that is always on screen, so it carries the house's
 * name — the page's one `<h1>` — instead of leaving a full-bleed banner above
 * it pushing the hotel off the first screen.
 */
export function TopBar(props: {
  /** The house's own name; rendered as the document's heading. */
  hotelName: string;
  city: string;
  dateKey: string;
  minuteOfDay: number;
  cashMinor: number;
  /** The month's profit so far; the sign is the point, so it is shown. */
  monthProfitMinor?: number;
  occupancyBasisPoints?: number;
  /** The house's standing with its guests, 0-100. */
  reputation?: number;
  /** How many things are asking for attention right now. */
  warningCount?: number;
  speed: Speed;
  onSpeed: (speed: Speed) => void;
  onSave: () => void;
  onLoad: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenSaves?: () => void;
  locale?: GameLocale;
}) {
  const hours = String(Math.floor(props.minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(props.minuteOfDay % 60).padStart(2, "0");
  const locale = props.locale ?? "de-DE";
  const waiting = props.warningCount ?? 0;
  return (
    <section
      className="hm-topbar"
      aria-label={translateGame(locale, "topbar.status")}
    >
      <div className="hm-topbar__card hm-topbar__card--location">
        <h1 className="hm-topbar__name">
          {props.hotelName}, {props.city} 1991
        </h1>
        <p className="hm-topbar__place">
          <time dateTime={props.dateKey}>
            {formatGameDate(props.dateKey, locale)}
            <span className="sr-only"> ({props.dateKey})</span>
          </time>
          <span className="hm-topbar__clock">
            {hours}:{minutes}
          </span>
        </p>
      </div>

      <div className="hm-topbar__card hm-topbar__card--cash">
        <p className="hm-topbar__cash">
          <span className="hm-topbar__label">
            {translateGame(locale, "topbar.cash")}
          </span>
          <span
            className="hm-topbar__figure"
            data-testid="cash-value"
            data-minor={props.cashMinor}
          >
            {locale === "de-DE"
              ? formatDm(props.cashMinor)
              : formatMinorCurrency(props.cashMinor, "DEM", locale)}
          </span>
        </p>
      </div>

      <div className="hm-topbar__card hm-topbar__card--vitals">
        <dl className="hm-topbar__vitals">
          {props.monthProfitMinor === undefined ? null : (
            <div>
              <dt>{translateGame(locale, "topbar.monthProfit")}</dt>
              <dd data-trend={trend(props.monthProfitMinor)}>
                {formatDm(props.monthProfitMinor)}
              </dd>
            </div>
          )}
          {props.occupancyBasisPoints === undefined ? null : (
            <div>
              <dt>{translateGame(locale, "topbar.occupancy")}</dt>
              <dd>{formatBasisPoints(props.occupancyBasisPoints)}</dd>
            </div>
          )}
          {props.reputation === undefined ? null : (
            <div>
              <dt>{translateGame(locale, "topbar.reputation")}</dt>
              <dd>{Math.round(props.reputation)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="hm-topbar__card hm-topbar__card--controls">
        <nav
          className="hm-topbar__speed"
          aria-label={translateGame(locale, "topbar.speed")}
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={props.speed === s}
              onClick={() => props.onSpeed(s)}
            >
              {s === 0 ? translateGame(locale, "topbar.pause") : `${s}x`}
            </button>
          ))}
        </nav>
        <div className="hm-topbar__io">
          <button type="button" onClick={props.onSave}>
            {translateGame(locale, "topbar.save")}
          </button>
          <button type="button" onClick={props.onLoad}>
            {translateGame(locale, "topbar.load")}
          </button>
        </div>
      </div>

      {/*
        The drawer handles. The message count rides on its own button rather
        than as a fourth figure in the vitals list, because it is the only one
        of them the player is meant to act on.
      */}
      <nav
        className="hm-topbar__card hm-topbar__card--tools"
        aria-label={translateGame(locale, "topbar.tools")}
      >
        <button
          type="button"
          className="hm-topbar__tool"
          data-attention={waiting > 0}
          onClick={props.onOpenNotifications}
        >
          <span aria-hidden="true">✉</span>
          <span>
            {waiting > 0
              ? translateGame(locale, "topbar.openNotificationsCount", {
                  count: waiting,
                })
              : translateGame(locale, "topbar.openNotifications")}
          </span>
        </button>
        <button
          type="button"
          className="hm-topbar__tool"
          onClick={props.onOpenSaves}
        >
          <span aria-hidden="true">▤</span>
          <span>{translateGame(locale, "topbar.openSaves")}</span>
        </button>
        <button
          type="button"
          className="hm-topbar__tool"
          onClick={props.onOpenSettings}
        >
          <span aria-hidden="true">⚙</span>
          <span>{translateGame(locale, "topbar.openSettings")}</span>
        </button>
      </nav>
    </section>
  );
}
