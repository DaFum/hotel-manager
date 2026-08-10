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
      <p className="hm-topbar__place">
        {props.city}{" "}
        <time dateTime={props.dateKey}>
          {formatGameDate(props.dateKey, locale)}
          <span className="sr-only"> ({props.dateKey})</span>
        </time>{" "}
        <span className="hm-topbar__clock">
          {hours}:{minutes}
        </span>
      </p>
      {/* The one figure the player's eye returns to, held in a fixed column so
          it never moves as the simulation ticks. */}
      <p className="hm-topbar__cash">
        <span>{translateGame(locale, "topbar.cash")}: </span>
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
      {/* The operational read the player should never have to go looking for.
          Each figure names itself, so none of them depends on its colour. */}
      <dl className="hm-topbar__vitals">
        {props.monthProfitMinor === undefined ? null : (
          <div>
            <dt>{translateGame(locale, "topbar.monthProfit")}</dt>
            <dd data-trend={trend(props.monthProfitMinor)}>
              {formatDm(props.monthProfitMinor, locale)}
            </dd>
          </div>
        )}
        {props.occupancyBasisPoints === undefined ? null : (
          <div>
            <dt>{translateGame(locale, "topbar.occupancy")}</dt>
            <dd>{formatBasisPoints(props.occupancyBasisPoints, locale)}</dd>
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
          {translateGame(locale, "topbar.save" as any) || "Save"}
        </button>
        <button type="button" onClick={props.onLoad}>
          {translateGame(locale, "topbar.load" as any) || "Load"}
        </button>
      </div>
    </section>
  );
}
