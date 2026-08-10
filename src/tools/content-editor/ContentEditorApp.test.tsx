import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentEditorApp } from "./ContentEditorApp";

describe("ContentEditorApp", () => {
  it("lets an author edit every schema-backed parameter as validated JSON", () => {
    render(<ContentEditorApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /room.standard.single/ }),
    );
    const source = screen.getByLabelText("Selected record JSON");
    expect((source as HTMLTextAreaElement).value).toContain("fitOutCostMinor");
    fireEvent.change(source, { target: { value: "{" } });
    expect(screen.getByRole("alert").textContent).toMatch(/json/i);
    expect(
      (screen.getByRole("button", { name: "Export pack" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
