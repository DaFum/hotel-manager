import { compareIds } from "../domain/ids";

export const VISIBLE_AGENT_BUDGET = 300;

export interface MaterializedAgent {
  id: string;
  priority: number;
}

export function selectVisibleAgents<T extends MaterializedAgent>(
  parties: readonly T[],
  budget = VISIBLE_AGENT_BUDGET,
): { visible: T[]; totalParties: number } {
  if (!Number.isSafeInteger(budget) || budget < 0)
    throw new Error("visible-agent limit must be a non-negative integer");
  const visible = [...parties]
    .sort((a, b) => b.priority - a.priority || compareIds(a.id, b.id))
    .slice(0, budget);
  return { visible, totalParties: parties.length };
}
