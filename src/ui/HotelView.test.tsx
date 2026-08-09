import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HotelView } from "./HotelView";

const rooms = [
  {
    id: "room.101",
    category: "single",
    state: "VacantClean",
    cleanliness: 100,
  },
  { id: "room.102", category: "double", state: "VacantDirty", cleanliness: 40 },
];

describe("hotel view", () => {
  it("offers an accessible room inspector alongside the canvas", () => {
    render(<HotelView rooms={rooms} />);
    expect(screen.getByRole("region", { name: /hotel view/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /room\.101 single vacant clean/i }),
    ).toBeTruthy();
  });

  it("lists every room so the view is usable without the canvas", () => {
    render(<HotelView rooms={rooms} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("offers a keyboard-reachable DOM equivalent for every scene action", () => {
    const onRoom = vi.fn();
    const onFacility = vi.fn();
    render(
      <HotelView
        rooms={rooms}
        facilities={[
          {
            id: "facility.breakfast",
            name: "Breakfast room",
            demand: 30,
            capacity: 20,
            cause: "staff",
          },
        ]}
        onSelect={onRoom}
        onSelectFacility={onFacility}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /room\.101 single vacant clean/i }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Breakfast room, 30 demand, 20 capacity, limited by staff/i,
      }),
    );
    expect(onRoom).toHaveBeenCalledWith("room.101");
    expect(onFacility).toHaveBeenCalledWith("facility.breakfast");
  });
});
