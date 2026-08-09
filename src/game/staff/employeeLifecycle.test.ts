import { describe, expect, it } from "vitest";
import {
  OVERTIME_TOLERANCE_HOURS,
  TRAINING_SKILL_GAIN,
  availableEmployees,
  completeTraining,
  createContract,
  createWorkforceState,
  dismiss,
  employ,
  fallsSick,
  markSick,
  overtimePayMinor,
  promote,
  resign,
  returnToWork,
  startEmploymentMonth,
  takeLeave,
  willResign,
  workOvertime,
} from "./employeeLifecycle";
import { XorShift32 } from "../domain/rng";

function hired() {
  return employ(createWorkforceState(), {
    id: "employee.1",
    staffId: "staff.reception.101",
    contract: createContract({ monthlyWageMinor: 300_000 }),
    skill: 55,
  });
}

describe("employee lifecycle", () => {
  it("employs somebody on a real contract, not a capacity number", () => {
    const state = hired();
    expect(state.employees[0].contract).toEqual({
      kind: "permanent",
      monthlyWageMinor: 300_000,
      contractedHoursPerWeek: 40,
      endDateKey: null,
      annualLeaveDays: 24,
    });
    expect(state.employees[0].status).toBe("working");
    expect(() =>
      createContract({ monthlyWageMinor: 1, contractedHoursPerWeek: 0 }),
    ).toThrow(/contracted hours/);
  });

  it("pays overtime and then charges morale for the excess", () => {
    let state = workOvertime(hired(), "employee.1", OVERTIME_TOLERANCE_HOURS);
    expect(state.employees[0].morale).toBe(65);
    state = workOvertime(state, "employee.1", 20);
    expect(state.employees[0].overtimeHours).toBe(
      OVERTIME_TOLERANCE_HOURS + 20,
    );
    expect(state.employees[0].morale).toBeLessThan(65);
    expect(overtimePayMinor(state.employees[0], 2_500)).toBe(
      (OVERTIME_TOLERANCE_HOURS + 20) * 2_500,
    );
  });

  it("makes illness likelier for the people who were worked hardest", () => {
    const rested = hired().employees[0];
    const worked = workOvertime(hired(), "employee.1", 60).employees[0];
    const rate = (employee: typeof rested) => {
      let sick = 0;
      const stream = new XorShift32(31);
      for (let i = 0; i < 400; i += 1)
        if (fallsSick(employee, stream)) sick += 1;
      return sick;
    };
    expect(rate(worked)).toBeGreaterThan(rate(rested));
  });

  it("takes leave against the entitlement and refuses more than there is", () => {
    let state = takeLeave(hired(), "employee.1", 10);
    expect(state.employees[0].status).toBe("onLeave");
    expect(state.employees[0].leaveDaysTaken).toBe(10);
    expect(availableEmployees(state)).toEqual([]);
    expect(() => takeLeave(state, "employee.1", 20)).toThrow(/entitlement/);
    state = returnToWork(state, "employee.1");
    expect(availableEmployees(state)).toHaveLength(1);
  });

  it("keeps a sick employee off the rota with the reason attached", () => {
    const state = markSick(hired(), "employee.1", "influenza");
    expect(state.employees[0].statusCause).toBe("influenza");
    expect(availableEmployees(state)).toEqual([]);
  });

  it("buys skill and goodwill with training, once per course", () => {
    let state = completeTraining(hired(), "employee.1", "course.front-office");
    expect(state.employees[0].skill).toBe(55 + TRAINING_SKILL_GAIN);
    const skill = state.employees[0].skill;
    state = completeTraining(state, "employee.1", "course.front-office");
    expect(state.employees[0].skill).toBe(skill);
  });

  it("promotes only by raising the wage", () => {
    const state = promote(hired(), "employee.1", 360_000);
    expect(state.employees[0].contract.monthlyWageMinor).toBe(360_000);
    expect(state.employees[0].morale).toBeGreaterThan(65);
    expect(() => promote(state, "employee.1", 300_000)).toThrow(
      /raise the wage/,
    );
  });

  it("loses people whose morale the player spent, and says so to the market", () => {
    let state = workOvertime(hired(), "employee.1", 200);
    expect(state.employees[0].morale).toBeLessThan(50);
    // Morale this low actually costs the house the person, for this seed.
    expect(willResign(state.employees[0], new XorShift32(2))).toBe(true);
    state = resign(state, "employee.1", "constant overtime");
    expect(state.employees[0].status).toBe("resigned");
    expect(state.employerEvents[0]).toEqual({
      cause: "resignation: constant overtime",
      delta: -2,
    });
    // Somebody content never resigns, whatever the draw.
    expect(willResign(hired().employees[0], new XorShift32(2))).toBe(false);
  });

  it("charges severance for a permanent contract and standing for the sacking", () => {
    const permanent = dismiss(hired(), "employee.1", "gross misconduct");
    expect(permanent.severanceMinor).toBe(300_000);
    expect(permanent.state.employerEvents[0].delta).toBe(-4);

    const casual = employ(createWorkforceState(), {
      id: "employee.2",
      staffId: "staff.casual.1",
      contract: createContract({ monthlyWageMinor: 100_000, kind: "casual" }),
      skill: 40,
    });
    expect(dismiss(casual, "employee.2", "end of season").severanceMinor).toBe(
      0,
    );
    expect(() => dismiss(permanent.state, "employee.1", "again")).toThrow(
      /already left/,
    );
  });

  it("resets the month's hours but never its leave or its training", () => {
    let state = completeTraining(
      workOvertime(hired(), "employee.1", 30),
      "employee.1",
      "course.front-office",
    );
    state = takeLeave(state, "employee.1", 5);
    const next = startEmploymentMonth(state);
    expect(next.employees[0].overtimeHours).toBe(0);
    expect(next.employees[0].leaveDaysTaken).toBe(5);
    expect(next.employees[0].trainingCompleted).toEqual([
      "course.front-office",
    ]);
    expect(next.employerEvents).toEqual([]);
  });
});
