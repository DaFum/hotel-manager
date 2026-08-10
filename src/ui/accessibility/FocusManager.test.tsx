import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FocusManager } from "./FocusManager";
describe("FocusManager", () => {
  it("supports wrapping arrows and Home/End", () => {
    render(<FocusManager labels={["Hotel", "Staff", "Finance"]} />);
    const hotel = screen.getByRole("tab", { name: "Hotel" });
    hotel.focus();
    fireEvent.keyDown(hotel, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "Finance" }),
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "Finance" }), {
      key: "Home",
    });
    expect(document.activeElement).toBe(hotel);
    fireEvent.keyDown(hotel, { key: "End" });
    const finance = screen.getByRole("tab", { name: "Finance" });
    expect(document.activeElement).toBe(finance);
    fireEvent.keyDown(finance, { key: "ArrowRight" });
    expect(document.activeElement).toBe(hotel);
  });
});
