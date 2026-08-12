import { translateGame, type GameLocale } from "../i18n";
import "./revenue.css";
import { formatGameDateRange } from "../i18n/formatters";
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
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  const bookingsByDate = new Map(
    props.bookings.map((row) => [row.dateKey, row]),
  );
  const pickupByDate = new Map(props.pickup.map((row) => [row.dateKey, row]));
  const empty = props.rates.length === 0 && props.bookings.length === 0;
  return (
    <section aria-label="Revenue" className="revenue-board">
      <header className="revenue-board__header">
        <p>Yield office · forward book</p>
        <h2>Revenue</h2>
      </header>
      <dl>
        <dt>ADR</dt>
        <dd>{formatDm(props.metrics.adrMinor, locale)}</dd>
        <dt>RevPAR</dt>
        <dd>{formatDm(props.metrics.revParMinor, locale)}</dd>
        <dt>Occupancy</dt>
        <dd>{formatBasisPoints(props.metrics.occupancyBasisPoints, locale)}</dd>
      </dl>
      <section aria-label="Occupancy drivers">
        <h3>Why occupancy moved</h3>
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
          <p>No occupancy movement has been attributed yet.</p>
        )}
      </section>

      <section aria-label="Revenue timeline">
        <h3>Rate and demand timeline</h3>
        {empty ? (
          <p>No rate or booking data is available for this window.</p>
        ) : (
          <table>
            <caption>
              {props.rates.length
                ? formatGameDateRange(
                    props.rates[0].dateKey,
                    props.rates.at(-1)!.dateKey,
                    locale,
                  )
                : "Revenue window"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                {props.rates[0]?.cells.map((cell) => (
                  <th scope="col" key={cell.category}>
                    {translateGame(locale, `revenue.category.${cell.category}`)}
                  </th>
                ))}
                <th scope="col">On the books</th>
                <th scope="col">Forecast demand</th>
                <th scope="col">7-day pickup</th>
              </tr>
            </thead>
            <tbody>
              {props.rates.map((row) => {
                const booking = bookingsByDate.get(row.dateKey);
                return (
                  <tr key={row.dateKey} data-date-state={row.state}>
                    <th scope="row">
                      {row.dateKey} — {row.state}
                    </th>
                    {row.cells.map((cell) => (
                      <td key={cell.key}>
                        <span>{formatDm(cell.rateMinor, locale)}</span>
                        <button
                          type="button"
                          aria-label={
                            row.state === "today" && cell.category === "single"
                              ? "Set single rate"
                              : `Raise ${translateGame(locale, `revenue.category.${cell.category}`)} rate on ${row.dateKey}`
                          }
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
                    <td>
                      {booking
                        ? `${booking.confirmedRooms}/${booking.capacityRooms} rooms (${formatBasisPoints(booking.occupancyBasisPoints, locale)})`
                        : "No booking data"}
                    </td>
                    <td>
                      {booking
                        ? `${booking.forecastLow}–${booking.forecastHigh} room nights`
                        : "No forecast"}
                    </td>
                    <td>{pickupByDate.get(row.dateKey)?.rooms ?? 0} rooms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label="Channel mix">
        <h3>Channel mix</h3>
        {props.channels.length ? (
          <table>
            <caption>Confirmed business by channel</caption>
            <thead>
              <tr>
                <th scope="col">Channel</th>
                <th scope="col">Rooms</th>
                <th scope="col">Room share</th>
                <th scope="col">Revenue</th>
                <th scope="col">Revenue share</th>
                <th scope="col">Segments</th>
              </tr>
            </thead>
            <tbody>
              {props.channels.map((row) => (
                <tr key={row.channel}>
                  <th scope="row">
                    {translateGame(locale, `revenue.channel.${row.channel}`)}
                  </th>
                  <td>{row.rooms}</td>
                  <td>{formatBasisPoints(row.roomShareBasisPoints, locale)}</td>
                  <td>{formatDm(row.revenueMinor, locale)}</td>
                  <td>
                    {formatBasisPoints(row.revenueShareBasisPoints, locale)}
                  </td>
                  <td>{row.segmentLabels.map(segmentLabel).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No confirmed bookings contribute to channel mix.</p>
        )}
      </section>

      <section aria-label="Rate plans">
        <h3>Rate plans</h3>
        {props.ratePlans.length ? (
          <table>
            <caption>Current read-only rate plans</caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Modifier</th>
                <th scope="col">Refund</th>
                <th scope="col">Stay</th>
                <th scope="col">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {props.ratePlans.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.id}</th>
                  <td>
                    {formatSignedBasisPoints(
                      row.modifierBasisPoints - 10_000,
                      locale,
                    )}
                  </td>
                  <td>{row.refundable ? "refundable" : "non-refundable"}</td>
                  <td>
                    {row.minimumStayNights}–
                    {row.maximumStayNights ?? "unlimited"} nights
                  </td>
                  <td>
                    {row.closedToArrival
                      ? "closed to arrival"
                      : "open to arrival"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No rate plans are configured.</p>
        )}
      </section>

      <section aria-label="Overbooking exposure">
        <h3>Overbooking exposure</h3>
        <p>Policy limit: {props.overbooking.limitRooms} rooms.</p>
        <ul>
          {props.overbooking.dates
            .filter((row) => row.exposureRooms > 0)
            .map((row) => (
              <li key={row.dateKey}>
                {row.dateKey}: {row.exposureRooms} rooms above physical capacity
              </li>
            ))}
        </ul>
        {props.overbooking.dates.every((row) => row.exposureRooms === 0) ? (
          <p>No date is above physical capacity.</p>
        ) : null}
      </section>

      <section aria-label="Revenue competition">
        <h3>Competition</h3>
        {props.competition.length ? (
          <table>
            <caption>Comparable city hotels</caption>
            <thead>
              <tr>
                <th scope="col">Hotel</th>
                <th scope="col">Rooms</th>
                <th scope="col">Rate</th>
                <th scope="col">Occupancy</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {props.competition.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{translateKey(row.name)}</th>
                  <td>{row.rooms}</td>
                  <td>{formatDm(row.rateMinor, locale)}</td>
                  <td>{formatBasisPoints(row.occupancyBasisPoints, locale)}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No comparable competitors are trading.</p>
        )}
      </section>
    </section>
  );
}
