import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { commandEnvelope } from "../commands/commandEnvelope";

describe("Staff Commands and Lifecycle Integration", () => {
  it("executes staff commands through submitCommands and emits domain events", () => {
    const sim = new GameSimulation(createInitialGameState(12345));
    const initialStaff = sim.state.staff[0];
    expect(initialStaff).toBeDefined();

    // 1. SET_SHIFT
    const shiftResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.shift.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "SET_SHIFT",
          staffId: initialStaff.id,
          shift: "night",
        },
      }),
    ]);
    expect(shiftResult[0].status).toBe("accepted");
    expect(sim.state.staff.find((s) => s.id === initialStaff.id)?.shift).toBe("night");

    const events = sim.takeDomainEvents();
    expect(events.some((e) => e.payload.type === "SHIFT_CHANGED")).toBe(true);

    // 2. SET_ROSTER
    const rosterResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.roster.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "SET_ROSTER",
          assignments: [{ staffId: initialStaff.id, shift: "morning" }],
        },
      }),
    ]);
    expect(rosterResult[0].status).toBe("accepted");
    expect(sim.state.staff.find((s) => s.id === initialStaff.id)?.shift).toBe("morning");

    // 3. SET_WAGE
    const newWage = initialStaff.monthlyWageMinor + 50_000;
    const wageResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.wage.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "SET_WAGE",
          staffId: initialStaff.id,
          monthlyWageMinor: newWage,
        },
      }),
    ]);
    expect(wageResult[0].status).toBe("accepted");
    expect(sim.state.staff.find((s) => s.id === initialStaff.id)?.monthlyWageMinor).toBe(newWage);

    // 4. PROMOTE
    const promotedWage = newWage + 50_000;
    const promoteResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.promote.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "PROMOTE",
          staffId: initialStaff.id,
          role: "reception",
          monthlyWageMinor: promotedWage,
        },
      }),
    ]);
    expect(promoteResult[0].status).toBe("accepted");
    expect(sim.state.staff.find((s) => s.id === initialStaff.id)?.role).toBe("reception");

    // 5. START_TRAINING
    const trainResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.train.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "START_TRAINING",
          staffId: initialStaff.id,
          courseId: "customer_service_101",
        },
      }),
    ]);
    expect(trainResult[0].status).toBe("accepted");

    // 6. APPROVE_LEAVE
    const leaveResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.leave.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "APPROVE_LEAVE",
          staffId: initialStaff.id,
          days: 2,
        },
      }),
    ]);
    expect(leaveResult[0].status).toBe("accepted");

    // 7. END_EMPLOYMENT
    const endResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.end.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "END_EMPLOYMENT",
          staffId: initialStaff.id,
          cause: "performance",
        },
      }),
    ]);
    expect(endResult[0].status).toBe("accepted");
    expect(sim.state.staff.some((s) => s.id === initialStaff.id)).toBe(false);

    // One-way departure invariant check: second dismissal should fail
    const reEndResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.end.2",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "END_EMPLOYMENT",
          staffId: initialStaff.id,
          cause: "again",
        },
      }),
    ]);
    expect(reEndResult[0].status).toBe("rejected");
  });

  it("rejection leaves state byte-identical and preserves RNG stream", () => {
    const sim = new GameSimulation(createInitialGameState(999));
    const stateWithoutLog = (state: any) => {
      const { commandLog: _log, commandSequence: _seq, ...rest } = state;
      return JSON.stringify(rest);
    };
    const snapshotBefore = stateWithoutLog(sim.state);

    const invalidResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.invalid.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "SET_WAGE",
          staffId: "nonexistent_staff",
          monthlyWageMinor: 100_000,
        },
      }),
    ]);
    expect(invalidResult[0].status).toBe("rejected");
    expect(stateWithoutLog(sim.state)).toBe(snapshotBefore);
  });

  it("sets department head authority and triggers escalation on breach", () => {
    const sim = new GameSimulation(createInitialGameState(777));
    const deptResult = sim.submitCommands([
      commandEnvelope({
        commandId: "cmd.dept.1",
        issuedAtMinutes: sim.state.elapsedMinutes,
        actor: "player",
        payload: {
          type: "SET_DEPARTMENT_AUTHORITY",
          departmentId: "housekeeping",
          authority: {
            overtimeCapHours: 5,
            staffingReserveCount: 10,
          },
        },
      }),
    ]);
    expect(deptResult[0].status).toBe("accepted");
    expect(sim.state.departmentHeadAuthorities.housekeeping.overtimeCapHours).toBe(5);

    // Trigger daily simulation tick which evaluates checkStaffingEscalations
    // Give some overtime or reduce available staff
    const emp = sim.state.workforce.employees[0];
    emp.overtimeHours = 10; // Exceeds cap 5

    // Advance 1 day to trigger runEmploymentDay
    for (let i = 0; i < 288; i++) {
      sim.advanceQuantum();
    }

    const escalations = sim.state.company.escalations;
    expect(escalations.some((e) => e.managerId === "head.housekeeping")).toBe(true);
  });
});
