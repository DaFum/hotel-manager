import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

export interface ManagedHotelSummaryRow {
  id: string;
  name: string;
  cityName: string;
  occupancyBasisPoints: number;
  monthlyProfitMinor: number;
  cashNeedMinor: number;
  renovationNeedMinor: number;
  managerName: string;
}

export function ManagedHotelSummary(props: {
  hotel: ManagedHotelSummaryRow;
  locale?: GameLocale;
}) {
  const hotel = props.hotel;
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  return (
    <section aria-label={t("company.managed.summaryAria", { name: hotel.name })}>
      <h2>{hotel.name}</h2>
      <p>{hotel.cityName}</p>
      <p>{t("company.managed.summaryNote")}</p>
      <dl>
        <dt>{t("topbar.occupancy")}</dt>
        <dd>{formatBasisPoints(hotel.occupancyBasisPoints, locale)}</dd>
        <dt>{t("topbar.monthProfit")}</dt>
        <dd>{formatDm(hotel.monthlyProfitMinor, locale)}</dd>
        <dt>{t("company.portfolio.cashNeedLabel")}</dt>
        <dd>{formatDm(hotel.cashNeedMinor, locale)}</dd>
        <dt>{t("company.portfolio.renovationNeedLabel")}</dt>
        <dd>{formatDm(hotel.renovationNeedMinor, locale)}</dd>
        <dt>{t("company.managed.manager")}</dt>
        <dd>{hotel.managerName}</dd>
      </dl>
    </section>
  );
}

export function ManagedHotelUnavailable(props: {
  hotelName: string;
  level: "department" | "room";
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  return (
    <section
      aria-label={t("company.managed.unavailableAria", {
        name: props.hotelName,
        level: props.level,
      })}
    >
      <h2>{props.hotelName}</h2>
      <p>
        {props.level === "room"
          ? t("company.managed.roomUnavailableNote")
          : t("company.managed.departmentUnavailableNote")}
      </p>
      <p>{t("company.managed.summaryNote")}</p>
    </section>
  );
}
