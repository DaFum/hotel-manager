/** Locale-independent ascending order for authoritative stable IDs. */
export function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
