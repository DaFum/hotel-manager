import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";
import type {
  cityActivityView,
  cityEconomyView,
  worldConditionsView,
} from "./marketViewModel";

/** Design intent (AGENTS §13): Purpose: expose the city inputs behind trade. Tone: municipal briefing. Constraints: text accompanies every state. Differentiator: property, labour and access read as one market. */
export function CityEconomyPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof cityEconomyView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section className="hm-city-economy" aria-label={t("market.economy.title")}>
      <h2>{t("market.economy.title")}</h2>
      <dl className="hm-city-economy__metrics">
        <div className="hm-city-economy__item">
          <dt>{t("market.economy.land")}</dt>
          <dd>{formatDm(view.landPriceMinor, locale)}</dd>
          <p className="hm-city-economy__explanation">
            {t(`market.trend.${view.landTrend}`)}
          </p>
        </div>
        <div className="hm-city-economy__item">
          <dt>{t("market.economy.build")}</dt>
          <dd>{formatDm(view.buildCostPerRoomMinor, locale)}</dd>
          <p className="hm-city-economy__explanation">
            {t("market.economy.perRoom")}
          </p>
        </div>
        <div className="hm-city-economy__item">
          <dt>{t("market.economy.wages")}</dt>
          <dd>{formatBasisPoints(view.wagePressureBp, locale)}</dd>
          <p className="hm-city-economy__explanation">
            {t("market.economy.baseWage")} (
            {formatBasisPoints(view.wagePressureMinBp, locale)}–
            {formatBasisPoints(view.wagePressureMaxBp, locale)})
          </p>
        </div>
        <div className="hm-city-economy__item">
          <dt>{t("market.economy.connectivity")}</dt>
          <dd>{view.connectivity}/100</dd>
        </div>
      </dl>
      <ul className="hm-city-economy__transport">
        {view.transport.map((x) => (
          <li key={x.mode}>
            {t(`market.transport.${x.mode}`)}: {x.rating}/100
          </li>
        ))}
      </ul>
    </section>
  );
}
export function CityActivityPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof cityActivityView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("market.activity.title")}>
      <h2>{t("market.activity.title")}</h2>
      <ul>
        {view.actors.map((x) => (
          <li key={x.kind}>
            {t(`market.actor.${x.kind}`)}: {x.scale}{" "}
            {t("market.activity.scale")}
          </li>
        ))}
      </ul>
      <p>
        {view.soldRoomNights} {t("market.activity.sold")}
      </p>
      <p>
        {formatBasisPoints(view.eventUpliftBp, locale)}{" "}
        {t("market.activity.uplift")}; {view.entrantCount}{" "}
        {t("market.activity.entrants")}
      </p>
      <h3>{t("market.activity.events")}</h3>
      {view.events.length ? (
        <ul>
          {view.events.map((e) => (
            <li key={e.id}>
              {e.startDateKey}: {e.guests} {t("market.activity.guests")},{" "}
              {e.roomsBlocked} {t("market.activity.rooms")} —{" "}
              {t(`market.eventStatus.${e.status}`)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("market.activity.empty")}</p>
      )}
    </section>
  );
}
export function WorldConditionsPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof worldConditionsView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("market.world.title")}>
      <h2>{t("market.world.title")}</h2>
      <p>
        {t("market.world.macro")}:{" "}
        {formatBasisPoints(view.macro.growthBp, locale)}{" "}
        {t("market.world.growth")},{" "}
        {formatBasisPoints(view.macro.inflationBp, locale)}{" "}
        {t("market.world.inflation")},{" "}
        {formatBasisPoints(view.macro.interestBp, locale)}{" "}
        {t("market.world.interest")},{" "}
        {formatBasisPoints(view.macro.unemploymentBp, locale)}{" "}
        {t("market.world.unemployment")}
      </p>
      <p>
        {t("market.world.weather")}:{" "}
        {t(`market.world.weatherKind.${view.weather.kind}`)} —{" "}
        {formatBasisPoints(view.weather.severityBp, locale)}{" "}
        {t("market.world.severity")}
      </p>
      <p>
        {t("market.world.currency")}: {view.commonCurrency.id} —{" "}
        {view.commonCurrency.active
          ? t("market.world.active")
          : t("market.world.inactive")}
      </p>
      <p>
        {t("market.world.regulation")}:{" "}
        {formatBasisPoints(view.regulationPressureBp, locale)}
      </p>
      <h3>{t("market.world.trends")}</h3>
      <ul>
        {view.trends.map((x) => (
          <li key={x.id}>
            {t(x.name)}: {formatBasisPoints(x.adoptionBp, locale)}
          </li>
        ))}
      </ul>
      <h3>{t("market.world.shocks")}</h3>
      {view.shocks.length ? (
        <ul>
          {view.shocks.map((s) => (
            <li key={s.id}>
              {t(`market.shockKind.${s.kind}`)}:{" "}
              {s.causes.map((cause) => t(cause)).join(", ")} —{" "}
              {formatBasisPoints(s.severityBp, locale)}, {s.remainingMonths}{" "}
              {t("market.world.months")}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("market.world.noShocks")}</p>
      )}
    </section>
  );
}
