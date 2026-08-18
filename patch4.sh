cat << 'INNER' >> src/game/finance/statements.ts

export function taxChargeMinor(
  preTaxBaseMinor: number,
  rateBasisPoints: number,
): number {
  if (preTaxBaseMinor <= 0) return 0;
  if (!Number.isSafeInteger(rateBasisPoints) || rateBasisPoints < 0)
    throw new Error("invalid tax rate");
  const quotient = Math.trunc(preTaxBaseMinor / 10_000);
  const remainder = preTaxBaseMinor % 10_000;
  return quotient * rateBasisPoints + Math.trunc((remainder * rateBasisPoints) / 10_000);
}
INNER
