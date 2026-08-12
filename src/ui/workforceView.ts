import type { GameState } from "../game/simulation/initialState";
import type { EmployeeStatus } from "../game/staff/employeeLifecycle";

export interface WorkforceRow {
  employeeId: string;
  staffId: string;
  role: string;
  shift: string;
  monthlyWageMinor: number;
  contractKind: string;
  status: EmployeeStatus;
  statusCause: string | null;
  skill: number;
  morale: number;
  overtimeHours: number;
  leaveDaysTaken: number;
  trainingCompleted: string[];
  absent: boolean;
}

export interface WorkforceView {
  rows: WorkforceRow[];
  summary: {
    onDuty: number;
    absent: number;
    sick: number;
    onLeave: number;
    understaffed: boolean;
  };
  housekeeping: {
    demand: number;
    capacity: number;
    cause: string;
    carriedMinutes: number;
    eventOutstandingMinutes: number;
    eventWorkedMinutes: number;
  };
  reception: { carriedCapacity: number; waitingParties: number };
  employerReputation: {
    score: number | null;
    contributors: { cause: string; delta: number }[];
  };
  wagePressureBasisPoints: number;
}

/** Pure presentation projection: joins records but never changes workforce state. */
export function workforceView(state: GameState): WorkforceView {
  const staffById = new Map(state.staff.map((staff) => [staff.id, staff]));
  const rows = state.workforce.employees.map((employee) => {
    const staff = staffById.get(employee.staffId);
    return {
      employeeId: employee.id,
      staffId: employee.staffId,
      role: staff?.role ?? "staff.role.unknown",
      shift: staff?.shift ?? "staff.shift.unknown",
      monthlyWageMinor:
        staff?.monthlyWageMinor ?? employee.contract.monthlyWageMinor,
      contractKind: employee.contract.kind,
      status: employee.status,
      statusCause: employee.statusCause,
      skill: employee.skill,
      morale: employee.morale,
      overtimeHours: employee.overtimeHours,
      leaveDaysTaken: employee.leaveDaysTaken,
      trainingCompleted: [...employee.trainingCompleted],
      absent: staff?.absent ?? employee.status !== "working",
    };
  });
  const housekeeping = state.facilities.find(
    (facility) => facility.id === "facility.housekeeping",
  );
  const employer = state.reputation.employer[state.hotel.id];
  return {
    rows,
    summary: {
      onDuty: rows.filter((row) => row.status === "working" && !row.absent)
        .length,
      absent: rows.filter((row) => row.absent).length,
      sick: rows.filter((row) => row.status === "sick").length,
      onLeave: rows.filter((row) => row.status === "onLeave").length,
      understaffed: housekeeping
        ? housekeeping.demand > housekeeping.capacity
        : false,
    },
    housekeeping: {
      demand: housekeeping?.demand ?? 0,
      capacity: housekeeping?.capacity ?? 0,
      cause: housekeeping?.cause ?? "staff.housekeeping.unavailable",
      carriedMinutes: state.housekeepingMinutes,
      eventOutstandingMinutes: state.eventHousekeepingMinutes,
      eventWorkedMinutes: state.eventHousekeepingWorkedMinutes,
    },
    reception: {
      carriedCapacity: state.receptionCapacity,
      waitingParties: state.receptionQueue.length,
    },
    employerReputation: {
      score: employer?.score ?? null,
      contributors: employer?.contributors ?? [],
    },
    wagePressureBasisPoints: state.cityMarket.wagePressureBp,
  };
}
