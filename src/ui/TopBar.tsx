import { formatMinorCurrency, formatGameDate } from "../i18n/formatters";
import { formatDm } from "./money";

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
  locale?: "de-DE" | "en-GB";
}) {
  const hours = String(Math.floor(props.minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(props.minuteOfDay % 60).padStart(2, "0");
  const locale = props.locale ?? "de-DE";
  return (
    <section aria-label="Status bar">
      <p>
        {props.city} ·{" "}
        <time dateTime={props.dateKey}>
          {formatGameDate(props.dateKey, locale)}
          <span className="sr-only"> ({props.dateKey})</span>
        </time>{" "}
        {hours}:{minutes} ·{" "}
        <span>{locale === "de-DE" ? "Bargeld" : "Cash"}: </span>
        <span data-testid="cash-value" data-minor={props.cashMinor}>
          {locale === "de-DE"
            ? formatDm(props.cashMinor)
            : formatMinorCurrency(props.cashMinor, "DEM", locale)}
        </span>
      </p>
      <nav aria-label="Speed">
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
      <button type="button" onClick={props.onSave}>
        Save
      </button>
      <button type="button" onClick={props.onLoad}>
        Load
      </button>
    </section>
  );
}
