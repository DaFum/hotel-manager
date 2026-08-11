import { expect, it } from "vitest";
import {
  findPath,
  navigationWithClosures,
  type NavigationNode,
} from "./navigationGraph";
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

it("skips dangling links without throwing", () => {
  const graph: NavigationNode[] = [
    { id: "start", kind: "corridor", links: ["missing", "finish"] },
    { id: "finish", kind: "corridor", links: [] },
  ];
  expect(findPath(graph, "start", "finish")).toEqual(["start", "finish"]);
});

it("applies authoritative closure ids to the same stable topology", () => {
  const nodes: NavigationNode[] = [
    { id: "corridor.1", kind: "corridor", links: ["stairs.1"] },
    { id: "stairs.1", kind: "stairs", links: ["corridor.1"] },
  ];
  const rendered = navigationWithClosures(nodes, ["corridor.1"]);
  expect(rendered).toEqual([
    { ...nodes[0], closed: true },
    { ...nodes[1], closed: false },
  ]);
  expect(findPath(rendered, "stairs.1", "corridor.1")).toEqual([]);
});
