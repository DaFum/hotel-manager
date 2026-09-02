import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { CompetitorTable } from "./CompetitorTable";

const RIVALS = [
  {
    id: "hotel.rival.hof",
    name: "Hotel Am Hof",
    strategy: "luxury" as const,
    rooms: 90,
    rateMinor: 24000,
    occupancyBp: 8200,
    status: "operate" as const,
  },
  {
    id: "hotel.rival.stern",
    name: "Pension Stern",
    strategy: "budget" as const,
    rooms: 30,
    rateMinor: 9000,
    occupancyBp: 4100,
    status: "restructure" as const,
  },
];

it("puts each rival's rate and occupancy beside the player's own", () => {
  render(
    <CompetitorTable
      rows={RIVALS}
      playerRateMinor={18000}
      playerOccupancyBp={6000}
      locale="en-GB"
    />,
  );
  const table = screen.getByRole("table", { name: /Competitors/ });
  const stern = within(table).getByRole("row", { name: /Pension Stern/ });
  expect(stern.textContent).toContain("DEM\u00a090.00");
  expect(stern.textContent).toContain("41.0%");
  expect(within(table).getByRole("row", { name: /This hotel/ })).toBeTruthy();
});

it("says in words how each rival sits against this hotel", () => {
  render(
    <CompetitorTable
      rows={RIVALS}
      playerRateMinor={18000}
      playerOccupancyBp={6000}
      locale="en-GB"
    />,
  );
  const table = screen.getByRole("table", { name: /Competitors/ });
  expect(
    within(table).getByRole("row", { name: /Hotel Am Hof/ }).textContent,
  ).toMatch(/above/i);
  expect(
    within(table).getByRole("row", { name: /Pension Stern/ }).textContent,
  ).toMatch(/below/i);
});

it("marks a rival in distress without relying on colour", () => {
  render(
    <CompetitorTable
      rows={RIVALS}
      playerRateMinor={18000}
      playerOccupancyBp={6000}
      locale="en-GB"
    />,
  );
  expect(
    within(screen.getByRole("row", { name: /Pension Stern/ })).getByText(
      /restructuring/i,
    ),
  ).toBeTruthy();
});

it("translates authoritative strategy keys for display", () => {
  render(
    <CompetitorTable
      rows={RIVALS}
      playerRateMinor={18000}
      playerOccupancyBp={6000}
      locale="en-GB"
    />,
  );
  expect(screen.getByText("Luxury house")).toBeTruthy();
  expect(screen.getByText("Budget operator")).toBeTruthy();
});

it("says so plainly when the player has the city to themselves", () => {
  render(
    <CompetitorTable
      rows={[]}
      playerRateMinor={18000}
      playerOccupancyBp={6000}
      locale="en-GB"
    />,
  );
  expect(screen.getByText(/no other hotels/i)).toBeTruthy();
});
