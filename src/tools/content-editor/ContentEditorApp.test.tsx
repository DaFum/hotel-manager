import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentEditorApp, nextDraftFacilityId } from "./ContentEditorApp";

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

  it("fills the first gap in draft facility ids", () => {
    expect(
      nextDraftFacilityId({
        "facility.draft-1": { id: "facility.draft-1" },
        "facility.draft-3": { id: "facility.draft-3" },
        "facility.other": { id: "facility.other" },
      }),
    ).toBe("facility.draft-2");
  });

  it("preserves JSON formatting while editing in the middle of a record", () => {
    render(<ContentEditorApp />);
    fireEvent.click(
      screen.getByRole("button", { name: /room.standard.single/ }),
    );
    const source = screen.getByLabelText(
      "Selected record JSON",
    ) as HTMLTextAreaElement;
    const edited = source.value.replace(
      '"fitOutCostMinor": 1800000',
      '"fitOutCostMinor" : 1800000',
    );
    fireEvent.change(source, { target: { value: edited } });
    expect(source.value).toBe(edited);
  });

  it("rejects a stable id that belongs to another record", () => {
    render(<ContentEditorApp />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "facility.breakfast_room (facility)",
      }),
    );
    const source = screen.getByLabelText(
      "Selected record JSON",
    ) as HTMLTextAreaElement;
    fireEvent.change(source, {
      target: {
        value: source.value.replace(
          /"id": "facility.breakfast_room"/,
          '"id": "facility.restaurant"',
        ),
      },
    });
    expect(screen.getByRole("alert").textContent).toMatch(/already exists/i);
    expect(
      screen.getByRole("button", {
        name: "facility.breakfast_room (facility)",
      }),
    ).toBeTruthy();
  });
});
