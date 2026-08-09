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

export const CHRONICLE_SCOPES = ["company", "world"] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a value is an entry the chronicle can keep. Used both when one is
 * written and when a save is read back, so a malformed entry is dropped at the
 * boundary instead of being rendered as a blank line years later.
 */
export function isChronicleEntry(value: unknown): value is ChronicleEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<ChronicleEntry>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.textKey === "string" &&
    entry.textKey.length > 0 &&
    typeof entry.date === "string" &&
    ISO_DATE.test(entry.date) &&
    !Number.isNaN(Date.parse(entry.date)) &&
    (CHRONICLE_SCOPES as readonly string[]).includes(entry.scope as string) &&
    (entry.entityIds === undefined || Array.isArray(entry.entityIds))
  );
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
  if (!isChronicleEntry(entry))
    throw new Error("a chronicle entry must be datable and explainable");
  if (entries.some((e) => e.id === entry.id)) return [...entries];
  return [...entries, entry].sort(
    (a, b) => compareIds(a.date, b.date) || compareIds(a.id, b.id),
  );
}
