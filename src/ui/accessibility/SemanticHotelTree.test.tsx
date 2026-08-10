import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SemanticHotelTree } from "./SemanticHotelTree";
describe("SemanticHotelTree", () => {
  it("exposes state and the same stable entity id as the renderer", () => {
    const inspect = vi.fn();
    render(
      <SemanticHotelTree
        rooms={[{ id: "room.101", category: "single", state: "VacantDirty" }]}
        onInspect={inspect}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /room\.101 single vacant dirty/i }),
    );
    expect(inspect).toHaveBeenCalledWith("room.101");
  });
  it("includes state when a custom room label is supplied", () => {
    render(
      <SemanticHotelTree
        rooms={[{ id: "room.101", label: "Garden room", state: "VacantClean" }]}
        onInspect={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", { name: /inspect garden room vacant clean/i }),
    ).toBeTruthy();
  });
});
