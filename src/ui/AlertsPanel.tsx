export interface Alert {
  id: string;
  severity: string;
  title: string;
  cause: string;
}

function causeText(cause: string): string {
  return translateAlertCause(cause);
}

export function AlertsPanel(props: {
  alerts: readonly Alert[];
  onOpen: (id: string) => void;
  openAlertId?: string | null;
}) {
  return (
    <section aria-label="Alerts">
      <h2>Alerts</h2>
      {/* The severity drives each record's rail; the word beside it says the
          same thing, so the meaning never rests on colour alone. */}
      {props.alerts.map((a) => (
        <article key={a.id} data-severity={a.severity}>
          <strong>{a.title}</strong>
          <span>{a.severity}</span>
          <p>{causeText(a.cause)}</p>
          <button
            type="button"
            onClick={() => props.onOpen(a.id)}
            aria-expanded={props.openAlertId === a.id}
            aria-label={`Open ${a.title}`}
          >
            Open
          </button>
          {props.openAlertId === a.id ? (
            <p aria-live="polite">
              {a.id} · {a.severity} · {causeText(a.cause)}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
import { translateAlertCause } from "./localization";
