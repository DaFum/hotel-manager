export type NavigationKind =
  "door" | "corridor" | "stairs" | "elevator" | "room";
export interface NavigationNode {
  id: string;
  kind: NavigationKind;
  links: readonly string[];
  closed?: boolean;
}
export function findPath(
  nodes: readonly NavigationNode[],
  from: string,
  to: string,
): string[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (!byId.has(from) || !byId.has(to)) return [];
  const queue = [from];
  const previous = new Map<string, string | null>([[from, null]]);
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) break;
    const node = byId.get(id)!;
    if (node.closed && id !== from) continue;
    for (const next of [...node.links].sort()) {
      const nextNode = byId.get(next);
      if (!nextNode || previous.has(next) || nextNode.closed) continue;
      previous.set(next, id);
      queue.push(next);
    }
  }
  if (!previous.has(to)) return [];
  const path: string[] = [];
  for (let at: string | null = to; at; at = previous.get(at) ?? null)
    path.push(at);
  return path.reverse();
}
