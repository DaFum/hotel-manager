import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CityDashboard } from "./CityDashboard";

it("shows demand drivers and uncertainty", () => {
  render(
    <CityDashboard business={1200} leisure={800} low={1800} high={2300} />,
  );
  expect(screen.getByText(/Business 1200/)).toBeTruthy();
});

it("names every source the city sells room nights to", () => {
  render(
    <CityDashboard
      business={1200}
      leisure={800}
      event={500}
      group={300}
      low={2400}
      high={3000}
    />,
  );
  for (const source of [
    /Business 1200/,
    /Leisure 800/,
    /Event 500/,
    /Group 300/,
  ])
    expect(screen.getByText(source)).toBeTruthy();
  // The total is the sum the player can check by hand, not a separate number.
  expect(screen.getByLabelText("City room nights").textContent).toContain(
    "2800",
  );
});

it("states the forecast as a band and says how good the information is", () => {
  render(
    <CityDashboard
      business={1200}
      leisure={800}
      low={1800}
      high={2300}
      informationQuality={40}
    />,
  );
  const forecast = screen.getByLabelText("Room-night forecast");
  expect(forecast.textContent).toContain("1800");
  expect(forecast.textContent).toContain("2300");
  expect(forecast.textContent).toMatch(/40/);
});

it("explains connectivity in words rather than by colour alone", () => {
  render(
    <CityDashboard
      business={1200}
      leisure={800}
      low={1800}
      high={2300}
      connectivityIndex={73}
    />,
  );
  expect(screen.getByLabelText("Connectivity").textContent).toContain("73");
});
