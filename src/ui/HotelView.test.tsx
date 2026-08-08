import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
