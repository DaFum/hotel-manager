import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FacilitiesDashboard } from "./FacilitiesDashboard";

const rows = [
  {
    id: "kitchen",
    name: "Kitchen",
    demand: 90,
    capacity: 60,
    cause: "staffed throughput",
  },
  {
    id: "bar",
    name: "Bar",
    demand: 10,
    capacity: 60,
    cause: "seating",
  },
];

it("shows bottleneck causes", () => {
  render(<FacilitiesDashboard rows={rows.slice(0, 1)} />);
  expect(screen.getByText(/staffed throughput/)).toBeTruthy();
});

it("marks an over-subscribed facility without relying on colour alone", () => {
  render(<FacilitiesDashboard rows={rows} />);
  const kitchen = screen.getByRole("listitem", { name: /Kitchen/ });
  expect(kitchen.textContent).toMatch(/over capacity/i);
  const bar = screen.getByRole("listitem", { name: /Bar/ });
  expect(bar.textContent).not.toMatch(/over capacity/i);
});

it("reports utilisation so the player can compare facilities", () => {
  render(<FacilitiesDashboard rows={rows} />);
  expect(screen.getByText(/150\.0%/)).toBeTruthy();
});

it("says so plainly when nothing is running yet", () => {
  render(<FacilitiesDashboard rows={[]} />);
  expect(screen.getByText(/no facilities/i)).toBeTruthy();
});
