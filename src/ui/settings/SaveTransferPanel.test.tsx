import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaveTransferPanel } from "./SaveTransferPanel";

describe("SaveTransferPanel", () => {
  it("clears a selected file before a failed import completes", async () => {
    render(<SaveTransferPanel databaseName="save-transfer-panel-test" />);
    const input = screen.getByLabelText("Import save file") as HTMLInputElement;
    const file = new File(["{}"], "invalid.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(input.value).toBe("");
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).not.toBe(""),
    );
  });
});
