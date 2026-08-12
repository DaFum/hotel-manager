import { useState } from "react";
import type { StaffRole } from "../game/domain/staffRoles";
import { translateGame, type GameLocale } from "../i18n";
import type { WorkforceView } from "./workforceView";
import { formatBasisPoints, formatDm } from "./money";

export function StaffDashboard(props: {
  view: WorkforceView;
  roles: readonly StaffRole[];
  marketWageMinor: number;
  onHire: (role: StaffRole) => void;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);
  const [role, setRole] = useState<StaffRole>(props.roles[0] ?? "housekeeping");
  return (
    <section aria-label={t("staff.title")}>
      <h2>{t("staff.title")}</h2>
      <section aria-label={t("staff.roster.title")}>
        <h3>{t("staff.roster.title")}</h3>
        <p>
          {t("staff.summary", {
            onDuty: props.view.summary.onDuty,
            absent: props.view.summary.absent,
            sick: props.view.summary.sick,
            onLeave: props.view.summary.onLeave,
            understaffed: props.view.summary.understaffed
              ? t("staff.understaffed")
              : t("staff.staffed"),
          })}
        </p>
        <table>
          <caption>{t("staff.roster.caption")}</caption>
          <thead>
            <tr>
              {[
                "employee",
                "role",
                "shift",
                "contract",
                "status",
                "cause",
                "skill",
                "morale",
                "overtime",
                "leave",
                "training",
                "wage",
              ].map((key) => (
                <th scope="col" key={key}>
                  {t(`staff.roster.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.view.rows.map((row) => (
              <tr key={row.employeeId}>
                <th scope="row">{row.staffId}</th>
                <td>{row.role}</td>
                <td>{row.shift}</td>
                <td>{t(`staff.contract.${row.contractKind}`)}</td>
                <td>{t(`staff.status.${row.status}`)}</td>
                <td>{row.statusCause ?? t("staff.cause.none")}</td>
                <td>{row.skill}</td>
                <td>{row.morale}</td>
                <td>{row.overtimeHours}</td>
                <td>{row.leaveDaysTaken}</td>
                <td>
                  {row.trainingCompleted.length
                    ? row.trainingCompleted.join(", ")
                    : t("staff.training.none")}
                </td>
                <td>{formatDm(row.monthlyWageMinor, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section aria-label={t("staff.housekeeping.title")}>
        <h3>{t("staff.housekeeping.title")}</h3>
        <dl>
          <dt>{t("staff.load.demand")}</dt>
          <dd>{props.view.housekeeping.demand}</dd>
          <dt>{t("staff.load.capacity")}</dt>
          <dd>{props.view.housekeeping.capacity}</dd>
          <dt>{t("staff.load.cause")}</dt>
          <dd>{props.view.housekeeping.cause}</dd>
          <dt>{t("staff.housekeeping.carried")}</dt>
          <dd>
            {props.view.housekeeping.carriedMinutes} {t("staff.minutes")}
          </dd>
          <dt>{t("staff.housekeeping.eventOutstanding")}</dt>
          <dd>
            {props.view.housekeeping.eventOutstandingMinutes}{" "}
            {t("staff.minutes")}
          </dd>
          <dt>{t("staff.housekeeping.eventWorked")}</dt>
          <dd>
            {props.view.housekeeping.eventWorkedMinutes} {t("staff.minutes")}
          </dd>
        </dl>
      </section>
      <section aria-label={t("staff.reception.title")}>
        <h3>{t("staff.reception.title")}</h3>
        <p>
          {t("staff.reception.summary", {
            capacity: props.view.reception.carriedCapacity,
            waiting: props.view.reception.waitingParties,
          })}
        </p>
      </section>
      <section aria-label={t("staff.reputation.title")}>
        <h3>{t("staff.reputation.title")}</h3>
        <p>
          {props.view.employerReputation.score === null
            ? t("staff.reputation.unavailable")
            : `${props.view.employerReputation.score}/100`}
        </p>
        {props.view.employerReputation.contributors.length ? (
          <ul>
            {props.view.employerReputation.contributors
              .slice(-3)
              .reverse()
              .map((item, index) => (
                <li key={`${index}:${item.cause}`}>
                  {item.cause}: {item.delta > 0 ? "+" : ""}
                  {item.delta}
                </li>
              ))}
          </ul>
        ) : (
          <p>{t("staff.reputation.empty")}</p>
        )}
      </section>
      <section aria-label={t("staff.hiring.title")}>
        <h3>{t("staff.hiring.title")}</h3>
        <label>
          {t("staff.hiring.role")}
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
          >
            {props.roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <p aria-label={t("staff.hiring.marketWage")}>
          {t("staff.hiring.context", {
            wage: formatDm(props.marketWageMinor, locale),
            pressure: formatBasisPoints(
              props.view.wagePressureBasisPoints,
              locale,
            ),
          })}
        </p>
        <button type="button" onClick={() => props.onHire(role)}>
          {t("staff.hiring.action")}
        </button>
      </section>
    </section>
  );
}
