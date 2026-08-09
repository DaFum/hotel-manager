import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./initialState";
describe("initial state", () => {
  it("starts Frankfurt 1991 with 24 rooms and 400000 DM cash", () => {
    const s = createInitialGameState(1234);
    expect(s.calendar.dateKey).toBe("1991-01-01");
    expect(s.hotel.rooms).toHaveLength(24);
    expect(s.finance.cashMinor).toBe(40_000_000);
    expect([...Object.keys(s.rngState)].sort()).toEqual([
      "AI",
      "economy",
      "events",
      "failures",
      "guests",
      "narrative",
      "staffing",
      "weather",
    ]);
  });
});
