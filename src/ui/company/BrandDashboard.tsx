import { formatBasisPoints, formatDm } from "../money";

export interface BrandRow {
  id: string;
  name: string;
  demandUpliftBasisPoints: number;
  monthlyProgrammeCostMinor: number;
  /** Hotel ids currently flying the flag. */
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

/**
 * Design intent (AGENTS §13)
 * - Purpose: turn a failed brand audit into a to-do list, not a verdict.
 * - Tone: an inspection report — the standard on the left, what the house
 *   actually did on the right, and a date by which it has to be put right.
 * - Constraints: every failure is a named, readable item; no score bar, no
 *   colour-only pass/fail.
 * - Differentiator: the flag's demand uplift is quoted next to its cost, so
 *   the player can see a brand as the trade it is rather than a reward.
 */
export function BrandDashboard(props: {
  brands: readonly BrandRow[];
  audits: readonly BrandAuditRow[];
  onAssignBrand: (hotelId: string, brandId: string) => void;
  hotels: readonly { id: string; name: string }[];
}) {
  return (
    <section aria-label="Brands">
      <h2>Brands</h2>
      <ul>
        {props.brands.map((brand) => (
          <li key={brand.id}>
            {brand.name}: {formatBasisPoints(brand.demandUpliftBasisPoints)}{" "}
            demand uplift for {formatDm(brand.monthlyProgrammeCostMinor)} a
            month per house, flown by {brand.hotelIds.length}{" "}
            {brand.hotelIds.length === 1 ? "hotel" : "hotels"}
          </li>
        ))}
      </ul>

      <h3>Latest audits</h3>
      {props.audits.length === 0 ? (
        <p>No house has been audited yet.</p>
      ) : (
        <ul>
          {props.audits.map((audit) => (
            <li key={`${audit.hotelId}.${audit.dateKey}`}>
              {audit.hotelName} on {audit.dateKey}:{" "}
              {audit.compliant
                ? "meets every standard"
                : `fails ${audit.failures.join(", ")}`}
              {audit.remediationDueDateKey
                ? ` - put right by ${audit.remediationDueDateKey}`
                : ""}
            </li>
          ))}
        </ul>
      )}

      <h3>Fly a flag</h3>
      {props.hotels.map((hotel) => (
        <p key={hotel.id}>
          {hotel.name}:{" "}
          {props.brands.map((brand) => (
            <button
              type="button"
              key={brand.id}
              onClick={() => props.onAssignBrand(hotel.id, brand.id)}
              aria-label={`Fly ${brand.name} over ${hotel.name}`}
            >
              {brand.name}
            </button>
          ))}
        </p>
      ))}
    </section>
  );
}
