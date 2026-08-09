import { compareIds } from "../domain/ids";
import type { XorShift32 } from "../domain/rng";
import {
  assertCount,
  assertNonNegativeMinor,
  assertScore,
} from "../domain/units";

/**
 * An employee is a person under a contract, not a capacity number. Hours,
 * illness, leave, training and the day they hand in their notice all move the
 * rota the player is relying on, and every one of them has a cause the player
 * could have acted on.
 */
export type ContractKind = "permanent" | "fixedTerm" | "casual";

export interface EmploymentContract {
  kind: ContractKind;
  monthlyWageMinor: number;
  contractedHoursPerWeek: number;
  /** Fixed-term contracts end; permanent ones do not. */
  endDateKey: string | null;
  /** Days of paid leave a year. */
  annualLeaveDays: number;
}

export type EmployeeStatus =
  "working" | "sick" | "onLeave" | "resigned" | "dismissed";

export interface EmployeeRecord {
  id: string;
  staffId: string;
  contract: EmploymentContract;
  status: EmployeeStatus;
  /** 0-100; what they can actually do, and what training moves. */
  skill: number;
  /** 0-100; how likely they are to stay, and why they might not. */
  morale: number;
  /** Hours worked beyond contract this month; the cause of most of the above. */
  overtimeHours: number;
  leaveDaysTaken: number;
  trainingCompleted: string[];
  /** Why they are in the status they are in. */
  statusCause: string | null;
}

export interface WorkforceState {
  employees: EmployeeRecord[];
  /** Employer reputation contributors this period, for the reputation layer. */
  employerEvents: { cause: string; delta: number }[];
}

export function createWorkforceState(): WorkforceState {
  return { employees: [], employerEvents: [] };
}

export function createContract(
  input: Partial<EmploymentContract> & { monthlyWageMinor: number },
): EmploymentContract {
  assertNonNegativeMinor(input.monthlyWageMinor, "monthly wage");
  const hours = input.contractedHoursPerWeek ?? 40;
  assertCount(hours, "contracted hours");
  if (hours === 0 || hours > 60) throw new Error("invalid contracted hours");
  return {
    kind: input.kind ?? "permanent",
    monthlyWageMinor: input.monthlyWageMinor,
    contractedHoursPerWeek: hours,
    endDateKey: input.endDateKey ?? null,
    annualLeaveDays: input.annualLeaveDays ?? 24,
  };
}

export function employ(
  state: WorkforceState,
  input: {
    id: string;
    staffId: string;
    contract: EmploymentContract;
    skill: number;
  },
): WorkforceState {
  if (state.employees.some((e) => e.id === input.id))
    throw new Error(`employee ${input.id} already exists`);
  assertScore(input.skill, "employee skill");
  return {
    ...state,
    employees: [
      ...state.employees,
      {
        id: input.id,
        staffId: input.staffId,
        contract: input.contract,
        status: "working" as const,
        skill: input.skill,
        morale: 65,
        overtimeHours: 0,
        leaveDaysTaken: 0,
        trainingCompleted: [],
        statusCause: null,
      },
    ].sort((a, b) => compareIds(a.id, b.id)),
  };
}

function update(
  state: WorkforceState,
  id: string,
  change: (employee: EmployeeRecord) => EmployeeRecord,
): WorkforceState {
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new Error(`unknown employee ${id}`);
  return {
    ...state,
    employees: state.employees.map((e) => (e.id === id ? change(e) : e)),
  };
}

/** Overtime beyond this in a month is what actually costs morale. */
export const OVERTIME_TOLERANCE_HOURS = 20;

/**
 * Overtime is paid and then paid for again. Beyond the tolerance it takes
 * morale, and morale is what decides whether the person is still there next
 * quarter.
 */
export function workOvertime(
  state: WorkforceState,
  id: string,
  hours: number,
): WorkforceState {
  assertCount(hours, "overtime hours");
  return update(state, id, (employee) => {
    const total = employee.overtimeHours + hours;
    const excess = Math.max(0, total - OVERTIME_TOLERANCE_HOURS);
    return {
      ...employee,
      overtimeHours: total,
      morale: Math.max(0, employee.morale - Math.trunc(excess / 4)),
    };
  });
}

export function overtimePayMinor(
  employee: EmployeeRecord,
  hourlyPremiumMinor: number,
): number {
  assertNonNegativeMinor(hourlyPremiumMinor, "overtime premium");
  return employee.overtimeHours * hourlyPremiumMinor;
}

/**
 * Whether somebody calls in sick. Drawn from the staffing stream so illness
 * never disturbs the guests', and made likelier by the overtime the player
 * chose to work them.
 */
