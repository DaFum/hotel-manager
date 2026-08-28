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

export function TopBar(props: {
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
  locale?: GameLocale;
}) {
  const hours = String(Math.floor(props.minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(props.minuteOfDay % 60).padStart(2, "0");
  const locale = props.locale ?? "de-DE";
  return (
    <section
      className="hm-topbar"
      aria-label={translateGame(locale, "topbar.status")}
    >
      <div className="hm-topbar__card hm-topbar__card--location">
        <p className="hm-topbar__place">
          <span className="hm-topbar__city">{props.city}</span>
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
          <span className="hm-topbar__label">{translateGame(locale, "topbar.cash")}</span>
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
          {props.warningCount === undefined ? null : (
            <div>
              <dt>{translateGame(locale, "topbar.warnings")}</dt>
              <dd data-trend={props.warningCount > 0 ? "loss" : "flat"}>
                {props.warningCount}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="hm-topbar__card hm-topbar__card--controls">
        <nav className="hm-topbar__speed" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={props.speed === s}
              onClick={() => props.onSpeed(s)}
            >
              {s === 0 ? "Pause" : `${s}x`}
            </button>
          ))}
        </nav>
        <div className="hm-topbar__io">
          <button type="button" onClick={props.onSave}>
            Save
          </button>
          <button type="button" onClick={props.onLoad}>
            Load
          </button>
        </div>
      </div>
    </section>
  );
}
