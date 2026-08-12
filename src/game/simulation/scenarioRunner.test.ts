import { expect, it } from "vitest";
import { runScenario } from "../../../scripts/scenarios/runScenario";

it("runs the mature workload through real aggregate hotel, city and world systems", () => {
  const result = runScenario({ seed: 7, years: 2, scenarioId: "mature-50y" });
  expect(result.metrics).toMatchObject({
    hotels: 60,
    cities: 25,
    competitors: 40,
  });
  expect(result.metrics.authoritativeMonths).toBe(24);
  expect(result.checkpoints).toHaveLength(2);
  expect(result.metrics.technologyAdoptionBasisPoints).toBeGreaterThan(0);
});
