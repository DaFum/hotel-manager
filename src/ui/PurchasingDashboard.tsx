export function PurchasingDashboard(props: {
  stock: Record<string, number>;
  onOrder: (sku: string) => void;
}) {
  const skus = Object.keys(props.stock).sort();
  return (
    <section aria-label="Purchasing">
      <h2>Purchasing</h2>
      <ul>
        {skus.map((sku) => (
          <li key={sku}>
            {sku}: {props.stock[sku]}
            <button
              type="button"
              aria-label={`Order ${sku}`}
              onClick={() => props.onOrder(sku)}
            >
              Order
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
