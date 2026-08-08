/** Pfennig are the only stored unit; formatting happens at the very edge. */
export function formatDm(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")} DM`;
}

export function formatBasisPoints(bp: number): string {
  return `${(bp / 100).toFixed(1)}%`;
}
