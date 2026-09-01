import type { GameState } from "../simulation/initialState";
import type { GameCommand } from "../commands/commandEnvelope";
import type { DomainEventPayload } from "../domain/events";
import type { StaffRole } from "../domain/staffRoles";
import { STAFF_ROLES } from "../domain/staffRoles";
import type { Shift } from "./staffing";
import { SHIFTS } from "../simulation/GameSimulation";
import {
  completeTraining,
  dismiss,
  promote,
  takeLeave,
} from "./employeeLifecycle";
import { findTrainingCourse, TRAINING_COURSES } from "./training";
import { marketWageMinor } from "../labor/market";
import { BASE_MONTHLY_WAGE_MINOR } from "../content/1991/cityMarket";
import { createDepartmentHeadAuthority } from "../management/managerAuthority";

export const STAFF_COMMAND_TYPES = [
  "END_EMPLOYMENT",
  "SET_ROSTER",
  "SET_SHIFT",
  "SET_WAGE",
  "START_TRAINING",
  "PROMOTE",
  "APPROVE_LEAVE",
  "SET_DEPARTMENT_AUTHORITY",
] as const;

export type StaffCommand = Extract<
  GameCommand,
  { type: (typeof STAFF_COMMAND_TYPES)[number] }
>;

export function isStaffCommand(command: GameCommand): command is StaffCommand {
  return (STAFF_COMMAND_TYPES as readonly string[]).includes(command.type);
}

export type Verdict = { ok: true } | { ok: false; reason: string };

export interface StaffCommandContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(amountMinor: number, account: string, memo: string): void;
}

const ok: Verdict = { ok: true };
const no = (reason: string): Verdict => ({ ok: false, reason });

function getMarketWageFloor(state: GameState): number {
  return marketWageMinor(
    BASE_MONTHLY_WAGE_MINOR,
    state.cityMarket.wagePressureBp,
  );
}

type ActiveEmployeeResult =
  | {
      ok: true;
      employee: GameState["workforce"]["employees"][number];
      staffRow: GameState["staff"][number];
    }
  | { ok: false; verdict: Verdict };

function findActiveEmployee(
  state: GameState,
  staffId: string,
): ActiveEmployeeResult {
  const staffRow = state.staff.find((s) => s.id === staffId);
  if (!staffRow) return { ok: false, verdict: no("unknown staff id") };
  const employee = state.workforce.employees.find(
    (e) => e.staffId === staffId,
  );
  if (!employee) return { ok: false, verdict: no("unknown employee record") };
  if (employee.status === "resigned" || employee.status === "dismissed")
    return { ok: false, verdict: no("employee has already left") };
  return { ok: true, employee, staffRow };
}

function validateEndEmployment(
  state: GameState,
  command: Extract<StaffCommand, { type: "END_EMPLOYMENT" }>,
): Verdict {
  const active = findActiveEmployee(state, command.staffId);
  if (!active.ok) return active.verdict;
  return ok;
}

function validateSetShift(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_SHIFT" }>,
): Verdict {
  const staffRow = state.staff.find((s) => s.id === command.staffId);
  if (!staffRow) return no("unknown staff id");
  if (!SHIFTS.includes(command.shift)) return no("unknown shift");
  return ok;
}

function validateSetRoster(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_ROSTER" }>,
): Verdict {
  if (!Array.isArray(command.assignments))
    return no("assignments must be an array");
  for (const item of command.assignments) {
    if (typeof item.staffId !== "string" || !item.staffId)
      return no("invalid staffId in roster assignment");
    if (!SHIFTS.includes(item.shift)) return no(`unknown shift ${item.shift}`);
    if (!state.staff.some((s) => s.id === item.staffId))
      return no(`unknown staff id ${item.staffId}`);
  }
  return ok;
}

function validateSetWage(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_WAGE" }>,
): Verdict {
  if (
    !Number.isSafeInteger(command.monthlyWageMinor) ||
    command.monthlyWageMinor < 0
  )
    return no("wage must be a safe non-negative integer");
  const active = findActiveEmployee(state, command.staffId);
  if (!active.ok) return active.verdict;
  const floor = getMarketWageFloor(state);
  if (command.monthlyWageMinor < floor)
    return no(`wage is below market floor of ${floor}`);
  return ok;
}

function validatePromote(
  state: GameState,
  command: Extract<StaffCommand, { type: "PROMOTE" }>,
): Verdict {
  if (
    !Number.isSafeInteger(command.monthlyWageMinor) ||
    command.monthlyWageMinor < 0
  )
    return no("wage must be a safe non-negative integer");
  if (!STAFF_ROLES.includes(command.role)) return no("unknown role");
  const active = findActiveEmployee(state, command.staffId);
  if (!active.ok) return active.verdict;
  if (command.monthlyWageMinor <= active.employee.contract.monthlyWageMinor)
    return no("a promotion must raise the wage");
  const floor = getMarketWageFloor(state);
  if (command.monthlyWageMinor < floor)
    return no(`wage is below market floor of ${floor}`);
  return ok;
}

