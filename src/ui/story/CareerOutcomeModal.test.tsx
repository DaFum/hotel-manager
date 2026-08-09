import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CareerOutcomeModal } from "./CareerOutcomeModal";
import type { CareerOutcomeState } from "../../game/campaign/careerOutcome";

const outcome = (
  over: Partial<CareerOutcomeState> = {},
): CareerOutcomeState => ({
  distress: "healthy",
  availableRecoveryPaths: [],
  careerMilestone2026: false,
  continueEndless: false,
  ended: false,
  ...over,
});

describe("CareerOutcomeModal", () => {
  it("stays out of the way while the company is healthy", () => {
    const { container } = render(<CareerOutcomeModal outcome={outcome()} />);
    expect(container.firstChild).toBeNull();
  });

  it("closes once endless play has been accepted", () => {
    const reviewed = outcome({ careerMilestone2026: true });
    const { rerender } = render(<CareerOutcomeModal outcome={reviewed} />);
    expect(screen.getByRole("dialog")).toBeTruthy();

    // What the worker sends back after CONTINUE_ENDLESS_CAREER: the review is
    // answered, so the dialog is gone and the game carries on.
    rerender(
      <CareerOutcomeModal outcome={{ ...reviewed, continueEndless: true }} />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("still asks about a company in distress after the review is answered", () => {
    render(
      <CareerOutcomeModal
        outcome={outcome({
          careerMilestone2026: true,
          continueEndless: true,
          distress: "recoverable",
          availableRecoveryPaths: ["refinance"],
        })}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Draw on the credit line")).toBeTruthy();
  });

  it("offers a restart only once the career has actually ended", () => {
    const onRestart = vi.fn();
    render(
      <CareerOutcomeModal
        outcome={outcome({ distress: "terminal", ended: true })}
        onRestart={onRestart}
      />,
    );
    screen.getByText("Restart in 1991").click();
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
