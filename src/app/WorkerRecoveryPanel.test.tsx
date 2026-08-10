import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkerRecoveryPanel } from "./WorkerRecoveryPanel";

describe("WorkerRecoveryPanel", () => {
  it("reports the failure and offers explicit recovery", () => {
    const recover = vi.fn();
    render(
      <WorkerRecoveryPanel message="Simulation stopped" onRecover={recover} />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Simulation stopped",
    );
    fireEvent.click(screen.getByRole("button", { name: /recover last save/i }));
    expect(recover).toHaveBeenCalledOnce();
  });
});