function validateStartTraining(
  state: GameState,
  command: Extract<StaffCommand, { type: "START_TRAINING" }>,
): Verdict {
  if (typeof command.courseId !== "string" || !command.courseId)
    return no("courseId is required");
  const course = findTrainingCourse(command.courseId);
  if (!course) return no("unknown training course");
  const active = findActiveEmployee(state, command.staffId);
  if (!active.ok) return active.verdict;
  if (active.employee.activeTraining)
    return no("employee is already undergoing training");
  if (active.employee.trainingCompleted.includes(command.courseId))
    return no("course already completed");
  if (state.finance.cashMinor < course.costMinor)
    return no("insufficient cash for training");
  return ok;
}

function validateApproveLeave(
  state: GameState,
  command: Extract<StaffCommand, { type: "APPROVE_LEAVE" }>,
): Verdict {
  if (!Number.isSafeInteger(command.days) || command.days <= 0)
    return no("leave days must be a positive integer");
  const active = findActiveEmployee(state, command.staffId);
  if (!active.ok) return active.verdict;
  if (
    active.employee.leaveDaysTaken + command.days >
    active.employee.contract.annualLeaveDays
  )
    return no("leave exceeds the contracted entitlement");
  return ok;
}

function validateSetDepartmentAuthority(
  command: Extract<StaffCommand, { type: "SET_DEPARTMENT_AUTHORITY" }>,
): Verdict {
  const KNOWN_DEPTS = ["housekeeping", "reception", "fnb", "maintenance"];
  if (!KNOWN_DEPTS.includes(command.departmentId))
    return no(`unknown department ${command.departmentId}`);
  try {
    createDepartmentHeadAuthority(command.authority);
  } catch (error) {
    return no((error as Error).message);
  }
  return ok;
}

export function validateStaffCommand(
  state: GameState,
  command: StaffCommand,
): Verdict {
  switch (command.type) {
    case "END_EMPLOYMENT":
      return validateEndEmployment(state, command);
    case "SET_SHIFT":
      return validateSetShift(state, command);
    case "SET_ROSTER":
      return validateSetRoster(state, command);
    case "SET_WAGE":
      return validateSetWage(state, command);
    case "PROMOTE":
      return validatePromote(state, command);
    case "START_TRAINING":
      return validateStartTraining(state, command);
    case "APPROVE_LEAVE":
      return validateApproveLeave(state, command);
    case "SET_DEPARTMENT_AUTHORITY":
      return validateSetDepartmentAuthority(command);
  }
}

function applyEndEmployment(
  state: GameState,
  command: Extract<StaffCommand, { type: "END_EMPLOYMENT" }>,
  ctx: StaffCommandContext,
): void {
  const employee = state.workforce.employees.find(
    (e) => e.staffId === command.staffId,
  )!;
  const cause = command.cause ?? "dismissed by player";
  const { state: nextWorkforce, severanceMinor } = dismiss(
    state.workforce,
    employee.id,
    cause,
  );
  state.workforce = nextWorkforce;
  if (severanceMinor > 0) {
    ctx.spend(
      severanceMinor,
      "severance",
      `severance pay for ${command.staffId}`,
    );
  }
  state.staff = state.staff.filter((s) => s.id !== command.staffId);
  ctx.emit(
    {
      type: "END_EMPLOYMENT",
      staffId: command.staffId,
      employeeId: employee.id,
      severanceMinor,
      cause,
    },
    [command.staffId, employee.id],
  );
}

function applySetShift(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_SHIFT" }>,
  ctx: StaffCommandContext,
): void {
  const staffRow = state.staff.find((s) => s.id === command.staffId)!;
  staffRow.shift = command.shift;
  ctx.emit(
    {
      type: "SHIFT_CHANGED",
      staffId: command.staffId,
      shift: command.shift,
    },
    [command.staffId],
  );
}

function applySetRoster(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_ROSTER" }>,
  ctx: StaffCommandContext,
): void {
  for (const assignment of command.assignments) {
    const staffRow = state.staff.find((s) => s.id === assignment.staffId);
    if (staffRow) staffRow.shift = assignment.shift;
  }
  ctx.emit(
    {
      type: "ROSTER_SET",
      assignments: command.assignments,
    },
    command.assignments.map((a) => a.staffId),
  );
}

