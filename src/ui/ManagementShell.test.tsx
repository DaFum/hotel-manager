import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  it("exports the immutable management navigation order", () => {
    expect(AREA_ORDER).toEqual([
      "mainView",
      "hotel",
      "guests",
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
    expect(screen.queryByTestId("mainView-content")).toBeNull();
  });

  it("mounts only the selected area's assigned content", () => {
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
      "Guests",
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
      expect(tabs[index]?.getAttribute("aria-controls")).toBe(
        `management-${id}`,
      );
    }

    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(screen.getByTestId("mainView-content")).toBeTruthy();
    for (const id of AREA_ORDER.slice(1))
      expect(screen.queryByTestId(`${id}-content`)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Campaign" }));
    const panel = screen.getByRole("tabpanel", { name: "Campaign" });
    expect(panel.getAttribute("id")).toBe("management-campaign");
    expect(panel.contains(screen.getByTestId("campaign-content"))).toBe(true);
    expect(panel.querySelector("h2")).toBeNull();
    expect(screen.queryByTestId("mainView-content")).toBeNull();
  });

  it("does not render inactive area components on publication rerenders", () => {
    const mainViewRender = vi.fn();
    const hotelRender = vi.fn();
    function Marker({ onRender }: { onRender: () => void }) {
      onRender();
      return <p>content</p>;
    }
    const createAreas = (): readonly ManagementArea[] =>
      AREA_ORDER.map((id) => ({
        id,
        content:
          id === "mainView" ? (
            <Marker onRender={mainViewRender} />
          ) : id === "hotel" ? (
            <Marker onRender={hotelRender} />
          ) : (
            <p>{id}</p>
          ),
      }));
    const { rerender } = render(
      <ManagementShell
        adoption={adoption}
        areas={createAreas()}
        title="Management"
      />,
    );

    expect(mainViewRender).toHaveBeenCalledTimes(1);
    expect(hotelRender).not.toHaveBeenCalled();
    rerender(
      <ManagementShell
        adoption={adoption}
        areas={createAreas()}
        title="Management"
      />,
    );
    expect(mainViewRender).toHaveBeenCalledTimes(2);
    expect(hotelRender).not.toHaveBeenCalled();
  });
});
