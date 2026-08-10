import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManagementShell } from "./ManagementShell";

describe("ManagementShell", () => {
  it("keeps management selection and displayed section synchronized", () => {
    render(
      <ManagementShell
        adoption={{
          personalComputerBp: 0,
          internetBp: 0,
          smartphoneBp: 0,
          channelManagerBp: 0,
        }}
      >
        <p>Hotel controls</p>
      </ManagementShell>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Finance" }));
    expect(
      screen
        .getByRole("tab", { name: "Finance" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Finance" })).toBeTruthy();
    expect(
      screen
        .getByText("Hotel controls")
        .closest('[role="tabpanel"]')
        ?.hasAttribute("hidden"),
    ).toBe(true);
  });
});
