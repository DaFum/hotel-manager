import { expect, it } from "vitest";
import { adoptionCostMinor, advanceTechnologyProject } from "./adoption";
it("makes mature technology cheaper and completes implementation", () => {
  expect(adoptionCostMinor(10_000_000, 8000)).toBeLessThan(
    adoptionCostMinor(10_000_000, 1000),
  );
  expect(
    advanceTechnologyProject({
      id: "p",
      technologyId: "t",
      status: "implementing",
      remainingMonths: 1,
      costMinor: 1,
    }).status,
  ).toBe("complete");
});
