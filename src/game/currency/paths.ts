export interface CommonCurrencyPath {
  id: string;
  memberCurrencies: readonly string[];
  coordinationBp: number;
  tradeIntegrationBp: number;
  publicSupportBp: number;
  active: boolean;
}
export function advanceCommonCurrency(
  path: CommonCurrencyPath,
): CommonCurrencyPath {
  for (const [label, value] of [
    ["coordination", path.coordinationBp],
    ["trade integration", path.tradeIntegrationBp],
    ["public support", path.publicSupportBp],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0 || value > 10_000)
      throw new Error(`${label} must be 0..10000 basis points`);
  const qualifies =
    path.coordinationBp >= 6500 &&
    path.tradeIntegrationBp >= 7000 &&
    path.publicSupportBp >= 5000;
  return { ...path, active: path.active || qualifies };
}
export function settlementCurrency(
  localCurrency: string,
  path: CommonCurrencyPath,
  commonCurrency: string,
): string {
  return path.active && path.memberCurrencies.includes(localCurrency)
    ? commonCurrency
    : localCurrency;
}
