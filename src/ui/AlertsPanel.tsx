export interface Alert {
  id: string;
  severity: string;
  title: string;
  cause: string;
}

const ALERT_CAUSES: Readonly<Record<string, string>> = {
  "alert.recovery.noFrontDesk": "Nobody is on the desk to authorise it.",
  "alert.recovery.insufficientCash": "The hotel cannot cover the discount.",
};

function causeText(cause: string): string {
  return ALERT_CAUSES[cause] ?? cause;
}

export function AlertsPanel(props: {
  alerts: readonly Alert[];
  onOpen: (id: string) => void;
  openAlertId?: string | null;
}) {
  return (
    <section aria-label="Alerts">
      <h2>Alerts</h2>
      {props.alerts.map((a) => (
        <article key={a.id}>
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
