import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../game/simulation/initialState";
import { workforceView } from "./workforceView";

describe("workforce view", () => {
  it("joins employees to staff and projects authoritative service loads", () => {
    const state = createInitialGameState(1);
    const employee = state.workforce.employees[0];
    const staff = state.staff.find((item) => item.id === employee.staffId)!;
    employee.status = "sick";
    employee.statusCause = "influenza";
    staff.absent = true;
    state.housekeepingMinutes = 45;
    state.eventHousekeepingMinutes = 90;
    state.eventHousekeepingWorkedMinutes = 30;
    state.receptionCapacity = 1.5;
    state.receptionQueue = [{ bookingId: "booking.1", waitedMinutes: 10 }];
    state.facilities = [
      {
        id: "facility.housekeeping",
        name: "Housekeeping",
        demand: 200,
        capacity: 100,
        cause: "housekeepers on duty",
      },
    ];
    const view = workforceView(state);
    expect(view.rows[0]).toMatchObject({
      staffId: staff.id,
      role: staff.role,
      shift: staff.shift,
      status: "sick",
      statusCause: "influenza",
    });
    expect(view.summary).toMatchObject({ sick: 1, understaffed: true });
    expect(view.housekeeping).toMatchObject({
      demand: 200,
      capacity: 100,
      carriedMinutes: 45,
      eventOutstandingMinutes: 90,
      eventWorkedMinutes: 30,
    });
    expect(view.reception).toEqual({ carriedCapacity: 1.5, waitingParties: 1 });
  });
});
