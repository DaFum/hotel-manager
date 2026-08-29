import {
  expansionCostMinor,
  EXPANSION_SQM,
  SPECIALIZATIONS,
  type ExpandableArea,
} from "../../game/classification/specialization";
import { formatDm } from "../money";
import { useLocale } from "../localeContext";
import { translateGame } from "../../i18n";

export interface ClassificationView {
  stars: number;
  blockedBy: readonly { standard: string; actual: number; required: number }[];
}

/**
 * The rating and the profile sit together because they are the same decision:
 * what this hotel is trying to be, and what is currently stopping it.
 */
export function ClassificationPanel(props: {
  classification: ClassificationView;
  specializationId: string | null;
  investedArea: { conferenceSqm: number; wellnessSqm: number };
  onSetSpecialization: (id: string | null) => void;
  onExpand: (area: ExpandableArea) => void;
}) {
  const locale = useLocale();
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);
  const selected = SPECIALIZATIONS.find((s) => s.id === props.specializationId);
  const built = selected ? props.investedArea[selected.requires] : 0;
  return (
    <section aria-label="Classification">
      <h2>{t("panels.classification.title")}</h2>
      <p aria-label="Star rating">
        {t("panels.classification.stars", {
          count: props.classification.stars,
        })}
      </p>
      {props.classification.blockedBy.length === 0 ? (
        <p>{t("panels.classification.allStandardsMet")}</p>
      ) : (
        <ul>
          {props.classification.blockedBy.map((b) => (
            <li key={b.standard}>
              {t("panels.classification.blocked", {
                standard: b.standard,
                actual: b.actual,
                required: b.required,
              })}
            </li>
          ))}
        </ul>
      )}
      <label>
        {t("panels.classification.specialization")}
        <select
          value={props.specializationId ?? ""}
          onChange={(event) =>
            props.onSetSpecialization(event.target.value || null)
          }
        >
          <option value="">{t("panels.classification.none")}</option>
          {SPECIALIZATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p aria-label="Profile investment">
          {t("panels.classification.needs", {
            name: selected.name,
            threshold: selected.thresholdSqm,
            area: t(
              selected.requires === "conferenceSqm"
                ? "panels.classification.area.conference"
                : "panels.classification.area.wellness",
            ),
            built,
          })}
          {built < selected.thresholdSqm
            ? ` ${t("panels.classification.unpaid")}`
            : ""}
        </p>
      ) : null}
      <p>
        {t("panels.classification.expandFor", {
          sqm: EXPANSION_SQM,
          cost: formatDm(expansionCostMinor(), locale),
        })}
      </p>
      <button type="button" onClick={() => props.onExpand("conferenceSqm")}>
        {t("panels.classification.expandConference")}
      </button>
      <button type="button" onClick={() => props.onExpand("wellnessSqm")}>
        {t("panels.classification.expandWellness")}
      </button>
    </section>
  );
}
