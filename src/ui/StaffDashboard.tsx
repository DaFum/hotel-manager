import { useState } from "react";
import type { StaffRole } from "../game/domain/staffRoles";
import { formatDm } from "./money";

export interface StaffMember {
  id: string;
  role: string;
  shift: string;
  skill: number;
  monthlyWageMinor: number;
  absent: boolean;
}

export function StaffDashboard(props: {
  staff: readonly StaffMember[];
  /** The roles the hotel can roster; the deep facilities need their own. */
  roles: readonly StaffRole[];
  onHire: (role: StaffRole) => void;
}) {
  const [role, setRole] = useState<StaffRole>(props.roles[0] ?? "housekeeping");
  return (
    <section aria-label="Staff">
      <h2>Staff</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Shift</th>
            <th scope="col">Skill</th>
            <th scope="col">Wage</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {props.staff.map((s) => (
            <tr key={s.id}>
              <td>
                {s.id} ({s.role})
              </td>
              <td>{s.shift}</td>
              <td>{s.skill}</td>
              <td>{formatDm(s.monthlyWageMinor)}</td>
              <td>{s.absent ? "absent" : "on duty"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <label>
        Role
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as StaffRole)}
        >
          {props.roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => props.onHire(role)}>
        Hire applicant
      </button>
    </section>
  );
}
