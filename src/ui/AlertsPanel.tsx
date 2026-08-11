import { translateGame, type GameLocale } from "../i18n";

export interface Alert {
  id: string;
  severity: string;
  title: string;
  cause: string;
  causeValues?: Record<string, string | number>;
}

function alertText(
  locale: GameLocale,
  key: string,
  values?: Record<string, string | number>,
): string {
  return translateGame(locale, key, values);
}

export function AlertsPanel(props: {
  alerts: readonly Alert[];
  onOpen: (id: string) => void;
  openAlertId?: string | null;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  return (
    <section aria-label="Alerts">
      <h2>Alerts</h2>
      {/* The severity drives each record's rail; the word beside it says the
          same thing, so the meaning never rests on colour alone. */}
      {props.alerts.map((a) => (
        <article key={a.id} data-severity={a.severity}>
          <strong>{alertText(locale, a.title, a.causeValues)}</strong>
          <span>{a.severity}</span>
          <p>{alertText(locale, a.cause, a.causeValues)}</p>
          <button
            type="button"
            onClick={() => props.onOpen(a.id)}
            aria-expanded={props.openAlertId === a.id}
            aria-label={translateGame(locale, "notifications.open", {
              title: alertText(locale, a.title, a.causeValues),
            })}
          >
            {translateGame(locale, "notifications.openAction")}
          </button>
          {props.openAlertId === a.id ? (
            <p aria-live="polite">
              {a.id} · {a.severity} ·{" "}
              {alertText(locale, a.cause, a.causeValues)}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
