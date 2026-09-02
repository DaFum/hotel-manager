import { translateGame, type GameLocale } from "../../i18n";

interface InboxEvent {
  id: string;
  titleKey: string;
  bodyKey: string;
  raisedDateKey: string;
  choices: readonly { id: string; labelKey: string }[];
}

export function StoryInbox({
  events,
  onChoose,
  locale = "de-DE",
}: {
  events: readonly InboxEvent[];
  onChoose?: (eventId: string, choiceId: string) => void;
  locale?: GameLocale;
}) {
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  return (
    <section aria-label={t("story.inbox.title")}>
      <h2>{t("story.inbox.title")}</h2>
      {events.length === 0 ? (
        <p>{t("story.inbox.empty")}</p>
      ) : (
        events.map((event) => (
          <article key={event.id}>
            <h3>{t(event.titleKey)}</h3>
            <p>{t(event.bodyKey)}</p>
            <p>
              {t("story.raised")}{" "}
              <time dateTime={event.raisedDateKey}>{event.raisedDateKey}</time>
            </p>
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose?.(event.id, choice.id)}
              >
                {t(choice.labelKey)}
              </button>
            ))}
          </article>
        ))
      )}
    </section>
  );
}
