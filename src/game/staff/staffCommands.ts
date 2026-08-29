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

export function validateStaffCommand(
  state: GameState,
  command: StaffCommand,
): Verdict {
  switch (command.type) {
    case "END_EMPLOYMENT": {
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      );
      if (!employee) return no("unknown employee record");
      if (employee.status === "resigned" || employee.status === "dismissed")
        return no("employee has already left");
      return ok;
    }
    case "SET_SHIFT": {
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      if (!SHIFTS.includes(command.shift)) return no("unknown shift");
      return ok;
    }
    case "SET_ROSTER": {
      if (!Array.isArray(command.assignments))
        return no("assignments must be an array");
      for (const item of command.assignments) {
        if (typeof item.staffId !== "string" || !item.staffId)
          return no("invalid staffId in roster assignment");
        if (!SHIFTS.includes(item.shift))
          return no(`unknown shift ${item.shift}`);
        if (!state.staff.some((s) => s.id === item.staffId))
          return no(`unknown staff id ${item.staffId}`);
      }
      return ok;
    }
    case "SET_WAGE": {
      if (
        !Number.isSafeInteger(command.monthlyWageMinor) ||
        command.monthlyWageMinor < 0
      )
        return no("wage must be a safe non-negative integer");
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      );
      if (!employee) return no("unknown employee record");
      if (employee.status === "resigned" || employee.status === "dismissed")
        return no("employee has already left");
      const floor = getMarketWageFloor(state);
      if (command.monthlyWageMinor < floor)
        return no(`wage is below market floor of ${floor}`);
      return ok;
    }
    case "PROMOTE": {
      if (
        !Number.isSafeInteger(command.monthlyWageMinor) ||
        command.monthlyWageMinor < 0
      )
        return no("wage must be a safe non-negative integer");
      if (!STAFF_ROLES.includes(command.role)) return no("unknown role");
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      );
      if (!employee) return no("unknown employee record");
      if (employee.status === "resigned" || employee.status === "dismissed")
        return no("employee has already left");
      if (command.monthlyWageMinor <= employee.contract.monthlyWageMinor)
        return no("a promotion must raise the wage");
      const floor = getMarketWageFloor(state);
      if (command.monthlyWageMinor < floor)
        return no(`wage is below market floor of ${floor}`);
      return ok;
    }
    case "START_TRAINING": {
      if (typeof command.courseId !== "string" || !command.courseId)
        return no("courseId is required");
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      );
      if (!employee) return no("unknown employee record");
      if (employee.status === "resigned" || employee.status === "dismissed")
        return no("employee has already left");
      return ok;
    }
    case "APPROVE_LEAVE": {
      if (!Number.isSafeInteger(command.days) || command.days <= 0)
        return no("leave days must be a positive integer");
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (!staffRow) return no("unknown staff id");
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      );
      if (!employee) return no("unknown employee record");
      if (employee.status === "resigned" || employee.status === "dismissed")
        return no("employee has already left");
      if (employee.leaveDaysTaken + command.days > employee.contract.annualLeaveDays)
        return no("leave exceeds the contracted entitlement");
      return ok;
    }
    case "SET_DEPARTMENT_AUTHORITY": {
      if (typeof command.departmentId !== "string" || !command.departmentId)
        return no("departmentId is required");
      try {
        createDepartmentHeadAuthority(command.authority);
      } catch (error) {
        return no((error as Error).message);
      }
      return ok;
    }
  }
}

export function applyStaffCommand(
  state: GameState,
  command: StaffCommand,
  ctx: StaffCommandContext,
): void {
  const verdict = validateStaffCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);

  switch (command.type) {
    case "END_EMPLOYMENT": {
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
      return;
    }
    case "SET_SHIFT": {
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
      return;
    }
    case "SET_ROSTER": {
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
      return;
    }
    case "SET_WAGE": {
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
      return;
    }
    case "PROMOTE": {
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
      return;
    }
    case "START_TRAINING": {
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      )!;
      state.workforce = completeTraining(
        state.workforce,
        employee.id,
        command.courseId,
      );
      const updated = state.workforce.employees.find(
        (e) => e.id === employee.id,
      )!;
      const staffRow = state.staff.find((s) => s.id === command.staffId);
      if (staffRow) staffRow.skill = updated.skill;
      ctx.emit(
        {
          type: "TRAINING_COMPLETED",
          staffId: command.staffId,
          employeeId: employee.id,
          courseId: command.courseId,
        },
        [command.staffId, employee.id],
      );
      return;
    }
    case "APPROVE_LEAVE": {
      const employee = state.workforce.employees.find(
        (e) => e.staffId === command.staffId,
      )!;
      state.workforce = takeLeave(state.workforce, employee.id, command.days);
      ctx.emit(
        {
          type: "LEAVE_APPROVED",
          staffId: command.staffId,
          employeeId: employee.id,
          days: command.days,
        },
        [command.staffId, employee.id],
      );
      return;
    }
    case "SET_DEPARTMENT_AUTHORITY": {
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
      return;
    }
  }
}
