import { formatBasisPoints, formatDm } from "../money";

export interface PortfolioHotelRow {
  id: string;
  name: string;
  occupancyBasisPoints: number;
  monthlyProfitMinor: number;
  warnings: number;
  managerName: string;
  /** The brand the house currently flies, if any. */
  brandName?: string;
  /** How the group holds it: owned, leased, managed or franchised. */
  operatingModel?: string;
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: answer "which of my houses needs me today?" before anything
 *   else, and give one keystroke to go and deal with it.
 * - Tone: a group operations sheet — every house on its own row, the way a
 *   regional director actually reads a portfolio, not a wall of equal cards.
 * - Constraints: DOM-only and keyboard-reachable; a warning count is written
 *   in words as well as shown, so no state depends on colour.
 * - Differentiator: profit, occupancy, flag and manager sit on one line, so
 *   the number and the person accountable for it are never separated.
 */
export function PortfolioDashboard(props: {
  hotels: readonly PortfolioHotelRow[];
  onOpenHotel: (id: string) => void;
}) {
  if (props.hotels.length === 0)
    return (
      <section aria-label="Hotel portfolio">
        <h2>Hotel portfolio</h2>
        <p>The group holds no hotels.</p>
      </section>
    );

  const totalProfitMinor = props.hotels.reduce(
    (sum, hotel) => sum + hotel.monthlyProfitMinor,
    0,
  );

  return (
    <section aria-label="Hotel portfolio">
      <h2>Hotel portfolio</h2>
      <p aria-label="Portfolio summary">
        {props.hotels.length} {props.hotels.length === 1 ? "hotel" : "hotels"},{" "}
        {formatDm(totalProfitMinor)} last published profit
      </p>
      {props.hotels.map((hotel) => (
        <article key={hotel.id} aria-label={hotel.name}>
          <h3>{hotel.name}</h3>
          <p>
            {Math.round(hotel.occupancyBasisPoints / 100)}% occupancy (
            {formatBasisPoints(hotel.occupancyBasisPoints)})
          </p>
          <p>{formatDm(hotel.monthlyProfitMinor)} last month</p>
          <p>
            {hotel.warnings} {hotel.warnings === 1 ? "warning" : "warnings"} -
            Manager: {hotel.managerName}
          </p>
          <p>
            {hotel.brandName ? `Flag: ${hotel.brandName}` : "Unbranded"}
            {hotel.operatingModel ? ` - held ${hotel.operatingModel}` : ""}
          </p>
          <button
            type="button"
            onClick={() => props.onOpenHotel(hotel.id)}
            aria-label={`Open ${hotel.name}`}
          >
            Open hotel
          </button>
        </article>
      ))}
    </section>
  );
}
