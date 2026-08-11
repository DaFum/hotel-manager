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
  it("localizes the room state in the accessible name", () => {
    render(
      <SemanticHotelTree
        rooms={[
          { id: "room.101", label: "Gartenzimmer", state: "VacantClean" },
        ]}
        onInspect={() => undefined}
        locale="de-DE"
      />,
    );
    expect(
      screen.getByRole("button", {
        name: /prüfen gartenzimmer frei und sauber/i,
      }),
    ).toBeTruthy();
  });

  it("reads the same guest, rate, condition, cleanliness and problem as the inspector", () => {
    render(
      <SemanticHotelTree
        rooms={[
          {
            id: "room.101",
            category: "single",
            state: "Occupied",
            cleanliness: 88,
            guestLabel: "Guest G-RETURNING-1",
            rateLabel: "120,00 DM",
            conditionKey: "room.condition.serviceable",
            problemKeys: ["room.problems.renovation.planning"],
            renovationPhase: "planning",
          },
        ]}
        onInspect={() => undefined}
      />,
    );

    const room = screen.getByRole("listitem");
    expect(room.textContent).toContain("Guest G-RETURNING-1");
    expect(room.textContent).toContain("120,00 DM");
    expect(room.textContent).toContain("serviceable");
    expect(room.textContent).toContain("cleanliness 88");
    expect(room.textContent).toContain("Planning phase");
  });
});
