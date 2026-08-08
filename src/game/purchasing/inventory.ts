export interface SupplierOrder {
  supplierId: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  dueAtMinutes: number;
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
  if (!Number.isInteger(x.quantity) || x.quantity <= 0)
    throw new Error("invalid quantity");
  const cost = x.quantity * x.unitPriceMinor;
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
  if (now < o.dueAtMinutes) throw new Error("not due");
  return { ...stock, [o.sku]: (stock[o.sku] ?? 0) + o.quantity };
}

export function consume(stock: Record<string, number>, sku: string, q: number) {
  if ((stock[sku] ?? 0) < q) throw new Error("stockout");
  return { ...stock, [sku]: stock[sku] - q };
}
