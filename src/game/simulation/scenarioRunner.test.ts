import { expect, it } from "vitest";
import { runScenario } from "../../../scripts/scenarios/runScenario";

it("reproduces all yearly checkpoints for the same scenario", () => {
  const a = runScenario({ seed: 42, years: 1, scenarioId: "baseline" });
  const b = runScenario({ seed: 42, years: 1, scenarioId: "baseline" });
  expect(a.stateHash).toBe(b.stateHash);
  expect(a.checkpoints).toEqual(b.checkpoints);
  expect(a.checkpoints).toHaveLength(1);
  expect(a.metrics.authoritativeMonths).toBe(12);
  expect(a.metrics.commandsAccepted).toBeGreaterThan(0);
  expect(a.metrics.domainEvents).toBeGreaterThan(0);
}, 30_000);

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
