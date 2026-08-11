import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { createFnbState } from "../../game/fnb/fnbState";
import { FnbDashboard } from "./FnbDashboard";

it("shows every outlet's real load, wait, waste, cost, and binding cause", () => {
  const fnb = createFnbState();
  fnb.outlets[0] = {
    ...fnb.outlets[0],
    demand: 20,
    capacity: 10,
    served: 10,
    waitlisted: 10,
    serviceThroughput: 40,
    kitchenThroughput: 20,
    stockLeft: 5,
    wastedCovers: 2,
    ingredientExpenseMinor: 4_500,
    averageWaitMinutes: 30,
    cause: "facility.cause.stock",
  };

  render(<FnbDashboard fnb={fnb} />);

  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  const breakfast = screen.getByRole("listitem", { name: "Breakfast room" });
  expect(within(breakfast).getByText(/Seats: 36/)).toBeTruthy();
  expect(within(breakfast).getByText(/Covers: 10\/20/)).toBeTruthy();
  expect(within(breakfast).getByText(/Waitlisted: 10/)).toBeTruthy();
  expect(within(breakfast).getByText(/Service load: 50\.0%/)).toBeTruthy();
  expect(within(breakfast).getByText(/Kitchen load: 100\.0%/)).toBeTruthy();
  expect(within(breakfast).getByText(/Average wait: 30 minutes/)).toBeTruthy();
  expect(within(breakfast).getByText(/Waste: 2 covers/)).toBeTruthy();
  expect(within(breakfast).getByText(/Food cost: 45,00 DM/)).toBeTruthy();
  expect(within(breakfast).getByText(/Limited by: stock/)).toBeTruthy();

  for (const label of ["Bar", "Room service", "Restaurant"])
    expect(screen.getByRole("listitem", { name: label })).toBeTruthy();
});
