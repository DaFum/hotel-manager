import { expect, it } from "vitest";
import { createRngStreams } from "../domain/rng";
import { generateWeather } from "./climate";
it("orders weather impacts by stable operational domain", () => {
  const w = generateWeather(createRngStreams(9).weather, 10000);
  expect(Object.keys(w)).toEqual([
    "kind",
    "severityBp",
    "demandBp",
    "transportReliabilityBp",
    "utilityLoadBp",
    "outdoorCapacityBp",
    "incidentRiskBp",
    "insurable",
  ]);
});
