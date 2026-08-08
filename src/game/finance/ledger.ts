export type LedgerAccount =
  | "roomRevenue"
  | "breakfastRevenue"
  | "wages"
  | "supplies"
  | "maintenance"
  | "interest"
  | "capex";

/** Signed Pfennig: revenue is positive, expense is negative. */
export interface LedgerEntry {
  day: number;
  account: LedgerAccount | string;
  amountMinor: number;
  memo: string;
}

export function postEntry(
  ledger: readonly LedgerEntry[],
  entry: LedgerEntry,
): LedgerEntry[] {
  if (!Number.isInteger(entry.amountMinor))
    throw new Error("amount must be integer Pfennig");
  return [...ledger, entry];
}

export function balanceMinor(ledger: readonly LedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.amountMinor, 0);
}

export function totalForAccountMinor(
  ledger: readonly LedgerEntry[],
  account: string,
): number {
  return ledger
    .filter((e) => e.account === account)
    .reduce((sum, e) => sum + e.amountMinor, 0);
}
