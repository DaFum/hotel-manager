import type { FnbOutletId, FnbState } from "../../game/fnb/fnbState";
import { utilizationBp } from "../../game/facilities/capacity";
import { formatBasisPoints, formatDm } from "../money";
import { translateKey } from "../localization";

const OUTLET_LABELS: Record<FnbOutletId, string> = {
  breakfastRoom: "Breakfast room",
  bar: "Bar",
  roomService: "Room service",
  restaurant: "Restaurant",
};

export function FnbDashboard({ fnb }: { fnb: FnbState }) {
  return (
    <section aria-label="Food and beverage">
      <h2>Food and beverage</h2>
      <ul>
        {fnb.outlets.map((outlet) => {
          const serviceLoadBp = utilizationBp(
            outlet.demand,
            outlet.serviceThroughput,
          );
          const kitchenLoadBp = utilizationBp(
            outlet.demand,
            outlet.kitchenThroughput,
          );
          return (
            <li key={outlet.id} aria-label={OUTLET_LABELS[outlet.id]}>
              <h3>{OUTLET_LABELS[outlet.id]}</h3>
              <p>Seats: {outlet.seats}</p>
              <p>
                Covers: {outlet.served}/{outlet.demand} (capacity{" "}
                {outlet.capacity})
              </p>
              <p>Waitlisted: {outlet.waitlisted}</p>
              <p>Service load: {formatBasisPoints(serviceLoadBp)}</p>
              <p>Kitchen load: {formatBasisPoints(kitchenLoadBp)}</p>
              <p>Average wait: {outlet.averageWaitMinutes} minutes</p>
              <p>Waste: {outlet.wastedCovers} covers</p>
              <p>Food cost: {formatDm(outlet.ingredientExpenseMinor)}</p>
              <p>Limited by: {translateKey(outlet.cause)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