function applySetWage(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_WAGE" }>,
  ctx: StaffCommandContext,
): void {
  const staffRow = state.staff.find((s) => s.id === command.staffId)!;
  const employee = state.workforce.employees.find(
    (e) => e.staffId === command.staffId,
  )!;
  staffRow.monthlyWageMinor = command.monthlyWageMinor;
  employee.contract = {
    ...employee.contract,
    monthlyWageMinor: command.monthlyWageMinor,
  };
  ctx.emit(
    {
      type: "SET_WAGE",
      staffId: command.staffId,
      employeeId: employee.id,
      monthlyWageMinor: command.monthlyWageMinor,
    },
    [command.staffId, employee.id],
  );
}

function applyPromote(
  state: GameState,
  command: Extract<StaffCommand, { type: "PROMOTE" }>,
  ctx: StaffCommandContext,
): void {
  const staffRow = state.staff.find((s) => s.id === command.staffId)!;
  const employee = state.workforce.employees.find(
    (e) => e.staffId === command.staffId,
  )!;
  staffRow.role = command.role;
  staffRow.monthlyWageMinor = command.monthlyWageMinor;
  state.workforce = promote(
    state.workforce,
    employee.id,
    command.monthlyWageMinor,
  );
  ctx.emit(
    {
      type: "PROMOTE",
      staffId: command.staffId,
      employeeId: employee.id,
      role: command.role,
      monthlyWageMinor: command.monthlyWageMinor,
    },
    [command.staffId, employee.id],
  );
}

function applyStartTraining(
  state: GameState,
  command: Extract<StaffCommand, { type: "START_TRAINING" }>,
  ctx: StaffCommandContext,
): void {
  const employee = state.workforce.employees.find(
    (e) => e.staffId === command.staffId,
  )!;
  const course = findTrainingCourse(command.courseId)!;
  ctx.spend(
    course.costMinor,
    "training",
    `training course ${course.id} for ${command.staffId}`,
  );
  state.workforce = {
    ...state.workforce,
    employees: state.workforce.employees.map((e) =>
      e.id === employee.id
        ? {
            ...e,
            activeTraining: {
              courseId: course.id,
              remainingDays: course.durationDays,
            },
          }
        : e,
    ),
  };
  const staffRow = state.staff.find((s) => s.id === command.staffId);
  if (staffRow) staffRow.absent = true;
  ctx.emit(
    {
      type: "TRAINING_STARTED",
      staffId: command.staffId,
      employeeId: employee.id,
      courseId: course.id,
    },
    [command.staffId, employee.id],
  );
}

function applyApproveLeave(
  state: GameState,
  command: Extract<StaffCommand, { type: "APPROVE_LEAVE" }>,
  ctx: StaffCommandContext,
): void {
  const employee = state.workforce.employees.find(
    (e) => e.staffId === command.staffId,
  )!;
  state.workforce = takeLeave(state.workforce, employee.id, command.days);
  const staffRow = state.staff.find((s) => s.id === command.staffId);
  if (staffRow) staffRow.absent = true;
  ctx.emit(
    {
      type: "LEAVE_APPROVED",
      staffId: command.staffId,
      employeeId: employee.id,
      days: command.days,
    },
    [command.staffId, employee.id],
  );
}

function applySetDepartmentAuthority(
  state: GameState,
  command: Extract<StaffCommand, { type: "SET_DEPARTMENT_AUTHORITY" }>,
  ctx: StaffCommandContext,
): void {
  state.departmentHeadAuthorities = {
    ...state.departmentHeadAuthorities,
    [command.departmentId]: createDepartmentHeadAuthority({
      ...state.departmentHeadAuthorities?.[command.departmentId],
      ...command.authority,
    }),
  };
  ctx.emit(
    {
      type: "DEPARTMENT_AUTHORITY_CHANGED",
      departmentId: command.departmentId,
    },
    [command.departmentId],
  );
}

export function applyStaffCommand(
  state: GameState,
  command: StaffCommand,
  ctx: StaffCommandContext,
): void {
  const verdict = validateStaffCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);

  switch (command.type) {
    case "END_EMPLOYMENT":
      return applyEndEmployment(state, command, ctx);
    case "SET_SHIFT":
      return applySetShift(state, command, ctx);
    case "SET_ROSTER":
      return applySetRoster(state, command, ctx);
    case "SET_WAGE":
      return applySetWage(state, command, ctx);
    case "PROMOTE":
      return applyPromote(state, command, ctx);
    case "START_TRAINING":
      return applyStartTraining(state, command, ctx);
    case "APPROVE_LEAVE":
      return applyApproveLeave(state, command, ctx);
    case "SET_DEPARTMENT_AUTHORITY":
      return applySetDepartmentAuthority(state, command, ctx);
  }
}
