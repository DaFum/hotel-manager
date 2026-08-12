export type HotelId = string;
export type CityId = string;

/** Locale-independent ascending order for authoritative stable IDs. */
export function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Record keys in the one deterministic order authoritative loops may use. */
export function orderedKeys<T>(record: Readonly<Record<string, T>>): string[] {
  return Object.keys(record).sort(compareIds);
}
