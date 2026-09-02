import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("calls scrollIntoView with smooth behavior by default on click and keyboard movement", () => {
    render(<FocusManager labels={["Hotel", "Staff", "Finance"]} />);
    const staff = screen.getByRole("tab", { name: "Staff" });
    const scrollIntoViewSpy = vi.fn();
    staff.scrollIntoView = scrollIntoViewSpy;

    fireEvent.click(staff);
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    scrollIntoViewSpy.mockClear();
    const hotel = screen.getByRole("tab", { name: "Hotel" });
    hotel.scrollIntoView = scrollIntoViewSpy;
    hotel.focus();
    fireEvent.keyDown(hotel, { key: "ArrowRight" });

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  });

  it("calls scrollIntoView with auto behavior when prefers-reduced-motion matches", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      render(<FocusManager labels={["Hotel", "Staff", "Finance"]} />);
      const staff = screen.getByRole("tab", { name: "Staff" });
      const scrollIntoViewSpy = vi.fn();
      staff.scrollIntoView = scrollIntoViewSpy;

      fireEvent.click(staff);
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("calls scrollIntoView with auto behavior when document has data-reduced-motion=true attribute", () => {
    document.documentElement.setAttribute("data-reduced-motion", "true");
    try {
      render(<FocusManager labels={["Hotel", "Staff", "Finance"]} />);
      const staff = screen.getByRole("tab", { name: "Staff" });
      const scrollIntoViewSpy = vi.fn();
      staff.scrollIntoView = scrollIntoViewSpy;

      fireEvent.click(staff);
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
    } finally {
      document.documentElement.removeAttribute("data-reduced-motion");
    }
  });
});
