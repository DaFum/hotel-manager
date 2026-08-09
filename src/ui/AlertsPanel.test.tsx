import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlertsPanel } from "./AlertsPanel";
import { explainCause } from "../game/explanations/causeExplanations";

describe("alerts", () => {
  it("shows severity cause and navigation action", () => {
    render(
      <AlertsPanel
        alerts={[
          {
            id: "a1",
            severity: "warning",
            title: "Housekeeping backlog",
            cause: "6 rooms waiting for cleaning",
          },
        ]}
        onOpen={() => {}}
      />,
    );
    expect(
      screen.getByText("An operational issue needs attention."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /open housekeeping backlog/i }),
    ).toBeTruthy();
    expect(screen.getByText("warning")).toBeTruthy();
  });

  it("opens the alert it was asked to open", () => {
    const onOpen = vi.fn();
    render(
      <AlertsPanel
        alerts={[
          {
            id: "a1",
            severity: "warning",
            title: "Housekeeping backlog",
            cause: "6 rooms waiting for cleaning",
          },
        ]}
        onOpen={onOpen}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /open housekeeping backlog/i }),
    );
    expect(onOpen).toHaveBeenCalledWith("a1");
  });
});

describe("cause explanations", () => {
  it("turns a metric change into a readable chain of causes", () => {
    expect(
      explainCause("occupancyDown", [
        { factor: "rate above segment willingness", weight: 60 },
        { factor: "no walk-in inventory", weight: 40 },
      ]),
    ).toBe(
      "Occupancy fell because rate above segment willingness (60%) and no walk-in inventory (40%).",
    );
  });

  it("falls back to an honest message when no driver is known", () => {
    expect(explainCause("occupancyDown", [])).toBe(
      "Occupancy fell for no single dominant reason.",
    );
  });
});
