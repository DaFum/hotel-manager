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

  render(<FnbDashboard fnb={fnb} locale="de-DE" />);

  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  const breakfast = screen.getByRole("listitem", { name: "Frühstücksraum" });
  expect(within(breakfast).getByText(/Sitzplätze: 36/)).toBeTruthy();
  expect(within(breakfast).getByText(/Bewirtungen: 10\/20/)).toBeTruthy();
  expect(within(breakfast).getByText(/Warteliste: 10/)).toBeTruthy();
  expect(within(breakfast).getByText(/Serviceauslastung: 50\.0%/)).toBeTruthy();
  expect(within(breakfast).getByText(/Küchenauslastung: 100\.0%/)).toBeTruthy();
  expect(within(breakfast).getByText(/Wartezeit: 30 Minuten/)).toBeTruthy();
  expect(within(breakfast).getByText(/Abfall: 2 Bewirtungen/)).toBeTruthy();
  expect(within(breakfast).getByText(/Wareneinsatz: 45,00 DM/)).toBeTruthy();
  expect(within(breakfast).getByText(/Begrenzt durch: Bestand/)).toBeTruthy();

  for (const label of ["Bar", "Zimmerservice", "Restaurant"])
    expect(screen.getByRole("listitem", { name: label })).toBeTruthy();
});