export function fallsSick(
  employee: EmployeeRecord,
  staffing: XorShift32,
  baseRateBasisPoints = 200,
): boolean {
  const strain = Math.max(0, employee.overtimeHours - OVERTIME_TOLERANCE_HOURS);
  const rate = Math.min(3000, baseRateBasisPoints + strain * 30);
  return staffing.nextUint32() % 10_000 < rate;
}

export function markSick(
  state: WorkforceState,
  id: string,
  cause: string,
): WorkforceState {
  return update(state, id, (employee) => ({
    ...employee,
    status: "sick" as const,
    statusCause: cause,
  }));
}

export function takeLeave(
  state: WorkforceState,
  id: string,
  days: number,
): WorkforceState {
  assertCount(days, "leave days");
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new Error(`unknown employee ${id}`);
  if (employee.leaveDaysTaken + days > employee.contract.annualLeaveDays)
    throw new Error("leave exceeds the contracted entitlement");
  return update(state, id, (e) => ({
    ...e,
    status: "onLeave" as const,
    leaveDaysTaken: e.leaveDaysTaken + days,
    statusCause: "annual leave",
  }));
}

export function returnToWork(
  state: WorkforceState,
  id: string,
): WorkforceState {
  return update(state, id, (employee) => ({
    ...employee,
    status: "working" as const,
    statusCause: null,
  }));
}

/** What training actually buys, per course, in skill points. */
export const TRAINING_SKILL_GAIN = 8;

export function completeTraining(
  state: WorkforceState,
  id: string,
  courseId: string,
): WorkforceState {
  return update(state, id, (employee) =>
    employee.trainingCompleted.includes(courseId)
      ? employee
      : {
          ...employee,
          skill: Math.min(100, employee.skill + TRAINING_SKILL_GAIN),
          morale: Math.min(100, employee.morale + 4),
          trainingCompleted: [...employee.trainingCompleted, courseId].sort(),
        },
  );
}

/** A promotion is a new contract and a new wage, not a badge. */
export function promote(
  state: WorkforceState,
  id: string,
  monthlyWageMinor: number,
): WorkforceState {
  assertNonNegativeMinor(monthlyWageMinor, "promoted wage");
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new Error(`unknown employee ${id}`);
  if (monthlyWageMinor <= employee.contract.monthlyWageMinor)
    throw new Error("a promotion must raise the wage");
  return update(state, id, (e) => ({
    ...e,
    contract: { ...e.contract, monthlyWageMinor },
    morale: Math.min(100, e.morale + 10),
  }));
}

/** Whether somebody has had enough. Low morale is the whole of the cause. */
export function willResign(
  employee: EmployeeRecord,
  staffing: XorShift32,
): boolean {
  if (employee.morale >= 50) return false;
  const rate = (50 - employee.morale) * 60;
  return staffing.nextUint32() % 10_000 < rate;
}

export function resign(
  state: WorkforceState,
  id: string,
  cause: string,
): WorkforceState {
  const after = update(state, id, (employee) => ({
    ...employee,
    status: "resigned" as const,
    statusCause: cause,
  }));
  return {
    ...after,
    employerEvents: [
      ...after.employerEvents,
      { cause: `resignation: ${cause}`, delta: -2 },
    ],
  };
}

/**
 * Dismissal costs money and standing. Both are the point: a group that fires
 * its way out of every problem finds nobody will work for it.
 */
export function dismiss(
  state: WorkforceState,
  id: string,
  cause: string,
): { state: WorkforceState; severanceMinor: number } {
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new Error(`unknown employee ${id}`);
  if (employee.status === "resigned" || employee.status === "dismissed")
    throw new Error(`employee ${id} has already left`);
  const after = update(state, id, (e) => ({
    ...e,
    status: "dismissed" as const,
    statusCause: cause,
  }));
  return {
    state: {
      ...after,
      employerEvents: [
        ...after.employerEvents,
        { cause: `dismissal: ${cause}`, delta: -4 },
      ],
    },
    // A month's pay for a permanent contract; casual work carries none.
    severanceMinor:
      employee.contract.kind === "permanent"
        ? employee.contract.monthlyWageMinor
        : 0,
  };
}

/** Everybody who can actually be rostered today. */
export function availableEmployees(state: WorkforceState): EmployeeRecord[] {
  return state.employees.filter((e) => e.status === "working");
}

/** Resets the month's counters; leave and training are cumulative, hours are not. */
export function startEmploymentMonth(state: WorkforceState): WorkforceState {
  return {
    employees: state.employees.map((e) => ({ ...e, overtimeHours: 0 })),
    employerEvents: [],
  };
}
