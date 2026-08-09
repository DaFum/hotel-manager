import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SaveManager } from "./SaveManager";
import {
  autosaveSlot,
  manualSlot,
  recoverySlot,
} from "../game/persistence/savePolicy";

const noop = () => {};

describe("save manager", () => {
  it("offers manual slots, recovery entries and validation failure", () => {
    const onLoad = vi.fn();
    render(
      <SaveManager
        slots={[
          recoverySlot(0),
          manualSlot("before the refit"),
          autosaveSlot("month"),
        ]}
        recoveredFrom={null}
        validationFailure="content version some-other-game is foreign"
        onSave={noop}
        onLoad={onLoad}
      />,
    );

    // Each kind is named in words rather than distinguished by colour.
    expect(screen.getByText("Manual save")).toBeTruthy();
    expect(screen.getByText("Autosave")).toBeTruthy();
    expect(screen.getAllByText("Recovery").length).toBeGreaterThan(0);
    expect(screen.getByText("before the refit")).toBeTruthy();

    // A refused load says so, and says the running game is unharmed.
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("some-other-game");
    expect(alert.textContent).toMatch(/has not been changed/);

    // Recovering is an explicit choice with its own control.
    fireEvent.click(
      screen.getByRole("button", { name: /Recover generation 0/ }),
    );
    expect(onLoad).toHaveBeenCalledWith(recoverySlot(0));
  });

  it("names a new manual slot instead of overwriting one", () => {
    const onSave = vi.fn();
    render(
      <SaveManager
        slots={[]}
        recoveredFrom={null}
        validationFailure={null}
        onSave={onSave}
        onLoad={noop}
      />,
    );

    const save = screen.getByRole("button", { name: /Save to a new slot/ });
    // There is nothing to save until the player has named it.
    expect(save.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Name this save"), {
      target: { value: "a fresh start" },
    });
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(manualSlot("a fresh start"));
  });

  it("says when a load fell back to a recovery generation", () => {
    render(
      <SaveManager
        slots={[recoverySlot(1)]}
        recoveredFrom={recoverySlot(1)}
        validationFailure={null}
        onSave={noop}
        onLoad={noop}
      />,
    );

    expect(screen.getByRole("status").textContent).toMatch(/generation 1/);
  });

  it("shows a pending load and blocks duplicate load requests", async () => {
    let finish!: () => void;
    const onLoad = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    render(
      <SaveManager
        slots={[manualSlot("checkpoint"), recoverySlot(0)]}
        recoveredFrom={null}
        validationFailure={null}
        onSave={noop}
        onLoad={onLoad}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load checkpoint" }));
    expect(
      screen.getByRole("button", { name: "Loading…" }).hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Recover generation 0" }),
    );
    expect(onLoad).toHaveBeenCalledTimes(1);
    finish();
    await screen.findByRole("button", { name: "Load checkpoint" });
  });
});
