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
        locale="en-GB"
      />,
    );
    expect(
      screen.getByText(
        "The company finished a year in profit for the first time.",
      ),
    ).toBeTruthy();
  });

  it("resolves narrative choice chronicle keys in German and English", () => {
    const { rerender } = render(
      <ChronicleView
        entries={[
          {
            id: "c1",
            date: "1992-06-01",
            text: "chronicle.narrative.overbooking-scandal.compensate",
          },
          {
            id: "c2",
            date: "1993-01-15",
            text: "chronicle.opportunity.paid-off",
          },
          {
            id: "c3",
            date: "1994-03-20",
            text: "chronicle.compliance.breach.regulation.de.labor.tariff_wage",
          },
        ]}
        locale="de-DE"
      />,
    );

    expect(
      screen.getByText("Das Haus entschädigte die abgewiesenen Gäste."),
    ).toBeTruthy();
    expect(
      screen.getByText("Eine alte Beteiligung wurde gewinnbringend verkauft."),
    ).toBeTruthy();
    expect(
      screen.getByText("Tariflohnvorgaben wurden unterschritten."),
    ).toBeTruthy();

    rerender(
      <ChronicleView
        entries={[
          {
            id: "c1",
            date: "1992-06-01",
            text: "chronicle.narrative.overbooking-scandal.compensate",
          },
          {
            id: "c2",
            date: "1993-01-15",
            text: "chronicle.opportunity.paid-off",
          },
          {
            id: "c3",
            date: "1994-03-20",
            text: "chronicle.compliance.breach.regulation.de.labor.tariff_wage",
          },
        ]}
        locale="en-GB"
      />,
    );

    expect(
      screen.getByText("The house paid for the guests it turned away."),
    ).toBeTruthy();
    expect(
      screen.getByText("An old stake was sold at a profit."),
    ).toBeTruthy();
    expect(
      screen.getByText("Tariff wage regulations were breached."),
    ).toBeTruthy();
  });
});
