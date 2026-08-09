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
  const numerator = BigInt(amountMinor) * BigInt(rateBasis);
  const divisor = 10_000n;
  const absolute = numerator < 0n ? -numerator : numerator;
  const quotient = absolute / divisor;
  const remainder = absolute % divisor;
  const roundedAbsolute =
    quotient +
    (numerator >= 0n
      ? remainder * 2n >= divisor
        ? 1n
        : 0n
      : remainder * 2n > divisor
        ? 1n
        : 0n);
  const convertedBigInt = numerator < 0n ? -roundedAbsolute : roundedAbsolute;
  const converted = Number(convertedBigInt);
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
  if (direct) {
    if (!Number.isSafeInteger(direct.rateBasis) || direct.rateBasis <= 0)
      throw new Error(`missing exchange rate ${from}/${to}`);
    return direct.rateBasis;
  }
  const inverse = rates.find((r) => r.from === to && r.to === from);
  if (
    !inverse ||
    !Number.isSafeInteger(inverse.rateBasis) ||
    inverse.rateBasis <= 0
  )
    throw new Error(`missing exchange rate ${from}/${to}`);
  return Math.round(100_000_000 / inverse.rateBasis);
}
