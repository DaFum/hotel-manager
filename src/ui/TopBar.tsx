import { formatMinorCurrency, formatGameDate } from "../i18n/formatters";
import { formatDm } from "./money";
import { translateGame, type GameLocale } from "../i18n";

export type Speed = 0 | 1 | 2 | 4 | 16;

export const SPEEDS: Speed[] = [0, 1, 2, 4, 16];

export function TopBar(props: {
  city: string;
  dateKey: string;
  minuteOfDay: number;
  cashMinor: number;
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
    </section>
  );
}
