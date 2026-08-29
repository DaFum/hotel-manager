import { entityLabel } from "./entityNames";
import { useLocale } from "./localeContext";
import { translateGame } from "../i18n";

export function PurchasingDashboard(props: {
  stock: Record<string, number>;
  onOrder: (sku: string) => void;
}) {
  const locale = useLocale();
  const skus = Object.keys(props.stock).sort();
  return (
    <section aria-label={translateGame(locale, "panels.purchasing.title")}>
      <h2>{translateGame(locale, "panels.purchasing.title")}</h2>
      <ul>
        {skus.map((sku) => {
          const name = entityLabel(sku, locale);
          return (
            <li key={sku}>
              {translateGame(locale, "panels.purchasing.stock", {
                name,
                count: props.stock[sku],
              })}
              <button
                type="button"
                aria-label={translateGame(
                  locale,
                  "panels.purchasing.orderItem",
                  { name },
                )}
                onClick={() => props.onOrder(sku)}
              >
                {translateGame(locale, "panels.purchasing.order")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
