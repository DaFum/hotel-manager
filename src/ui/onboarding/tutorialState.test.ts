import { describe, expect, it } from "vitest";
import { completeTutorialStep } from "./tutorialState";
describe("tutorial", () => {
  it("advances from observed actions only", () => {
    const state = { step: "set-room-price" as const, completed: [] };
    expect(completeTutorialStep(state, "HIRE_EMPLOYEE").step).toBe(
      "set-room-price",
    );
    expect(completeTutorialStep(state, "SET_ROOM_RATE").step).toBe(
      "inspect-bookings",
    );
  });
});
