import { describe, expect, it } from "vitest";
import { eligiblePromotions } from "./careerProgression";
describe("key staff careers", () => {
  it("promotes proven staff", () =>
    expect(
      eligiblePromotions({
        role: "receptionist",
        experience: 80,
        leadership: 65,
      }),
    ).toContain("front-office-manager"));
});
