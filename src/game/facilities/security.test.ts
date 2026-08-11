import { expect, it } from "vitest";
import { requiredSecurityStaff, securityGapAlert } from "./security";
import {
  changingRoomPressureBp,
  staffAreaCapacity,
  STAFF_AREA_SQM_PER_HEAD,
} from "./staffAreas";
import {
  elevatorTrips,
  elevatorWaitMinutes,
  ELEVATOR_TRIP_MINUTES,
} from "./mobility";

it("adds staff for events and vip load", () => {
  expect(
    requiredSecurityStaff({ base: 1, eventGuests: 300, vipLevel: 2 }),
  ).toBe(5);
  expect(requiredSecurityStaff({ base: 1, eventGuests: 0, vipLevel: 0 })).toBe(
    1,
  );
});

it("names the shortfall rather than only failing quietly", () => {
  expect(securityGapAlert(2, 5)).toEqual({
    short: 3,
    cause: "alert.security-short.cause",
    causeValues: { short: 3, base: 5, eventGuests: 0, vipLevel: 0 },
  });
  expect(securityGapAlert(5, 5)).toBeNull();
});

it("blames the part of the requirement that is actually driving it", () => {
  expect(
    securityGapAlert(1, 5, { base: 1, eventGuests: 300, vipLevel: 2 }),
  ).toEqual({
    short: 4,
    cause: "alert.security-short.cause",
    causeValues: { short: 4, base: 1, eventGuests: 300, vipLevel: 2 },
  });
});

it("sizes staff areas by headcount on the biggest shift", () => {
  expect(staffAreaCapacity({ areaSqm: 40 })).toBe(
    Math.floor(40 / STAFF_AREA_SQM_PER_HEAD),
  );
  // Overcrowded changing rooms cost the shift time before it starts.
  expect(changingRoomPressureBp(20, 10)).toBeGreaterThan(0);
  expect(changingRoomPressureBp(8, 10)).toBe(0);
});

it("turns guest and service movement into lift trips and waiting", () => {
  expect(elevatorTrips({ arrivals: 10, departures: 8, serviceRuns: 4 })).toBe(
    22,
  );
  const busy = elevatorWaitMinutes(60, 2);
  const quiet = elevatorWaitMinutes(6, 2);
  expect(busy).toBeGreaterThan(quiet);
  expect(elevatorWaitMinutes(60, 0)).toBeGreaterThan(busy);
  expect(ELEVATOR_TRIP_MINUTES).toBeGreaterThan(0);
});
