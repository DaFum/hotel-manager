import { expect, it } from "vitest";
import {
  effectiveCapacity,
  utilityShortfall,
  type EngineeringAsset,
} from "./assets";
import {
  isDueForService,
  preventiveCostMinor,
  replacementDecision,
  SERVICE_INTERVAL_MINUTES,
} from "./policy";

it("reduces effective capacity as condition falls", () => {
  expect(effectiveCapacity({ rated: 100, condition: 50 })).toBe(75);
  // Anything from a well-kept asset delivers its full rating.
  expect(effectiveCapacity({ rated: 100, condition: 80 })).toBe(100);
  expect(effectiveCapacity({ rated: 100, condition: 100 })).toBe(100);
  expect(effectiveCapacity({ rated: 100, condition: 0 })).toBe(50);
});

it("reports the demand a degraded plant cannot cover", () => {
  expect(utilityShortfall({ rated: 100, condition: 50 }, 90)).toBe(15);
  expect(utilityShortfall({ rated: 100, condition: 100 }, 90)).toBe(0);
});

it("schedules preventive service on run hours, not on failure", () => {
  expect(
    isDueForService({ minutesSinceService: SERVICE_INTERVAL_MINUTES }),
  ).toBe(true);
  expect(
    isDueForService({ minutesSinceService: SERVICE_INTERVAL_MINUTES - 1 }),
  ).toBe(false);
  expect(preventiveCostMinor({ replacementMinor: 2_000_000 })).toBe(60_000);
});

it("replaces an asset once repairing it stops being worth it", () => {
  const worn: EngineeringAsset = { rated: 100, condition: 15 };
  const healthy: EngineeringAsset = { rated: 100, condition: 85 };
  expect(
    replacementDecision(worn, {
      replacementMinor: 2_000_000,
      repairMinor: 1_400_000,
    }).replace,
  ).toBe(true);
  expect(
    replacementDecision(healthy, {
      replacementMinor: 2_000_000,
      repairMinor: 1_400_000,
    }).replace,
  ).toBe(false);
  expect(
    replacementDecision(worn, {
      replacementMinor: 2_000_000,
      repairMinor: 40_000,
    }).replace,
  ).toBe(false);
});
