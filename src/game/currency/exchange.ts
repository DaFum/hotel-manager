export interface ExchangeRate {
  from: string;
  to: string;
  rateBasis: number;
}
export function convertMinor(amountMinor: number, rateBasis: number): number {
  if (
    !Number.isSafeInteger(amountMinor) ||
    !Number.isSafeInteger(rateBasis) ||
    rateBasis < 0
  )
    throw new Error("integer inputs required");
  const converted = Math.round((amountMinor * rateBasis) / 10_000);
  if (!Number.isSafeInteger(converted))
    throw new Error("currency conversion overflow");
  return converted;
}
export function exchangeRate(
  rates: readonly ExchangeRate[],
  from: string,
  to: string,
): number {
  if (from === to) return 10_000;
  const direct = rates.find((r) => r.from === from && r.to === to);
  if (direct) return direct.rateBasis;
  const inverse = rates.find((r) => r.from === to && r.to === from);
  if (!inverse || inverse.rateBasis === 0)
    throw new Error(`missing exchange rate ${from}/${to}`);
  return Math.round(100_000_000 / inverse.rateBasis);
}
