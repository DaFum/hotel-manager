import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryInbox } from "./StoryInbox";

describe("StoryInbox", () => {
  it("renders narrative events with content-pack keys in German", () => {
    render(
      <StoryInbox
        events={[
          {
            id: "narrative.1991.overbooking",
            titleKey: "narrative.overbooking-scandal.title",
            bodyKey: "narrative.overbooking-scandal.body",
            raisedDateKey: "1991-05-10",
            choices: [
              {
                id: "compensate",
                labelKey: "narrative.overbooking-scandal.choice.compensate",
              },
              {
                id: "decline",
                labelKey: "narrative.overbooking-scandal.choice.decline",
              },
            ],
          },
        ]}
        locale="de-DE"
      />,
    );

    expect(screen.getByText("Gäste abgewiesen")).toBeTruthy();
    expect(
      screen.getByText(
        "Das Haus war überbucht und Gäste mussten woanders untergebracht werden. Die Presse fragt nach.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Abgewiesene Gäste entschädigen")).toBeTruthy();
    expect(screen.getByText("Stillschweigen bewahren")).toBeTruthy();
  });

  it("renders narrative events with content-pack keys in English", () => {
    render(
      <StoryInbox
        events={[
          {
            id: "narrative.1991.press",
            titleKey: "narrative.press-profile.title",
            bodyKey: "narrative.press-profile.body",
            raisedDateKey: "1991-08-15",
            choices: [
              {
                id: "host",
                labelKey: "narrative.press-profile.choice.host",
              },
              {
                id: "decline",
                labelKey: "narrative.press-profile.choice.decline",
              },
            ],
          },
        ]}
        locale="en-GB"
      />,
    );

    expect(screen.getByText("A travel writer is asking")).toBeTruthy();
    expect(
      screen.getByText(
        "A guide is preparing a profile of the house and would like a stay to write it up.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Host the writer")).toBeTruthy();
    expect(screen.getByText("Decline the request")).toBeTruthy();
  });
});
