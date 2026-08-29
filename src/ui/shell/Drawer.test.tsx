import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { Drawer } from "./Drawer";

describe("Drawer component", () => {
  it("renders with aria-modal='true' and role='dialog'", () => {
    render(
      <Drawer id="test-drawer" title="Test Drawer" open={true} onClose={() => {}}>
        <div>Drawer content</div>
      </Drawer>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Test Drawer");
  });

  it("focuses close button on open, but does not steal focus on rerender while open", () => {
    function TestWrapper() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <button type="button" data-testid="external-btn">
            External
          </button>
          <Drawer
            id="test-drawer"
            title="Test Drawer"
            open={true}
            onClose={() => setCount((c) => c + 1)}
          >
            <div>
              <button
                type="button"
                data-testid="inside-btn"
                onClick={() => setCount((c) => c + 1)}
              >
                Inside {count}
              </button>
            </div>
          </Drawer>
        </div>
      );
    }

    render(<TestWrapper />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    expect(document.activeElement).toBe(closeBtn);

    // Focus an element inside the drawer
    const insideBtn = screen.getByTestId("inside-btn");
    insideBtn.focus();
    expect(document.activeElement).toBe(insideBtn);

    // Trigger a state update / rerender inside wrapper
    fireEvent.click(insideBtn);

    // Focus should remain on insideBtn and NOT be reset back to closeBtn
    expect(document.activeElement).toBe(insideBtn);
  });

  it("restores focus to the trigger/opener when closed", () => {
    function TestComponent() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button
            type="button"
            data-testid="trigger-btn"
            onClick={() => setOpen(true)}
          >
            Open Drawer
          </button>
          <Drawer
            id="test-drawer"
            title="Test Drawer"
            open={open}
            onClose={() => setOpen(false)}
          >
            <div>Drawer content</div>
          </Drawer>
        </div>
      );
    }

    render(<TestComponent />);

    const triggerBtn = screen.getByTestId("trigger-btn");
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    // Open drawer
    fireEvent.click(triggerBtn);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    expect(document.activeElement).toBe(closeBtn);

    // Close drawer
    fireEvent.click(closeBtn);

    // Focus should be restored to triggerBtn
    expect(document.activeElement).toBe(triggerBtn);
  });

  it("restores focus when closed with Escape key", () => {
    function TestComponent() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button
            type="button"
            data-testid="trigger-btn"
            onClick={() => setOpen(true)}
          >
            Open Drawer
          </button>
          <Drawer
            id="test-drawer"
            title="Test Drawer"
            open={open}
            onClose={() => setOpen(false)}
          >
            <div>Drawer content</div>
          </Drawer>
        </div>
      );
    }

    render(<TestComponent />);

    const triggerBtn = screen.getByTestId("trigger-btn");
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(triggerBtn);
  });

  it("traps focus inside the drawer on Tab and Shift+Tab", () => {
    render(
      <Drawer id="test-drawer" title="Test Drawer" open={true} onClose={() => {}}>
        <button type="button" data-testid="btn-1">
          First Inside
        </button>
        <button type="button" data-testid="btn-2">
          Second Inside
        </button>
      </Drawer>,
    );

    const closeBtn = screen.getByRole("button", { name: "Close" });
    const btn1 = screen.getByTestId("btn-1");
    const btn2 = screen.getByTestId("btn-2");

    // Initially close button is focused
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from close button (first focusable) should cycle to btn2 (last focusable)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(btn2);

    // Tab from btn2 (last focusable) should cycle back to closeBtn (first focusable)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });

  it("traps focus even if current focus falls outside the drawer (e.g. disabled control)", () => {
    render(
      <div>
        <button type="button" data-testid="outside-btn">
          Outside
        </button>
        <Drawer id="test-drawer" title="Test Drawer" open={true} onClose={() => {}}>
          <button type="button" data-testid="btn-1">
            First Inside
          </button>
        </Drawer>
      </div>,
    );

    // Focus an element outside the drawer (simulating focus loss when an inside control becomes disabled)
    const outsideBtn = screen.getByTestId("outside-btn");
    outsideBtn.focus();
    expect(document.activeElement).toBe(outsideBtn);

    // Pressing Tab should pull focus back into the drawer (first focusable)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));

    // Focus outside again and Shift+Tab
    outsideBtn.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId("btn-1"));
  });
});
