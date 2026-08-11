/** Pfennig are the only stored unit; formatting happens at the very edge. */
import type { GameLocale } from "../i18n";
import { formatMinorCurrency } from "../i18n/formatters";

/** Pfennig are the only stored unit; formatting happens at the very edge. */
export function formatDm(minor: number, locale: GameLocale = "de-DE"): string {
  if (locale !== "de-DE") return formatMinorCurrency(minor, "DEM", locale);
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")} DM`;
}

export function formatBasisPoints(
  bp: number,
  locale: GameLocale = "de-DE",
): string {
  if (locale !== "de-DE")
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(bp / 10000);
  return `${(bp / 100).toFixed(1)}%`;
}
