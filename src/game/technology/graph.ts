import { compareIds } from "../domain/ids";

export interface TechnologyDefinition {
  id: string;
  requires: readonly string[];
}

export function canEmerge(
  requires: readonly string[],
  available: ReadonlySet<string>,
): boolean {
  return requires.every((id) => available.has(id));
}

export function validateTechnologyGraph(
  definitions: readonly TechnologyDefinition[],
): void {
  const byId = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );
  if (byId.size !== definitions.length)
    throw new Error("duplicate technology id");
  for (const definition of definitions)
    for (const required of definition.requires)
      if (!byId.has(required))
        throw new Error(`missing prerequisite ${required}`);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id))
      throw new Error(`technology prerequisite cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const required of byId.get(id)?.requires ?? []) visit(required);
    visiting.delete(id);
    visited.add(id);
  };
  for (const definition of [...definitions].sort((a, b) =>
    compareIds(a.id, b.id),
  ))
    visit(definition.id);
}
