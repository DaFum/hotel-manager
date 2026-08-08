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
}) {
  const hours = String(Math.floor(props.minuteOfDay / 60)).padStart(2, "0");
  const minutes = String(props.minuteOfDay % 60).padStart(2, "0");
  return (
    <header aria-label="Status bar">
      <p>
        {props.city} · {props.dateKey} {hours}:{minutes} ·{" "}
        {formatDm(props.cashMinor)}
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
    </header>
  );
}
