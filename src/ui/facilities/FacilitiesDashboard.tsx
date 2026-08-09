import { utilizationBp } from "../../game/facilities/capacity";
import { formatBasisPoints } from "../money";

export interface FacilityRow {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  /** The constraint that is actually binding, in the player's words. */
  cause: string;
}

/**
 * The operations board for every serviced area. It answers one question —
 * where is the house short today, and of what — so the cause is on the row
 * itself rather than hidden behind a colour.
 */
export function FacilitiesDashboard({
  rows,
}: {
  rows: readonly FacilityRow[];
}) {
  if (rows.length === 0)
    return (
      <section aria-label="Facilities">
        <h2>Facilities</h2>
        <p>No facilities are running yet.</p>
      </section>
    );

  return (
    <section aria-label="Facilities">
      <h2>Facilities</h2>
      <ul>
        {rows.map((r) => {
          const loadBp = utilizationBp(
            Math.max(0, Math.round(r.demand)),
            Math.max(0, Math.round(r.capacity)),
          );
          const over = r.demand > r.capacity;
          return (
            <li key={r.id} aria-label={r.name}>
              <h3>{r.name}</h3>
              <p>
                {r.demand}/{r.capacity} ({formatBasisPoints(loadBp)})
                {over ? " — over capacity" : ""}
              </p>
              <p>Limited by: {r.cause}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
