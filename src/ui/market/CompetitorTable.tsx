import type { Strategy } from "../../game/competitors/strategies";
import type { LifecycleAction } from "../../game/competitors/lifecycle";
import { strategyProfile } from "../../game/competitors/strategies";
import { formatBasisPoints, formatDm } from "../money";
import { translateGame, type GameLocale } from "../../i18n";
import { translateKey } from "../localization";

export interface CompetitorRow {
  id: string;
  name: string;
  strategy: Strategy;
  rooms: number;
  rateMinor: number;
  occupancyBp: number;
  status: LifecycleAction;
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: let the player see, in one glance, whether they are the dear
 *   house or the cheap one, and which rival is about to be in trouble.
 * - Tone: a hotelier's competitive set sheet, this hotel on the same rows as
 *   the rivals rather than in a separate summary box.
 * - Constraints: a real table with headers, so screen readers and sighted
 *   readers get the same comparison; state is written in words.
 * - Differentiator: every rival row says where it sits against this hotel,
 *   so the number and its meaning never live apart.
 */
export function CompetitorTable(props: {
  rows: readonly CompetitorRow[];
  playerRateMinor: number;
  playerOccupancyBp: number;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (k: string, values?: Record<string, string | number>) =>
    translateGame(locale, k, values);

  if (props.rows.length === 0)
    return (
      <section aria-label={t("competitors.title")}>
        <h2>{t("competitors.title")}</h2>
        <p>{t("competitors.empty")}</p>
      </section>
    );

  const position = (rateMinor: number) => {
    const deltaBp = Math.round(
      ((rateMinor - props.playerRateMinor) * 10000) / props.playerRateMinor,
    );
    if (deltaBp > 250)
      return t("competitors.above", {
        delta: formatBasisPoints(deltaBp, locale),
      });
    if (deltaBp < -250)
      return t("competitors.below", {
        delta: formatBasisPoints(-deltaBp, locale),
      });
    return t("competitors.level");
  };

  return (
    <section aria-label={t("competitors.title")}>
      <h2>{t("competitors.title")}</h2>
      <table className="hm-responsive-table">
        <caption>{t("competitors.caption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("competitors.headers.hotel")}</th>
            <th scope="col">{t("competitors.headers.strategy")}</th>
            <th scope="col">{t("competitors.headers.rooms")}</th>
            <th scope="col">{t("competitors.headers.rate")}</th>
            <th scope="col">{t("competitors.headers.occupancy")}</th>
            <th scope="col">{t("competitors.headers.position")}</th>
            <th scope="col">{t("competitors.headers.status")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" data-label={t("competitors.headers.hotel")}>
              {t("competitors.playerHotel")}
            </th>
            <td data-label={t("competitors.headers.strategy")}>
              {t("competitors.playerStrategy")}
            </td>
            <td data-label={t("competitors.headers.rooms")}>—</td>
            <td data-label={t("competitors.headers.rate")}>
              {formatDm(props.playerRateMinor, locale)}
            </td>
            <td data-label={t("competitors.headers.occupancy")}>
              {formatBasisPoints(props.playerOccupancyBp, locale)}
            </td>
            <td data-label={t("competitors.headers.position")}>—</td>
            <td data-label={t("competitors.headers.status")}>
              {t("competitors.status.operate")}
            </td>
          </tr>
          {props.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" data-label={t("competitors.headers.hotel")}>
                {translateKey(r.name)}
              </th>
              <td data-label={t("competitors.headers.strategy")}>
                {t(strategyProfile(r.strategy).nameKey)}
              </td>
              <td data-label={t("competitors.headers.rooms")}>{r.rooms}</td>
              <td data-label={t("competitors.headers.rate")}>
                {formatDm(r.rateMinor, locale)}
              </td>
              <td data-label={t("competitors.headers.occupancy")}>
                {formatBasisPoints(r.occupancyBp, locale)}
              </td>
              <td data-label={t("competitors.headers.position")}>
                {position(r.rateMinor)}
              </td>
              <td data-label={t("competitors.headers.status")}>
                {t(`competitors.status.${r.status}`)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
