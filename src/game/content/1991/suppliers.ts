import { CORE_CONTENT_REGISTRY } from "../corePack";
export interface Supplier {
  id: string;
  name: string;
  sku: string;
  unitPriceMinor: number;
  leadMinutes: number;
  minimumQuantity: number;
  paymentTermsDays: number;
}
export const SUPPLIERS: readonly Supplier[] = [
  ...CORE_CONTENT_REGISTRY.allByKind("supplier"),
]
  .sort((a, b) => a.simulationOrder - b.simulationOrder)
  .map((entry) => ({
    id: entry.id,
    name: entry.name,
    sku: entry.sku,
    unitPriceMinor: entry.unitCostMinor,
    leadMinutes: entry.leadTimeMinutes,
    minimumQuantity: entry.minimumQuantity,
    paymentTermsDays: entry.paymentTermsDays,
  }));
export function supplierForSku(sku: string): Supplier {
  const found = SUPPLIERS.find((supplier) => supplier.sku === sku);
  if (!found) throw new Error(`no supplier for ${sku}`);
  return found;
}
