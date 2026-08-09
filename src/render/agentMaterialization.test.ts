import { expect, it } from "vitest";
import { elevatorVisual, materializeAgents } from "./agentMaterialization";
it("visualises lift capacity, queue and failure from worker state", () => {
  expect(
    elevatorVisual({
      id: "lift.1",
      capacity: 4,
      queue: 9,
      travelMinutes: 2,
      failed: false,
    }),
  ).toMatchObject({ cause: "queue exceeds car capacity", waitMinutes: 6 });
  expect(
    elevatorVisual({
      id: "lift.1",
      capacity: 4,
      queue: 1,
      travelMinutes: 2,
      failed: true,
    }),
  ).toMatchObject({ cause: "out of service", waitMinutes: 60 });
});
it("materialises a bounded deterministic subset of agents", () => {
  const agents = ["guest.3", "guest.1", "guest.2"].map((id) => ({
    id,
    kind: "guest" as const,
    locationId: "lobby",
  }));
  expect(materializeAgents(agents, 2).map((x) => x.id)).toEqual([
    "guest.1",
    "guest.2",
  ]);
  expect(agents.map((x) => x.id)).toEqual(["guest.3", "guest.1", "guest.2"]);
});
