import { translate, translateKey } from "../localization";

export interface ChronicleViewEntry {
  id: string;
  date: string;
  /** A key the worker recorded, or a resolved string in a test. */
  text: string;
  scope?: "company" | "world";
}

/**
 * The company's history, oldest first. Ordering repeats the worker's rule —
 * date, then id, both compared as plain strings — so what the player reads is
 * in the same order on every machine.
 */
export function ChronicleView({
  entries,
}: {
  entries: readonly ChronicleViewEntry[];
}) {
  const sorted = [...entries].sort(
    (a, b) => compare(a.date, b.date) || compare(a.id, b.id),
  );
  return (
    <section aria-label={translate("chronicle.title")}>
      <h2>{translate("chronicle.title")}</h2>
      {sorted.length === 0 ? (
        <p>{translate("chronicle.empty")}</p>
      ) : (
        sorted.map((entry) => (
          <article key={entry.id}>
            <time dateTime={entry.date}>{entry.date}</time>
            <p>{translateKey(entry.text)}</p>
          </article>
        ))
      )}
    </section>
  );
}

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
