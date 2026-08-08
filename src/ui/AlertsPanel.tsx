export interface Alert {
  id: string;
  severity: string;
  title: string;
  cause: string;
}

export function AlertsPanel(props: {
  alerts: readonly Alert[];
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-label="Alerts">
      <h2>Alerts</h2>
      {props.alerts.map((a) => (
        <article key={a.id}>
          <strong>{a.title}</strong>
          <span>{a.severity}</span>
          <p>{a.cause}</p>
          <button
            type="button"
            onClick={() => props.onOpen(a.id)}
            aria-label={`Open ${a.title}`}
          >
            Open
          </button>
        </article>
      ))}
    </section>
  );
}
