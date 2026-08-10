import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { reputationFor } from "../reputation/dimensions";

function play(days: number, seed = 29): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  for (let i = 0; i < (days * 1440) / QUANTUM_MINUTES; i += 1)
    s.advanceQuantum();
  return s;
}

describe("the workforce against a real trading hotel", () => {
  it("puts everybody on the payroll under a contract from day one", () => {
    const s = play(1);
    expect(s.state.workforce.employees).toHaveLength(s.state.staff.length);
    for (const employee of s.state.workforce.employees) {
      expect(employee.contract.monthlyWageMinor).toBeGreaterThan(0);
      expect(
        s.state.staff.some((member) => member.id === employee.staffId),
      ).toBe(true);
    }
  });

  it("gives a new hire an employment record, not just a rota row", () => {
    const s = new GameSimulation(createInitialGameState(29));
    s.refreshDerivedState();
    const before = s.state.workforce.employees.length;
    s.queueCommand({
      type: "HIRE",
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: 300_000,
    });
    s.advanceQuantum();
    expect(s.state.workforce.employees).toHaveLength(before + 1);
    const hired = s.state.workforce.employees.at(-1)!;
    // The contract carries the wage the hotel actually agreed, which is what
    // the rota row was given rather than what the command asked for.
    const rotaRow = s.state.staff.find(
      (member) => member.id === hired.staffId,
    )!;
    expect(hired.contract.monthlyWageMinor).toBe(rotaRow.monthlyWageMinor);
    expect(hired.status).toBe("working");
  });

  it("makes absence a consequence with a reason, not an unexplained flag", () => {
    const s = play(90);
    const absent = s.state.staff.filter((member) => member.absent);
    for (const member of absent) {
      const employee = s.state.workforce.employees.find(
        (e) => e.staffId === member.id,
      )!;
      expect(employee.status).not.toBe("working");
      expect(employee.statusCause).toBeTruthy();
    }
  });

  it("keeps the rota and the employment record in step", () => {
    const s = play(90);
    for (const member of s.state.staff) {
      const employee = s.state.workforce.employees.find(
        (e) => e.staffId === member.id,
      );
      if (!employee) continue;
      expect(member.absent).toBe(employee.status !== "working");
    }
    // Anybody who resigned is off the rota entirely.
    for (const employee of s.state.workforce.employees)
      if (employee.status === "resigned")
        expect(
          s.state.staff.some((member) => member.id === employee.staffId),
        ).toBe(false);
  });

  it("clears the month's hours at the close but keeps the record", () => {
    // Stopped just short of the close, with a month of hours on the books.
    const s = play(29);
    const before = s.state.workforce.employees.map((employee) => ({
      id: employee.id,
      overtimeHours: employee.overtimeHours,
      // Copied, not referenced: a close that mutated the contract in place
      // would otherwise change this snapshot too and the assertion below
      // would pass without proving anything.
      contract: structuredClone(employee.contract),
      leaveDaysTaken: employee.leaveDaysTaken,
    }));
    expect(before.length).toBeGreaterThan(0);
    expect(before.some((e) => e.overtimeHours > 0)).toBe(true);

    // Three days is enough to cross the close and no more.
    for (let i = 0; i < (3 * 1440) / QUANTUM_MINUTES; i += 1)
      s.advanceQuantum();

    for (const employee of s.state.workforce.employees) {
      const was = before.find((e) => e.id === employee.id);
      if (!was) continue;
      // The counter started again; the person and their terms did not.
      expect(employee.overtimeHours).toBeLessThan(was.overtimeHours);
      expect(employee.contract).toEqual(was.contract);
      expect(employee.leaveDaysTaken).toBe(was.leaveDaysTaken);
    }
    // Employer reputation was moved by what the workforce actually did.
    expect(
      reputationFor(s.state.reputation, "employer", s.state.hotel.id)
        .contributors.length,
    ).toBeGreaterThan(0);
  });

  it("carries the workforce and procurement record through a reload", () => {
    const s = play(40);
    const before = structuredClone(s.state);
    const reloaded = new GameSimulation(structuredClone(before));
    reloaded.refreshDerivedState();
    expect(reloaded.state.workforce).toEqual(before.workforce);
    expect(reloaded.state.procurement).toEqual(before.procurement);
  });
});
