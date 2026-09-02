import type { OpeningChecklistItem } from "../../game/development/preOpening";
import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

export interface DevelopmentRow {
  id: string;
  name: string;
  rooms: number;
  investmentMinor: number;
  downsideAnnualRoomRevenueMinor: number;
  baseAnnualRoomRevenueMinor: number;
  upsideAnnualRoomRevenueMinor: number;
  returnOnCostBasisPoints: number | null;
  missing: readonly OpeningChecklistItem[];
  openedDateKey: string | null;
}

export function DevelopmentDashboard(props: {
  developments: readonly DevelopmentRow[];
  onCompleteTask: (developmentId: string, item: OpeningChecklistItem) => void;
  onOpen: (developmentId: string) => void;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  if (props.developments.length === 0)
    return (
      <section aria-label={t("company.development.title")}>
        <h2>{t("company.development.title")}</h2>
        <p>{t("company.development.empty")}</p>
      </section>
    );

  return (
    <section aria-label={t("company.development.title")}>
      <h2>{t("company.development.title")}</h2>
      {props.developments.map((development) => (
        <article key={development.id} aria-label={development.name}>
          <h3>{development.name}</h3>
          <p>
            {t("company.development.roomsAndInvestment", {
              rooms: development.rooms,
              investment: formatDm(development.investmentMinor, locale),
            })}
          </p>
          <p
            aria-label={t("company.development.forecastAria", {
              name: development.name,
            })}
          >
            {t("company.development.forecast", {
              low: formatDm(development.downsideAnnualRoomRevenueMinor, locale),
              high: formatDm(development.upsideAnnualRoomRevenueMinor, locale),
              base: formatDm(development.baseAnnualRoomRevenueMinor, locale),
            })}
            {development.returnOnCostBasisPoints === null
              ? ""
              : t("company.development.returnOnCost", {
                  returnRate: formatBasisPoints(
                    development.returnOnCostBasisPoints,
                    locale,
                  ),
                })}
          </p>
          {development.openedDateKey ? (
            <p>
              {t("company.development.opened", {
                date: development.openedDateKey,
              })}
            </p>
          ) : (
            <>
              <p id={`${development.id}.outstanding`}>
                {development.missing.length === 0
                  ? t("company.development.ready")
                  : t("company.development.outstanding", {
                      missing: development.missing.join(", "),
                    })}
              </p>
              {development.missing.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => props.onCompleteTask(development.id, item)}
                  aria-label={t("company.development.signOffAria", {
                    item,
                    name: development.name,
                  })}
                >
                  {t("company.development.signOff", { item })}
                </button>
              ))}
              <button
                type="button"
                disabled={development.missing.length > 0}
                aria-describedby={`${development.id}.outstanding`}
                onClick={() => props.onOpen(development.id)}
                aria-label={t("company.development.openHotelAria", {
                  name: development.name,
                })}
              >
                {t("company.development.openHotel")}
              </button>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
