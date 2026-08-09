import type { NarrativeDefinition } from "./eventTypes";

export function eligibleEvents(
  definitions: readonly NarrativeDefinition[],
  facts: Readonly<Record<string, number>>,
  fired: Readonly<Record<string, string>> = {},
  dateKey = "9999-12-31",
): NarrativeDefinition[] {
  return definitions
    .filter((definition) => {
      if (
        !definition.conditions.every((condition) => {
          const value = facts[condition.key] ?? 0;
          return (
            (condition.min === undefined || value >= condition.min) &&
            (condition.max === undefined || value <= condition.max)
          );
        })
      )
        return false;
      const last = fired[definition.id];
      return !last || monthsBetween(last, dateKey) >= definition.cooldownMonths;
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

export function selectNarrativeEvent(
  eligible: readonly NarrativeDefinition[],
  draw: number,
): NarrativeDefinition | null {
  if (eligible.length === 0) return null;
  return eligible[Math.abs(Math.trunc(draw)) % eligible.length];
}
function monthsBetween(a: string, b: string): number {
  return (
    (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 +
    Number(b.slice(5, 7)) -
    Number(a.slice(5, 7))
  );
}
