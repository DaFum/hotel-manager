import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

/**
 * Design intent (AGENTS §13)
 * - Purpose: answer "what is the city selling next month, and how sure are
 *   we?" before the player prices a single room.
 * - Tone: a 1991 market bulletin — sources listed like a ledger, the forecast
 *   quoted as a band, not a promise.
 * - Constraints: DOM-only and readable at any text size; no colour-only state.
 * - Differentiator: every number names the driver behind it, so a swing in
 *   demand can be traced to the actor that caused it rather than to luck.
 */
export function CityDashboard(p: {
  business: number;
  leisure: number;
  /** Congress and fair nights; absent before the city has organisers. */
  event?: number;
  /** Group and tour nights. */
  group?: number;
  /** Low and high bound of the room-night forecast. */
  low: number;
  high: number;
  /** Weighted transport reach, 0-100. */
  connectivityIndex?: number;
  /** How good the player's information is, 0-100. */
  informationQuality?: number;
  /** Cost and command callback are supplied together when research is available. */
  researchCostMinor?: number;
  onBuyResearch?: () => void;
  locale?: GameLocale;
}) {
  const locale = p.locale ?? "en-GB";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  const event = p.event ?? 0;
  const group = p.group ?? 0;
  const total = p.business + p.leisure + event + group;
  const sources: readonly [string, number][] = [
    [t("cityDashboard.sources.business"), p.business],
    [t("cityDashboard.sources.leisure"), p.leisure],
    [t("cityDashboard.sources.event"), event],
    [t("cityDashboard.sources.group"), group],
  ];

  return (
    <section aria-label={t("cityDashboard.title")}>
      <h2>{t("cityDashboard.title")}</h2>
      <p aria-label={t("cityDashboard.nightsThisMonthLabel")}>
        {t("cityDashboard.nightsThisMonth", { total })}
      </p>
      <ul>
        {sources.map(([name, nights]) => (
          <li key={name}>
            {t("cityDashboard.sourceRow", {
              name,
              nights,
              share: formatBasisPoints(
                total ? Math.round((nights * 10000) / total) : 0,
                locale,
              ),
            })}
          </li>
        ))}
      </ul>
      <p aria-label={t("cityDashboard.forecastLabel")}>
        {t("cityDashboard.forecast", {
          low: p.low,
          high: p.high,
          quality:
            p.informationQuality === undefined
              ? ""
              : t("cityDashboard.infoQuality", {
                  quality: p.informationQuality,
                }),
        })}
      </p>
      {p.onBuyResearch === undefined ||
      p.researchCostMinor === undefined ? null : (
        <button type="button" onClick={p.onBuyResearch}>
          {t("cityDashboard.buyResearch", {
            cost: formatDm(p.researchCostMinor, locale),
          })}
        </button>
      )}
      {p.connectivityIndex === undefined ? null : (
        <p aria-label={t("cityDashboard.connectivityLabel")}>
          {t("cityDashboard.connectivity", { index: p.connectivityIndex })}
        </p>
      )}
    </section>
  );
}
