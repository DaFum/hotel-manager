import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

export interface PortfolioHotelRow {
  id: string;
  name: string;
  cityName: string;
  qualityStars: number;
  occupancyBasisPoints: number;
  monthlyProfitMinor: number;
  cashNeedMinor: number;
  renovationNeedMinor: number;
  warnings: number;
  managerName: string;
  brandName?: string;
  operatingModel?: string;
}

export function PortfolioDashboard(props: {
  hotels: readonly PortfolioHotelRow[];
  onOpenHotel: (id: string) => void;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "de-DE";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  if (props.hotels.length === 0)
    return (
      <section aria-label={t("company.portfolio.title")}>
        <h2>{t("company.portfolio.title")}</h2>
        <p>{t("company.portfolio.empty")}</p>
      </section>
    );

  const totalProfitMinor = props.hotels.reduce(
    (sum, hotel) => sum + hotel.monthlyProfitMinor,
    0,
  );

  return (
    <section aria-label={t("company.portfolio.title")}>
      <h2>{t("company.portfolio.title")}</h2>
      <p aria-label={t("company.portfolio.title")}>
        {t("company.portfolio.summary", {
          count: props.hotels.length,
          hotelsText: t(
            props.hotels.length === 1
              ? "company.portfolio.hotel"
              : "company.portfolio.hotels",
          ),
          profit: formatDm(totalProfitMinor, locale),
        })}
      </p>
      {[...new Set(props.hotels.map((hotel) => hotel.cityName))].map((city) => (
        <section
          key={city}
          aria-label={t("company.portfolio.region", { city })}
        >
          <h3>{city}</h3>
          {props.hotels
            .filter((hotel) => hotel.cityName === city)
            .map((hotel) => (
              <article key={hotel.id} aria-label={hotel.name}>
                <h4>{hotel.name}</h4>
                <p>{hotel.cityName}</p>
                <p
                  aria-label={t("company.portfolio.quality", {
                    stars: hotel.qualityStars,
                  })}
                >
                  {"★".repeat(hotel.qualityStars)}{" "}
                  {t("company.portfolio.quality", { stars: hotel.qualityStars })}
                </p>
                <p>
                  {t("company.portfolio.occupancy", {
                    occupancy: formatBasisPoints(
                      hotel.occupancyBasisPoints,
                      locale,
                    ),
                  })}
                </p>
                <p>
                  {t("company.portfolio.lastMonth", {
                    profit: formatDm(hotel.monthlyProfitMinor, locale),
                  })}
                </p>
                <p>
                  {t("company.portfolio.cashNeed", {
                    cash: formatDm(hotel.cashNeedMinor, locale),
                  })}
                </p>
                <p>
                  {t("company.portfolio.renovationNeed", {
                    renovation: formatDm(hotel.renovationNeedMinor, locale),
                  })}
                </p>
                <p>
                  {t("company.portfolio.warningsAndManager", {
                    warnings: hotel.warnings,
                    warningsText: t(
                      hotel.warnings === 1
                        ? "company.portfolio.warning"
                        : "company.portfolio.warnings",
                    ),
                    manager: hotel.managerName,
                  })}
                </p>
                <p>
                  {hotel.brandName
                    ? t("company.portfolio.flag", { brand: hotel.brandName })
                    : t("company.portfolio.unbranded")}
                  {hotel.operatingModel
                    ? t("company.portfolio.held", { model: hotel.operatingModel })
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => props.onOpenHotel(hotel.id)}
                  aria-label={t("company.portfolio.openHotelAria", {
                    name: hotel.name,
                  })}
                >
                  {t("company.portfolio.openHotel")}
                </button>
              </article>
            ))}
        </section>
      ))}
    </section>
  );
}
