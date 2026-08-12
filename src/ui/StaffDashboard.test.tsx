import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaffDashboard } from "./StaffDashboard";
import type { WorkforceView } from "./workforceView";

const view: WorkforceView = {
  rows: [
    {
      employeeId: "employee.1",
      staffId: "staff.1",
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: 300_000,
      contractKind: "permanent",
      status: "sick",
      statusCause: "influenza",
      skill: 70,
      morale: 42,
      overtimeHours: 24,
      leaveDaysTaken: 3,
      trainingCompleted: ["course.rooms"],
      absent: true,
    },
  ],
  summary: { onDuty: 0, absent: 1, sick: 1, onLeave: 0, understaffed: true },
  housekeeping: {
    demand: 240,
    capacity: 120,
    cause: "housekeepers on duty",
    carriedMinutes: 30,
    eventOutstandingMinutes: 60,
    eventWorkedMinutes: 15,
  },
  reception: { carriedCapacity: 1.5, waitingParties: 2 },
  employerReputation: {
    score: 48,
    contributors: [{ cause: "overtime", delta: -2 }],
  },
  wagePressureBasisPoints: 10_500,
};

describe("StaffDashboard", () => {
  it("renders workforce status and authoritative loads", () => {
    render(
      <StaffDashboard
        view={view}
        roles={["housekeeping"]}
        marketWageMinor={300_000}
        onHire={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Workforce roster" }),
    ).toBeTruthy();
    for (const text of [
      "permanent",
      "sick",
      "influenza",
      "42",
      "24",
      "housekeepers on duty",
    ])
      expect(screen.getByText(text)).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Housekeeping load" }).textContent,
    ).toMatch(/240.*120/);
  });

  it("dispatches hiring through the callback", () => {
    const onHire = vi.fn();
    render(
      <StaffDashboard
        view={view}
        roles={["housekeeping"]}
        marketWageMinor={300_000}
        onHire={onHire}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hire applicant" }));
    expect(onHire).toHaveBeenCalledWith("housekeeping");
  });
});
