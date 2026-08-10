import { formatDm } from "../money";

/** The smallest raise the panel will hand out, so zero can move off zero. */
const REPAIR_LIMIT_STEP_MINOR = 100_000;

export interface ManagerRow {
  id: string;
  name: string;
  hotelId: string;
  hotelName: string;
  competence: number;
  repairLimitMinor: number;
  capexLimitMinor: number;
  recoveryLimitMinor: number;
}

export interface EscalationRow {
  id: string;
  hotelName: string;
  managerName: string;
  reason: string;
  status: "open" | "approved" | "rejected";
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: let the player set how much rope each manager gets, and answer
 *   the decisions that came back up because the rope ran out.
 * - Tone: a delegation schedule — limits stated in money, decisions stated in
 *   the manager's own words.
 * - Constraints: an escalation's reason is the label, not a tooltip; approve
 *   and refuse are both explicit buttons so neither is the accidental default.
 * - Differentiator: the limit that caused an escalation is on the same panel
 *   as the escalation, so raising it is one decision rather than a hunt.
 */
export function ManagerGovernancePanel(props: {
  managers: readonly ManagerRow[];
  escalations: readonly EscalationRow[];
  onSetRepairLimit: (hotelId: string, repairLimitMinor: number) => void;
  onResolve: (escalationId: string, approve: boolean) => void;
}) {
  const open = props.escalations.filter((e) => e.status === "open");

  return (
    <section aria-label="Manager governance">
      <h2>Manager governance</h2>

      <h3>Delegated authority</h3>
      <ul>
        {props.managers.map((manager) => (
          <li key={manager.id}>
            {manager.name} at {manager.hotelName}: repairs to{" "}
            {formatDm(manager.repairLimitMinor)}, capital to{" "}
            {formatDm(manager.capexLimitMinor)}, service recovery to{" "}
            {formatDm(manager.recoveryLimitMinor)}{" "}
            <button
              type="button"
              onClick={() =>
                props.onSetRepairLimit(
                  manager.hotelId,
                  // Doubling a limit of nothing leaves it at nothing, so an
                  // undelegated manager would never gain any authority.
                  Math.max(
                    REPAIR_LIMIT_STEP_MINOR,
                    manager.repairLimitMinor * 2,
                  ),
                )
              }
              aria-label={`Raise the repair limit for ${manager.name}`}
            >
              Raise repair limit
            </button>
          </li>
        ))}
      </ul>

      <h3>Decisions awaiting the group</h3>
      {open.length === 0 ? (
        <p>Nothing has been escalated.</p>
      ) : (
        <ul>
          {open.map((escalation) => (
            <li key={escalation.id}>
              {escalation.hotelName}: {escalation.reason}{" "}
              <button
                type="button"
                onClick={() => props.onResolve(escalation.id, true)}
                aria-label={`Approve ${escalation.reason}`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => props.onResolve(escalation.id, false)}
                aria-label={`Refuse ${escalation.reason}`}
              >
                Refuse
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
