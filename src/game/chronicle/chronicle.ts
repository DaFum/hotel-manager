export interface ChronicleEntry {
  id: string;
  date: string;
  scope: "company" | "world";
  textKey: string;
  entityIds?: string[];
}
export function appendChronicleEntry(
  entries: readonly ChronicleEntry[],
  entry: ChronicleEntry,
): ChronicleEntry[] {
  if (entries.some((e) => e.id === entry.id)) return [...entries];
  return [...entries, entry].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
