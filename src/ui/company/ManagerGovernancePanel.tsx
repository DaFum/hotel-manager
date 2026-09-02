import { translateGame, type GameLocale } from "../../i18n";
import { formatDm } from "../money";

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

export function ManagerGovernancePanel(props: {
  managers: readonly ManagerRow[];
  escalations: readonly EscalationRow[];
  onSetRepairLimit: (hotelId: string, repairLimitMinor: number) => void;
  onResolve: (escalationId: string, approve: boolean) => void;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  const open = props.escalations.filter((e) => e.status === "open");

  return (
    <section aria-label={t("company.governance.title")}>
      <h2>{t("company.governance.title")}</h2>

      <h3>{t("company.governance.delegated")}</h3>
      <ul>
        {props.managers.map((manager) => (
          <li key={manager.id}>
            {t("company.governance.item", {
              name: manager.name,
              hotel: manager.hotelName,
              repair: formatDm(manager.repairLimitMinor, locale),
              capex: formatDm(manager.capexLimitMinor, locale),
              recovery: formatDm(manager.recoveryLimitMinor, locale),
            })}{" "}
            <button
              type="button"
              onClick={() =>
                props.onSetRepairLimit(
                  manager.hotelId,
                  Math.max(
                    REPAIR_LIMIT_STEP_MINOR,
                    manager.repairLimitMinor * 2,
                  ),
                )
              }
              aria-label={t("company.governance.raiseRepairLimitAria", {
                name: manager.name,
              })}
            >
              {t("company.governance.raiseRepairLimit")}
            </button>
          </li>
        ))}
      </ul>

      <h3>{t("company.governance.escalationsTitle")}</h3>
      {open.length === 0 ? (
        <p>{t("company.governance.noEscalations")}</p>
      ) : (
        <ul>
          {open.map((escalation) => (
            <li key={escalation.id}>
              {escalation.hotelName}: {escalation.reason}{" "}
              <button
                type="button"
                onClick={() => props.onResolve(escalation.id, true)}
                aria-label={t("company.governance.approveAria", {
                  reason: escalation.reason,
                })}
              >
                {t("company.governance.approve")}
              </button>
              <button
                type="button"
                onClick={() => props.onResolve(escalation.id, false)}
                aria-label={t("company.governance.refuseAria", {
                  reason: escalation.reason,
                })}
              >
                {t("company.governance.refuse")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
