import { expect, it } from "vitest";
import {
  fitnessCapacity,
  fitnessSatisfactionBp,
  SQM_PER_USER,
} from "./fitness";

it("is limited by floor area or by stations, whichever runs out first", () => {
  // Station-limited: plenty of floor, not enough equipment.
  expect(fitnessCapacity({ areaSqm: 60, equipmentStations: 8 })).toBe(8);
  // Area-limited: equipment nobody has room to stand at.
  expect(fitnessCapacity({ areaSqm: 12, equipmentStations: 8 })).toBe(3);
  expect(
    fitnessCapacity({ areaSqm: SQM_PER_USER - 1, equipmentStations: 8 }),
  ).toBe(0);
  expect(fitnessCapacity({ areaSqm: 60, equipmentStations: 0 })).toBe(0);
});

it("scores a gym by how crowded it feels", () => {
  // A gym nobody can enter is not a satisfied guest.
  expect(fitnessSatisfactionBp(0, 0)).toBe(0);
  expect(fitnessSatisfactionBp(0, 8)).toBe(10000);
  expect(fitnessSatisfactionBp(4, 8)).toBe(8000);
  expect(fitnessSatisfactionBp(8, 8)).toBe(6000);
  // Overloaded is no worse than full: the door stops letting people in.
  expect(fitnessSatisfactionBp(20, 8)).toBe(6000);
});
