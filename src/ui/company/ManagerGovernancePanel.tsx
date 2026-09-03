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

function localizeDepartment(dept: string, locale: GameLocale): string {
  const deptKey = `staff.department.${dept}`;
  const translated = translateGame(locale, deptKey);
  if (translated !== deptKey) return translated;
  const roleKey = `staff.role.${dept}`;
  const roleTranslated = translateGame(locale, roleKey);
  if (roleTranslated !== roleKey) return roleTranslated;
  return dept;
}

export function localizeEscalationReason(
  reason: string,
  locale: GameLocale,
): string {
  if (reason === "selling a hotel is never delegated") {
    return translateGame(locale, "company.governance.reason.sellHotel");
  }

  const limitMatch = reason.match(
    /^(repair|capex|recovery) of (\d+) exceeds the (\d+) \1 limit$/,
  );
  if (limitMatch) {
    const [, kind, amountStr, limitStr] = limitMatch;
    const amount = formatDm(Number(amountStr), locale);
    const limit = formatDm(Number(limitStr), locale);
    return translateGame(locale, `company.governance.reason.${kind}`, {
      amount,
      limit,
    });
  }

  const hireMatch = reason.match(/^hiring at (\d+) is not delegated$/);
  if (hireMatch) {
    const amount = formatDm(Number(hireMatch[1]), locale);
    return translateGame(locale, "company.governance.reason.hire", { amount });
  }

  const repriceMatch = reason.match(/^repricing to (\d+) is not delegated$/);
  if (repriceMatch) {
    const amount = formatDm(Number(repriceMatch[1]), locale);
    return translateGame(locale, "company.governance.reason.reprice", {
      amount,
    });
  }

  const overtimeMatch = reason.match(
    /^department (.+) overtime \((\d+)h\) exceeds cap \((\d+)h\)$/,
  );
  if (overtimeMatch) {
    const [, dept, hours, cap] = overtimeMatch;
    const department = localizeDepartment(dept, locale);
    return translateGame(locale, "company.governance.reason.overtime", {
      department,
      hours,
      cap,
    });
  }

  const reserveMatch = reason.match(
    /^department (.+) available staff \((\d+)\) is below reserve requirement \((\d+)\)$/,
  );
  if (reserveMatch) {
    const [, dept, available, reserve] = reserveMatch;
    const department = localizeDepartment(dept, locale);
    return translateGame(locale, "company.governance.reason.reserve", {
      department,
      available,
      reserve,
    });
  }

  const budgetMatch = reason.match(
    /^department (.+) staffing spend \((\d+)\) exceeds budget \((\d+)\)$/,
  );
  if (budgetMatch) {
    const [, dept, actualStr, budgetStr] = budgetMatch;
    const department = localizeDepartment(dept, locale);
    const actual = formatDm(Number(actualStr), locale);
    const budget = formatDm(Number(budgetStr), locale);
    return translateGame(locale, "company.governance.reason.budget", {
      department,
      actual,
      budget,
    });
  }

  const serviceMatch = reason.match(
    /^department (.+) service level \((\d+)bp\) is below minimum \((\d+)bp\)$/,
  );
  if (serviceMatch) {
    const [, dept, actual, min] = serviceMatch;
    const department = localizeDepartment(dept, locale);
    return translateGame(locale, "company.governance.reason.service", {
      department,
      actual,
      min,
    });
  }

  const translated = translateGame(locale, reason);
  return translated;
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
          {open.map((escalation) => {
            const reasonText = localizeEscalationReason(
              escalation.reason,
              locale,
            );
            return (
              <li key={escalation.id}>
                {escalation.hotelName}: {reasonText}{" "}
                <button
                  type="button"
                  onClick={() => props.onResolve(escalation.id, true)}
                  aria-label={t("company.governance.approveAria", {
                    reason: reasonText,
                  })}
                >
                  {t("company.governance.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => props.onResolve(escalation.id, false)}
                  aria-label={t("company.governance.refuseAria", {
                    reason: reasonText,
                  })}
                >
                  {t("company.governance.refuse")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
