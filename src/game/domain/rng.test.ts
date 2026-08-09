import { describe, expect, it } from "vitest";
import { createRngStreams } from "./rng";

describe("rng streams", () => {
  it("creates stable isolated subsystem streams", () => {
    const a = createRngStreams(424242),
      b = createRngStreams(424242);
    expect([...Object.keys(a)].sort()).toEqual([
      "AI",
      "economy",
      "events",
      "failures",
      "guests",
      "narrative",
      "staffing",
      "weather",
    ]);
    expect(a.guests.nextUint32()).toBe(b.guests.nextUint32());
    expect(a.failures.nextUint32()).toBe(b.failures.nextUint32());
  });
});
