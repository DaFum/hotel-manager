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
    // Only the declared SupplierOrder fields; leadMinutes is an input, and the
    // order travels into the save file.
    order: {
      supplierId: x.supplierId,
      sku: x.sku,
      quantity: x.quantity,
      unitPriceMinor: x.unitPriceMinor,
      dueAtMinutes: state.nowMinutes + x.leadMinutes,
    } satisfies SupplierOrder,
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

/**
 * Linen is the one consumable two systems compete for: housekeeping needs it
 * to make a room up, and the laundry needs the same pile back. Reserving is
 * read-only on purpose — it answers "is there enough" without moving stock,
 * so a rejected turnaround cannot leak pieces.
 */
export function reserveLinen(
  stock: Record<string, number>,
  pieces: number,
  sku = "linen-piece",
): { available: number } {
  assertNonNegativeCount(pieces, "pieces");
  const held = stock[sku] ?? 0;
  if (held < pieces) throw new Error(`insufficient linen: ${held} < ${pieces}`);
  return { available: held - pieces };
}

export function consume(stock: Record<string, number>, sku: string, q: number) {
  assertPositiveCount(q, "quantity");
  if ((stock[sku] ?? 0) < q) throw new Error("stockout");
  return { ...stock, [sku]: stock[sku] - q };
}
