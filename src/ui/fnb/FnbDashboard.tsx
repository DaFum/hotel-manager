import type { FnbOutletId, FnbState } from "../../game/fnb/fnbState";
import { utilizationBp } from "../../game/facilities/capacity";
import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

const OUTLET_LABEL_KEYS: Record<FnbOutletId, string> = {
  breakfastRoom: "fnb.outlets.breakfastRoom",
  bar: "fnb.outlets.bar",
  roomService: "fnb.outlets.roomService",
  restaurant: "fnb.outlets.restaurant",
};

export function FnbDashboard({
  fnb,
  locale = "en-GB",
}: {
  fnb: FnbState;
  locale?: GameLocale;
}) {
  const title = translateGame(locale, "fnb.title");
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
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
          const label = translateGame(locale, OUTLET_LABEL_KEYS[outlet.id]);
          return (
            <li key={outlet.id} aria-label={label}>
              <h3>{label}</h3>
              <p>
                {translateGame(locale, "fnb.metrics.seats", {
                  seats: outlet.seats,
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.covers", {
                  served: outlet.served,
                  demand: outlet.demand,
                  capacity: outlet.capacity,
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.waitlisted", {
                  waitlisted: outlet.waitlisted,
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.serviceLoad", {
                  load: formatBasisPoints(serviceLoadBp, locale),
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.kitchenLoad", {
                  load: formatBasisPoints(kitchenLoadBp, locale),
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.averageWait", {
                  minutes: outlet.averageWaitMinutes,
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.waste", {
                  covers: outlet.wastedCovers,
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.foodCost", {
                  cost: formatDm(outlet.ingredientExpenseMinor, locale),
                })}
              </p>
              <p>
                {translateGame(locale, "fnb.metrics.limitedBy", {
                  cause: translateGame(locale, outlet.cause),
                })}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
