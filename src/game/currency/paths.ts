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
