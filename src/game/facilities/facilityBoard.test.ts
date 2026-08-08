import { expect, it } from "vitest";
import { facilityRow } from "./facilityBoard";

it("reports the constraint that is actually binding", () => {
  const row = facilityRow({
    id: "facility.kitchen",
    name: "Kitchen",
    demand: 90,
    constraints: [
      { label: "seating", value: 120 },
      { label: "staffed throughput", value: 60 },
      { label: "stock", value: 80 },
    ],
  });
  expect(row).toEqual({
    id: "facility.kitchen",
    name: "Kitchen",
    demand: 90,
    capacity: 60,
    cause: "staffed throughput",
  });
});

it("breaks ties on declaration order so the cause is deterministic", () => {
  expect(
    facilityRow({
      id: "f",
      name: "F",
      demand: 1,
      constraints: [
        { label: "space", value: 10 },
        { label: "staffed throughput", value: 10 },
      ],
    }).cause,
  ).toBe("space");
});

it("reports a closed facility rather than an empty one", () => {
  expect(
    facilityRow({ id: "f", name: "F", demand: 0, constraints: [] }),
  ).toEqual({ id: "f", name: "F", demand: 0, capacity: 0, cause: "closed" });
});
