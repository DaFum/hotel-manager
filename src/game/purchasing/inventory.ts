export interface SupplierOrder {
  supplierId: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  dueAtMinutes: number;
}

function assertPositiveCount(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`invalid ${label}`);
}

function assertNonNegativeCount(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label}`);
}

export function placeOrder(
  state: { cashMinor: number; nowMinutes: number },
  x: {
    supplierId: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    leadMinutes: number;
  },
) {
  assertPositiveCount(x.quantity, "quantity");
  assertNonNegativeCount(x.unitPriceMinor, "unit price");
  assertNonNegativeCount(x.leadMinutes, "lead time");
  const cost = x.quantity * x.unitPriceMinor;
  if (!Number.isSafeInteger(cost)) throw new Error("invalid order cost");
  if (cost > state.cashMinor) throw new Error("insufficient cash");
  return {
    cashMinor: state.cashMinor - cost,
    order: { ...x, dueAtMinutes: state.nowMinutes + x.leadMinutes },
  };
}

export function deliverOrder(
  stock: Record<string, number>,
  o: SupplierOrder,
  now: number,
) {
  assertPositiveCount(o.quantity, "quantity");
  if (now < o.dueAtMinutes) throw new Error("not due");
  return { ...stock, [o.sku]: (stock[o.sku] ?? 0) + o.quantity };
}

export function consume(stock: Record<string, number>, sku: string, q: number) {
  assertPositiveCount(q, "quantity");
  if ((stock[sku] ?? 0) < q) throw new Error("stockout");
  return { ...stock, [sku]: stock[sku] - q };
}
