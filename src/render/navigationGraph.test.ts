import { expect, it } from "vitest";
import { findPath, type NavigationNode } from "./navigationGraph";
it("routes through doors, corridors, stairs and lifts around closures", () => {
  const graph: NavigationNode[] = [
    { id: "room", kind: "room", links: ["door"] },
    { id: "door", kind: "door", links: ["room", "corridor"] },
    { id: "corridor", kind: "corridor", links: ["door", "stairs", "lift"] },
    { id: "stairs", kind: "stairs", links: ["corridor", "lobby"] },
    {
      id: "lift",
      kind: "elevator",
      links: ["corridor", "lobby"],
      closed: true,
    },
    { id: "lobby", kind: "corridor", links: ["stairs", "lift"] },
  ];
  expect(findPath(graph, "room", "lobby")).toEqual([
    "room",
    "door",
    "corridor",
    "stairs",
    "lobby",
  ]);
  graph[3] = { ...graph[3], closed: true };
  graph[4] = { ...graph[4], closed: false };
  expect(findPath(graph, "room", "lobby")).toContain("lift");
});
