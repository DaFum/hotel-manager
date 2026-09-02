import { utilizationBp } from "../../game/facilities/capacity";
import { formatBasisPoints } from "../money";
import { useLocale } from "../localeContext";
import { translateGame } from "../../i18n";
import { entityLabel } from "../entityNames";
import { facilityCauseKey } from "../localization";

export interface FacilityRow {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  /** The constraint that is actually binding, in the player's words. */
  cause: string;
}

/**
 * The operations board for every serviced area. It answers one question —
 * where is the house short today, and of what — so the cause is on the row
 * itself rather than hidden behind a colour.
 */
export function FacilitiesDashboard({
  rows,
}: {
  rows: readonly FacilityRow[];
}) {
  const locale = useLocale();
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  if (rows.length === 0)
    return (
      <section aria-label={t("panels.facilities.title")}>
        <h2>{t("panels.facilities.title")}</h2>
        <p>{t("panels.facilities.empty")}</p>
      </section>
    );

  return (
    <section aria-label={t("panels.facilities.title")}>
      <h2>{t("panels.facilities.title")}</h2>
      <ul>
        {rows.map((r) => {
          const name = entityLabel(r.id, locale) || r.name;
          const cause = translateGame(locale, facilityCauseKey(r.cause));
          const loadBp = utilizationBp(
            Math.max(0, Math.round(r.demand)),
            Math.max(0, Math.round(r.capacity)),
          );
          const over = r.demand > r.capacity;
          return (
            <li key={r.id} aria-label={name}>
              <h3>{name}</h3>
              <p>
                {t("panels.facilities.load", {
                  demand: r.demand,
                  capacity: r.capacity,
                  share: formatBasisPoints(loadBp, locale),
                })}
                {over ? ` — ${t("panels.facilities.overCapacity")}` : ""}
              </p>
              <p>{t("panels.facilities.limitedBy", { cause })}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
