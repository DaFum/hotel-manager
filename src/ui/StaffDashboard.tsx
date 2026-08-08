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
  onHire: () => void;
}) {
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
      <button type="button" onClick={props.onHire}>
        Hire applicant
      </button>
    </section>
  );
}
