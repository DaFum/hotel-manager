interface InboxEvent {
  id: string;
  title: string;
  body: string;
  choices: readonly { id: string; label: string }[];
}
export function StoryInbox({
  events,
  onChoose,
}: {
  events: readonly InboxEvent[];
  onChoose?: (eventId: string, choiceId: string) => void;
}) {
  return (
    <section aria-label="Story inbox">
      <h2>Story inbox</h2>
      {events.length === 0 ? (
        <p>The telex is quiet.</p>
      ) : (
        events.map((event) => (
          <article key={event.id}>
            <h3>{event.title}</h3>
            <p>{event.body}</p>
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose?.(event.id, choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </article>
        ))
      )}
    </section>
  );
}
