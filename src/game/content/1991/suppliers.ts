export interface Supplier {
  id: string;
  name: string;
  sku: string;
  unitPriceMinor: number;
  leadMinutes: number;
  minimumQuantity: number;
}

export const SUPPLIERS: readonly Supplier[] = [
  {
    id: "supplier.hygiene-mainz",
    name: "Hygiene Mainz",
    sku: "cleaning-unit",
    unitPriceMinor: 500,
    leadMinutes: 1440,
    minimumQuantity: 50,
  },
  {
    id: "supplier.baecker-sachs",
    name: "Bäckerei Sachs",
    sku: "breakfast-portion",
    unitPriceMinor: 450,
    leadMinutes: 720,
    minimumQuantity: 60,
  },
  {
    id: "supplier.waeschehaus-offenbach",
    name: "Wäschehaus Offenbach",
    sku: "linen-piece",
    unitPriceMinor: 900,
    leadMinutes: 2880,
    minimumQuantity: 100,
  },
];

export function supplierForSku(sku: string): Supplier {
  const found = SUPPLIERS.find((s) => s.sku === sku);
  if (!found) throw new Error(`no supplier for ${sku}`);
  return found;
}
