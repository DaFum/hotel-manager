import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AREA_ORDER,
  ManagementShell,
  type ManagementArea,
} from "./ManagementShell";

const adoption = {
  personalComputerBp: 0,
  internetBp: 0,
  smartphoneBp: 0,
  channelManagerBp: 0,
};

function areas(): readonly ManagementArea[] {
  return AREA_ORDER.map((id) => ({
    id,
    content: <p data-testid={`${id}-content`}>{id} content</p>,
  }));
}

describe("ManagementShell", () => {
  it("exports the immutable nine-area navigation order", () => {
    expect(AREA_ORDER).toEqual([
      "mainView",
      "hotel",
      "staff",
      "finance",
      "revenue",
      "marketing",
      "market",
      "company",
      "campaign",
    ]);
    expect(Object.isFrozen(AREA_ORDER)).toBe(true);
  });

  it("keeps management selection and displayed section synchronized", () => {
    render(
      <ManagementShell
        adoption={adoption}
        areas={areas()}
        title="Management"
      />,
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
        .getByTestId("mainView-content")
        .closest('[role="tabpanel"]')
        ?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("mounts assigned content for every area in the fixed order", () => {
    const { container } = render(
      <ManagementShell
        adoption={adoption}
        areas={areas()}
        title="Management"
      />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Main view",
      "Hotel",
      "Staff",
      "Finance",
      "Revenue",
      "Marketing & sales",
      "Market",
      "Company",
      "Campaign",
    ]);
    expect(
      screen.getByRole("main", { name: "Management" }).getAttribute("id"),
    ).toBe("management-content");
    expect(
      screen.getByRole("link", { name: /skip/i }).getAttribute("href"),
    ).toBe("#management-content");

    for (const [index, id] of AREA_ORDER.entries()) {
      const panel = container.querySelector(`#management-${id}`);
      expect(panel).not.toBeNull();
      expect(panel?.contains(screen.getByTestId(`${id}-content`))).toBe(true);
      expect(panel?.querySelector("h2")).toBeNull();
      expect(tabs[index]?.getAttribute("aria-controls")).toBe(
        `management-${id}`,
      );
      expect(panel?.getAttribute("aria-label")).toBe(tabs[index]?.textContent);
    }
  });
});
