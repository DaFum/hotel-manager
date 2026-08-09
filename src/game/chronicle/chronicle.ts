import { compareIds } from "../domain/ids";

/**
 * The company's remembered history. Entries are facts that already happened,
 * so an entry is written once and never rewritten: the chronicle is what the
 * player can point at years later to explain how the company got here.
 */
export interface ChronicleEntry {
  id: string;
  date: string;
  scope: "company" | "world";
  textKey: string;
  entityIds?: string[];
}

/**
 * Appends one entry, ignoring a repeat of an id that is already recorded.
 *
 * Ordering is by ISO date and then by id, both compared as plain strings.
 * `localeCompare` would sort the same history differently on two ICU builds,
 * which is exactly the kind of order-dependence a replay cannot survive.
 */
export function appendChronicleEntry(
  entries: readonly ChronicleEntry[],
  entry: ChronicleEntry,
): ChronicleEntry[] {
  if (!entry.id) throw new Error("a chronicle entry needs an id");
  if (!entry.date) throw new Error("a chronicle entry needs a date");
  if (!entry.textKey) throw new Error("a chronicle entry needs a text key");
  if (entries.some((e) => e.id === entry.id)) return [...entries];
  return [...entries, entry].sort(
    (a, b) => compareIds(a.date, b.date) || compareIds(a.id, b.id),
  );
}
