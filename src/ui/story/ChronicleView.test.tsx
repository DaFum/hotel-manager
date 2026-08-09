import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChronicleView } from "./ChronicleView";

describe("ChronicleView", () => {
  it("renders dated history", () => {
    render(
      <ChronicleView
        entries={[
          { id: "1", date: "1994-12-31", text: "First profitable year" },
        ]}
      />,
    );
    expect(screen.getByText("1994-12-31")).toBeTruthy();
    expect(screen.getByText("First profitable year")).toBeTruthy();
  });

  it("orders by date first and id second, whatever order it is handed", () => {
    const { container } = render(
      <ChronicleView
        entries={[
          { id: "b", date: "1997-04-05", text: "same day, second" },
          { id: "later", date: "2001-01-01", text: "last" },
          { id: "a", date: "1997-04-05", text: "same day, first" },
          { id: "earliest", date: "1991-01-01", text: "first" },
        ]}
      />,
    );
    expect(
      [...container.querySelectorAll("article p")].map((p) => p.textContent),
    ).toEqual(["first", "same day, first", "same day, second", "last"]);
  });

  it("resolves a stored text key rather than printing it", () => {
    render(
      <ChronicleView
        entries={[
          {
            id: "1",
            date: "1994-12-31",
            text: "chronicle.milestone.first-profitable-year",
          },
        ]}
      />,
    );
    expect(
      screen.getByText(
        "The company finished a year in profit for the first time.",
      ),
    ).toBeTruthy();
  });
});
