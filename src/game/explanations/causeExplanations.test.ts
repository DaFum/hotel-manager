import { describe, expect, it } from "vitest";
import { explainCause } from "./causeExplanations";

describe("cause explanations", () => {
  it("turns a metric change into a readable chain of causes", () => {
    expect(
      explainCause("occupancyDown", [
        { factor: "rate above segment willingness", weight: 60 },
        { factor: "no walk-in inventory", weight: 40 },
      ]),
    ).toBe(
      "Occupancy fell because rate above segment willingness (60%) and no walk-in inventory (40%).",
    );
  });

  it("falls back to an honest message when no driver is known", () => {
    expect(explainCause("occupancyDown", [])).toBe(
      "Occupancy fell for no single dominant reason.",
    );
  });
});
