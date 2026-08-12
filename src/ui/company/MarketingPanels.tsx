import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";
import type {
  salesPipelineView,
  crmConsentView,
  audienceReachView,
} from "./marketingViewModel";
export function SalesPipelinePanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof salesPipelineView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("marketing.sales.title")}>
      <h2>{t("marketing.sales.title")}</h2>
      <h3>{t("marketing.sales.leads")}</h3>
      {view.leads.length ? (
        <ul>
          {view.leads.map((x) => (
            <li key={x.id}>
              {x.accountName}: {t(`marketing.stage.${x.stage}`)} —{" "}
              {x.expectedRoomNights} {t("marketing.sales.nights")}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("marketing.sales.noLeads")}</p>
      )}
      <h3>{t("marketing.sales.contracts")}</h3>
      {view.contracts.length ? (
        <ul>
          {view.contracts.map((x) => (
            <li key={x.id}>
              {x.accountName}: {formatDm(x.negotiatedRateMinor, locale)},{" "}
              {x.validFromDateKey}–{x.validToDateKey},{" "}
              {t(`marketing.renewal.${x.renewalIntent}`)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("marketing.sales.noContracts")}</p>
      )}
    </section>
  );
}
export function CrmConsentPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof crmConsentView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("marketing.crm.title")}>
      <h2>{t("marketing.crm.title")}</h2>
      <p>
        {view.profiles} {t("marketing.crm.profiles")}; {view.marketable}{" "}
        {t("marketing.crm.marketable")}; {view.repeat}{" "}
        {t("marketing.crm.repeat")}
      </p>
      <ul>
        <li>
          {t("marketing.crm.none")}: {view.consent.none}
        </li>
        <li>
          {t("marketing.crm.service")}: {view.consent.service}
        </li>
        <li>
          {t("marketing.crm.marketing")}: {view.consent.marketing}
        </li>
      </ul>
    </section>
  );
}
export function AudienceReachPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof audienceReachView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("marketing.audience.title")}>
      <h2>{t("marketing.audience.title")}</h2>
      <p>
        {t("marketing.audience.incident")}: {view.incidentReach}
      </p>
      <ul>
        {view.media.map((x) => (
          <li key={x.channel}>
            {t(`marketing.channel.${x.channel}`)}:{" "}
            {formatBasisPoints(x.reachBp, locale)}
          </li>
        ))}
      </ul>
      <h3>{t("marketing.audience.campaigns")}</h3>
      {view.campaigns.length ? (
        <ul>
          {view.campaigns.map((x) => (
            <li key={x.id}>
              {t(x.segment)} · {t(`marketing.channel.${x.channel}`)}:{" "}
              {formatBasisPoints(x.lowBp, locale)}–
              {formatBasisPoints(x.highBp, locale)}{" "}
              {t("marketing.audience.plausible")}; {x.influencedBookings}{" "}
              {t("marketing.audience.bookings")}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("marketing.audience.empty")}</p>
      )}
      <h3>{t("marketing.audience.reputation")}</h3>
      {view.reputation.length ? (
        <ul>
          {view.reputation.map((x) => (
            <li key={`${x.dimension}:${x.scope}`}>
              {t(`marketing.dimension.${x.dimension}`)} · {t(x.scope)}:{" "}
              {x.cause ?? t("marketing.audience.noCause")}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("marketing.audience.noReputation")}</p>
      )}
    </section>
  );
}
