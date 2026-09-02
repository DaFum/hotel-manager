import { translateGame, type GameLocale } from "../i18n";
import "./revenue.css";
import { formatGameDate, formatGameDateRange } from "../i18n/formatters";
import { GUEST_SEGMENTS } from "../game/content/1991/guestSegments";
import { translateKey } from "./localization";
import { formatBasisPoints, formatDm, formatSignedBasisPoints } from "./money";
import type {
  BookingsRow,
  ChannelMixRow,
  CompetitionRow,
  OverbookingExposureRow,
  PickupRow,
  RateGridRow,
  RatePlanRow,
  RevenueMetricsRow,
  OccupancyDriverRow,
} from "./revenueViewModel";
import type { RevenuePolicyChange } from "../game/revenue/revenuePolicy";
import type { GroupTargets } from "../game/company/groupTargets";

const segmentLabel = (segmentId: string): string =>
  translateKey(
    GUEST_SEGMENTS.find((segment) => segment.id === segmentId)?.nameKey ??
      segmentId,
  );

/**
 * Design intent (AGENTS §13)
 * - Purpose: align price, rooms on the books, pickup and exposure on the same
 *   dates so the player can act without mentally joining separate reports.
 * - Tone: a 1991 yield-office timetable — compact, exact and annotated.
 * - Constraints: semantic tables, textual states, individual SET_RATE edits,
 *   and policy views that remain explicitly read-only.
 * - Differentiator: one calendar spine makes every revenue signal comparable.
 */
