import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

export interface BrandRow {
  id: string;
  name: string;
  demandUpliftBasisPoints: number;
  monthlyProgrammeCostMinor: number;
  hotelIds: readonly string[];
}

export interface BrandAuditRow {
  hotelId: string;
  hotelName: string;
  brandId: string;
  dateKey: string;
  compliant: boolean;
  failures: readonly string[];
  remediationDueDateKey: string | null;
}

export function BrandDashboard(props: {
  brands: readonly BrandRow[];
  audits: readonly BrandAuditRow[];
  onAssignBrand: (hotelId: string, brandId: string) => void;
  hotels: readonly { id: string; name: string }[];
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  return (
    <section aria-label={t("company.brands.title")}>
      <h2>{t("company.brands.title")}</h2>
      <ul>
        {props.brands.map((brand) => (
          <li key={brand.id}>
            {t("company.brands.item", {
              name: brand.name,
              uplift: formatBasisPoints(brand.demandUpliftBasisPoints, locale),
              cost: formatDm(brand.monthlyProgrammeCostMinor, locale),
              count: brand.hotelIds.length,
              hotelsText: t(
                brand.hotelIds.length === 1
                  ? "company.portfolio.hotel"
                  : "company.portfolio.hotels",
              ),
            })}
          </li>
        ))}
      </ul>

      <h3>{t("company.brands.auditsTitle")}</h3>
      {props.audits.length === 0 ? (
        <p>{t("company.brands.noAudits")}</p>
      ) : (
        <ul>
          {props.audits.map((audit) => (
            <li key={`${audit.hotelId}.${audit.dateKey}`}>
              {audit.hotelName} on {audit.dateKey}:{" "}
              {audit.compliant
                ? t("company.brands.meetsEveryStandard")
                : t("company.brands.fails", {
                    failures: audit.failures.join(", "),
                  })}
              {audit.remediationDueDateKey
                ? t("company.brands.remediation", {
                    date: audit.remediationDueDateKey,
                  })
                : ""}
            </li>
          ))}
        </ul>
      )}

      <h3>{t("company.brands.flyFlagTitle")}</h3>
      {props.hotels.map((hotel) => (
        <p key={hotel.id}>
          {hotel.name}:{" "}
          {props.brands.map((brand) => (
            <button
              type="button"
              key={brand.id}
              onClick={() => props.onAssignBrand(hotel.id, brand.id)}
              aria-label={t("company.brands.flyFlagAria", {
                brand: brand.name,
                hotel: hotel.name,
              })}
            >
              {brand.name}
            </button>
          ))}
        </p>
      ))}
    </section>
  );
}
