import { translate, translateKey } from "../localization";

/**
 * What is waiting for a decision. Titles, bodies and choice labels arrive as
 * keys from the worker and are resolved here: the simulation never holds a
 * sentence in a language.
 */
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
}: {
  events: readonly InboxEvent[];
  onChoose?: (eventId: string, choiceId: string) => void;
}) {
  return (
    <section aria-label={translate("story.inbox")}>
      <h2>{translate("story.inbox")}</h2>
      {events.length === 0 ? (
        <p>{translate("story.inbox.empty")}</p>
      ) : (
        events.map((event) => (
          <article key={event.id}>
            <h3>{translateKey(event.titleKey)}</h3>
            <p>{translateKey(event.bodyKey)}</p>
            <p>
              {translate("story.raised")}{" "}
              <time dateTime={event.raisedDateKey}>{event.raisedDateKey}</time>
            </p>
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose?.(event.id, choice.id)}
              >
                {translateKey(choice.labelKey)}
              </button>
            ))}
          </article>
        ))
      )}
    </section>
  );
}
