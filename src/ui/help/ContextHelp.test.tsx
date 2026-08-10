import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextHelp } from "./ContextHelp";
describe("ContextHelp", () => {
  it("renders causal drivers rather than generic advice", () => {
    render(
      <ContextHelp
        title="Occupancy"
        drivers={[
          { key: "help.drivers.businessDemand", values: { value: -12 } },
          { key: "help.drivers.newSupply", values: { rooms: 240 } },
        ]}
      />,
    );
    expect(screen.getByText("Business demand -12%")).toBeTruthy();
    expect(
      screen.getByRole("complementary", { name: "Occupancy help" }),
    ).toBeTruthy();
  });
  it("localizes interpolated drivers in German", () => {
    render(
      <ContextHelp
        title="Auslastung"
        drivers={[
          { key: "help.drivers.businessDemand", values: { value: -12 } },
        ]}
        locale="de-DE"
      />,
    );
    expect(screen.getByText("Geschäftsnachfrage -12 %")).toBeTruthy();
  });
});
