import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextHelp } from "./ContextHelp";
describe("ContextHelp", () => {
  it("renders causal drivers rather than generic advice", () => {
    render(
      <ContextHelp
        title="Occupancy"
        drivers={["Business demand -12%", "New supply +240 rooms"]}
      />,
    );
    expect(screen.getByText("Business demand -12%")).toBeTruthy();
    expect(
      screen.getByRole("complementary", { name: "Occupancy help" }),
    ).toBeTruthy();
  });
});