export function RevenueDashboard(props: {
  rates: readonly RateGridRow[];
  bookings: readonly BookingsRow[];
  metrics: RevenueMetricsRow;
  channels: readonly ChannelMixRow[];
  pickup: readonly PickupRow[];
  ratePlans: readonly RatePlanRow[];
  overbooking: OverbookingExposureRow;
  competition: readonly CompetitionRow[];
  occupancyDrivers: readonly OccupancyDriverRow[];
  onSetRate: (
    dateKey: string,
    category: RateGridRow["cells"][number]["category"],
    rateMinor: number,
  ) => void;
  onSetRevenuePolicy?: (change: RevenuePolicyChange) => void;
  onSetGroupTargets?: (targets: GroupTargets) => void;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);
  const bookingsByDate = new Map(
    props.bookings.map((row) => [row.dateKey, row]),
  );
  const pickupByDate = new Map(props.pickup.map((row) => [row.dateKey, row]));
  const empty = props.rates.length === 0 && props.bookings.length === 0;
  return (
    <section aria-label={t("revenue.ui.title")} className="revenue-board">
      <header className="revenue-board__header">
        <p>{t("revenue.ui.kicker")}</p>
        <h2>{t("revenue.ui.title")}</h2>
      </header>
      <dl>
        <dt>{t("revenue.ui.adr")}</dt>
        <dd>{formatDm(props.metrics.adrMinor, locale)}</dd>
        <dt>{t("revenue.ui.revpar")}</dt>
        <dd>{formatDm(props.metrics.revParMinor, locale)}</dd>
        <dt>{t("revenue.ui.goppar")}</dt>
        <dd>{formatDm(props.metrics.gopparMinor ?? 0, locale)}</dd>
        <dt>{t("revenue.ui.occupancy")}</dt>
        <dd>{formatBasisPoints(props.metrics.occupancyBasisPoints, locale)}</dd>
      </dl>
      <section aria-label={t("revenue.ui.driversLabel")}>
        <h3>{t("revenue.ui.drivers")}</h3>
        {props.occupancyDrivers.length ? (
          <ul>
            {props.occupancyDrivers.map((row) => (
              <li key={row.factor}>
                {translateGame(locale, `revenue.driver.${row.factor}`)}{" "}
                {formatSignedBasisPoints(row.deltaBasisPoints, locale)}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("revenue.ui.noDrivers")}</p>
        )}
      </section>

      <section aria-label={t("revenue.ui.timelineLabel")}>
        <h3>{t("revenue.ui.timeline")}</h3>
        {empty ? (
          <p>{t("revenue.ui.noTimeline")}</p>
        ) : (
          <table className="hm-responsive-table">
            <caption>
              {props.rates.length
                ? formatGameDateRange(
                    props.rates[0].dateKey,
                    props.rates.at(-1)!.dateKey,
                    locale,
                  )
                : t("revenue.ui.window")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("revenue.ui.date")}</th>
                {props.rates[0]?.cells.map((cell) => (
                  <th scope="col" key={cell.category}>
                    {translateGame(locale, `revenue.category.${cell.category}`)}
                  </th>
                ))}
                <th scope="col">{t("revenue.ui.onBooks")}</th>
                <th scope="col">{t("revenue.ui.forecast")}</th>
                <th scope="col">{t("revenue.ui.pickup")}</th>
              </tr>
            </thead>
            <tbody>
              {props.rates.map((row) => {
                const booking = bookingsByDate.get(row.dateKey);
                return (
                  <tr key={row.dateKey} data-date-state={row.state}>
                    <th scope="row" data-label={t("revenue.ui.date")}>
                      {formatGameDate(row.dateKey, locale)} —{" "}
                      {t(`revenue.ui.dateState.${row.state}`)}
                    </th>
                    {row.cells.map((cell) => (
                      <td key={cell.key} data-label={translateGame(locale, `revenue.category.${cell.category}`)}>
                        <span>{formatDm(cell.rateMinor, locale)}</span>
                        <button
                          type="button"
                          aria-label={t("revenue.ui.raiseRate", {
                            category: `revenue.category.${cell.category}`,
                            date: formatGameDate(row.dateKey, locale),
                          })}
                          onClick={() =>
                            props.onSetRate(
                              row.dateKey,
                              cell.category,
                              cell.rateMinor + 500,
                            )
                          }
                        >
                          + {formatDm(500, locale)}
                        </button>
                      </td>
                    ))}
                    <td data-label={t("revenue.ui.onBooks")}>
                      {booking
                        ? t("revenue.ui.roomsBooked", {
                            confirmed: booking.confirmedRooms,
                            capacity: booking.capacityRooms,
                            occupancy: formatBasisPoints(
                              booking.occupancyBasisPoints,
                              locale,
                            ),
                          })
                        : t("revenue.ui.noBookings")}
                    </td>
                    <td data-label={t("revenue.ui.forecast")}>
                      {booking
                        ? t("revenue.ui.roomNights", {
                            low: booking.forecastLow,
                            high: booking.forecastHigh,
                          })
                        : t("revenue.ui.noForecast")}
                    </td>
                    <td data-label={t("revenue.ui.pickup")}>
                      {t("revenue.ui.rooms", {
                        count: pickupByDate.get(row.dateKey)?.rooms ?? 0,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label={t("revenue.ui.channelMix")}>
        <h3>{t("revenue.ui.channelMix")}</h3>
        {props.channels.length ? (
          <table className="hm-responsive-table">
            <caption>{t("revenue.ui.channelMixCaption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("revenue.ui.channel")}</th>
                <th scope="col">{t("revenue.ui.roomsHeader")}</th>
                <th scope="col">{t("revenue.ui.roomShare")}</th>
                <th scope="col">{t("revenue.ui.revenue")}</th>
                <th scope="col">{t("revenue.ui.revenueShare")}</th>
                <th scope="col">{t("revenue.ui.segments")}</th>
              </tr>
            </thead>
            <tbody>
              {props.channels.map((row) => (
                <tr key={row.channel}>
                  <th scope="row" data-label={t("revenue.ui.channel")}>
                    {translateGame(locale, `revenue.channel.${row.channel}`)}
                  </th>
                  <td data-label={t("revenue.ui.roomsHeader")}>{row.rooms}</td>
                  <td data-label={t("revenue.ui.roomShare")}>
                    {formatBasisPoints(row.roomShareBasisPoints, locale)}
                  </td>
                  <td data-label={t("revenue.ui.revenue")}>
                    {formatDm(row.revenueMinor, locale)}
                  </td>
                  <td data-label={t("revenue.ui.revenueShare")}>
                    {formatBasisPoints(row.revenueShareBasisPoints, locale)}
                  </td>
                  <td data-label={t("revenue.ui.segments")}>
                    {row.segmentLabels.map(segmentLabel).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("revenue.ui.noChannels")}</p>
        )}
      </section>

      <section aria-label={t("revenue.ui.ratePlans")}>
        <h3>{t("revenue.ui.ratePlans")}</h3>
        {props.ratePlans.length ? (
          <table className="hm-responsive-table">
            <caption>{t("revenue.ui.ratePlansCaption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("revenue.ui.plan")}</th>
                <th scope="col">{t("revenue.ui.modifier")}</th>
                <th scope="col">{t("revenue.ui.refund")}</th>
                <th scope="col">{t("revenue.ui.stay")}</th>
                <th scope="col">{t("revenue.ui.arrival")}</th>
              </tr>
            </thead>
            <tbody>
              {props.ratePlans.map((row) => (
                <tr key={row.id}>
                  <th scope="row" data-label={t("revenue.ui.plan")}>
                    {row.id}
                  </th>
                  <td data-label={t("revenue.ui.modifier")}>
                    {formatSignedBasisPoints(
                      row.modifierBasisPoints - 10_000,
                      locale,
                    )}
                  </td>
                  <td data-label={t("revenue.ui.refund")}>
                    {t(
                      row.refundable
                        ? "revenue.ui.refundable"
                        : "revenue.ui.nonRefundable",
                    )}
                  </td>
                  <td data-label={t("revenue.ui.stay")}>
                    {row.minimumStayNights}–
                    {row.maximumStayNights ?? t("revenue.ui.unlimited")}{" "}
                    {t("revenue.ui.nights")}
                  </td>
                  <td data-label={t("revenue.ui.arrival")}>
                    {row.closedToArrival
                      ? t("revenue.ui.closedArrival")
                      : t("revenue.ui.openArrival")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("revenue.ui.noRatePlans")}</p>
        )}
      </section>

      <section aria-label={t("revenue.ui.overbooking")}>
        <h3>{t("revenue.ui.overbooking")}</h3>
        <p>
          {t("revenue.ui.policyLimit", { count: props.overbooking.limitRooms })}
        </p>
        <p>
          {t("revenue.ui.recommendedLimit", {
            count: props.overbooking.recommendedRooms ?? 0,
          })}
        </p>
        <button
          type="button"
          disabled={!props.onSetRevenuePolicy}
          aria-disabled={!props.onSetRevenuePolicy}
          title={
            !props.onSetRevenuePolicy
              ? t("revenue.ui.disabledExplanation")
              : undefined
          }
          onClick={() =>
            props.onSetRevenuePolicy?.({
              overbookingLimitRooms: props.overbooking.recommendedRooms ?? 0,
            })
          }
        >
          {t("revenue.ui.applyRecommendation")}
        </button>
        <button
          type="button"
          disabled={!props.onSetRevenuePolicy}
          aria-disabled={!props.onSetRevenuePolicy}
          title={
            !props.onSetRevenuePolicy
              ? t("revenue.ui.disabledExplanation")
              : undefined
          }
          onClick={() =>
            props.onSetRevenuePolicy?.({ managerAuthorityBp: 500 })
          }
        >
          {t("revenue.ui.enableManager")}
        </button>
        <button
          type="button"
          disabled={!props.onSetGroupTargets}
          aria-disabled={!props.onSetGroupTargets}
          title={
            !props.onSetGroupTargets
              ? t("revenue.ui.disabledExplanation")
              : undefined
          }
          onClick={() =>
            props.onSetGroupTargets?.({
              gopparMinor: props.metrics.gopparMinor ?? 0,
              guestSatisfaction: 75,
              staffTurnoverBasisPoints: 1500,
              marketShareBasisPoints: 2000,
              brandStandard: 80,
            })
          }
        >
          {t("revenue.ui.setGroupTargets")}
        </button>
        <ul>
          {props.overbooking.dates
            .filter((row) => row.exposureRooms > 0)
            .map((row) => (
              <li key={row.dateKey}>
                {t("revenue.ui.exposureMessage", {
                  date: row.dateKey,
                  count: row.exposureRooms,
                })}
              </li>
            ))}
        </ul>
        {props.overbooking.dates.length > 0 &&
        props.overbooking.dates.every((row) => row.exposureRooms === 0) ? (
          <p>{t("revenue.ui.noExposure")}</p>
        ) : null}
      </section>

      <section aria-label={t("revenue.ui.competitionLabel")}>
        <h3>{t("revenue.ui.competition")}</h3>
        {props.competition.length ? (
          <table className="hm-responsive-table">
            <caption>{t("revenue.ui.competitionCaption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("revenue.ui.hotel")}</th>
                <th scope="col">{t("revenue.ui.roomsHeader")}</th>
                <th scope="col">{t("revenue.ui.rate")}</th>
                <th scope="col">{t("revenue.ui.occupancyHeader")}</th>
                <th scope="col">{t("revenue.ui.statusHeader")}</th>
              </tr>
            </thead>
            <tbody>
              {props.competition.map((row) => (
                <tr key={row.id}>
                  <th scope="row" data-label={t("revenue.ui.hotel")}>
                    {translateKey(row.name)}
                  </th>
                  <td data-label={t("revenue.ui.roomsHeader")}>{row.rooms}</td>
                  <td data-label={t("revenue.ui.rate")}>
                    {formatDm(row.rateMinor, locale)}
                  </td>
                  <td data-label={t("revenue.ui.occupancyHeader")}>
                    {formatBasisPoints(row.occupancyBasisPoints, locale)}
                  </td>
                  <td data-label={t("revenue.ui.statusHeader")}>
                    {t(`revenue.ui.status.${row.status}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("revenue.ui.noCompetition")}</p>
        )}
      </section>
    </section>
  );
}
