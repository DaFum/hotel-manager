export interface ChronicleViewEntry {
  id: string;
  date: string;
  text: string;
  scope?: "company" | "world";
}
export function ChronicleView({
  entries,
}: {
  entries: readonly ChronicleViewEntry[];
}) {
  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  return (
    <section aria-label="Company chronicle">
      <h2>Company chronicle</h2>
      {sorted.length === 0 ? (
        <p>No milestones recorded yet.</p>
      ) : (
        sorted.map((entry) => (
          <article key={entry.id}>
            <time dateTime={entry.date}>{entry.date}</time>
            <p>{entry.text}</p>
          </article>
        ))
      )}
    </section>
  );
}
