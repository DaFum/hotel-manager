import { compareIds } from "../domain/ids";
import type { NarrativeDefinition } from "./eventTypes";

/**
 * Which stories the world currently permits. An event fires because the
 * simulation reached a state that satisfies its declared conditions, never
 * because a script decided it was time.
 */
export function eligibleEvents(
  definitions: readonly NarrativeDefinition[],
  facts: Readonly<Record<string, number>>,
  fired: Readonly<Record<string, string>> = {},
  dateKey = "9999-12-31",
): NarrativeDefinition[] {
  for (const [key, value] of Object.entries(facts))
    if (!Number.isSafeInteger(value))
      throw new Error(`invalid narrative fact ${key}`);
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
    .sort((a, b) => b.priority - a.priority || compareIds(a.id, b.id));
}

/**
 * Picks one of the eligible stories from a drawn number.
 *
 * Selection is deliberately uniform over what is eligible. `priority` is
 * ordering metadata — it decides which story a caller that wants one story
 * reads first, and it breaks ties before the id does — not a weight: a
 * high-priority story does not get proportionally more draws. If weighted
 * selection is ever wanted, it is a simulation-contract change, because every
 * recorded replay depends on which story this returns.
 *
 * The draw comes from a seeded stream, so the same world always tells the same
 * story; ids are compared without locale collation for the same reason.
 */
export function selectNarrativeEvent(
  eligible: readonly NarrativeDefinition[],
  draw: number,
): NarrativeDefinition | null {
  if (!Number.isSafeInteger(draw) || draw < 0)
    throw new Error("invalid narrative draw");
  if (eligible.length === 0) return null;
  return eligible[draw % eligible.length];
}

function monthsBetween(a: string, b: string): number {
  return (
    (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 +
    Number(b.slice(5, 7)) -
    Number(a.slice(5, 7))
  );
}
