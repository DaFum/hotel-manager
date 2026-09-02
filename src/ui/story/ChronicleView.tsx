import { translateGame, type GameLocale } from "../../i18n";

export interface ChronicleViewEntry {
  id: string;
  date: string;
  /** A key the worker recorded, or a resolved string in a test. */
  text: string;
  scope?: "company" | "world";
}

export function ChronicleView({
  entries,
  locale = "de-DE",
}: {
  entries: readonly ChronicleViewEntry[];
  locale?: GameLocale;
}) {
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  const sorted = [...entries].sort(
    (a, b) => compare(a.date, b.date) || compare(a.id, b.id),
  );
  return (
    <section aria-label={t("chronicle.title")}>
      <h2>{t("chronicle.title")}</h2>
      {sorted.length === 0 ? (
        <p>{t("chronicle.empty")}</p>
      ) : (
        sorted.map((entry) => (
          <article key={entry.id}>
            <time dateTime={entry.date}>{entry.date}</time>
            <p>{t(entry.text)}</p>
          </article>
        ))
      )}
    </section>
  );
}

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
