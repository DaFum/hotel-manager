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
});
