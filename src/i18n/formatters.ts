const minorDigits: Record<string, number> = { JPY: 0, KRW: 0, KWD: 3, BHD: 3 };
export function formatMinorCurrency(
  minor: number,
  currency: string,
  locale: string,
): string {
  const digits = minorDigits[currency] ?? 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 10 ** digits);
}
export function formatPercentBasisPoints(bp: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(bp / 10_000);
}
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
export function formatGameDate(iso: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])));
}
