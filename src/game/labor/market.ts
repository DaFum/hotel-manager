/**
 * The city labour market. Hotels compete for the same workers, so an open post
 * is not free: it bids the wage the whole city has to pay. Competitors face
 * this market on exactly the same terms as the player.
 */

/** Tightest and loosest the market may get, in basis points of the base wage. */
export const MIN_PRESSURE_BP = 7500;
export const MAX_PRESSURE_BP = 15000;

/**
 * Wage pressure from the ratio of open posts to available workers. A city
 * short of staff pays over the base wage; a slack one pays under it, and both
 * ends are bounded so one extreme year cannot price labour out of the game.
 */
export function wagePressureBp(vacancyCount: number, workers: number): number {
  if (!Number.isSafeInteger(vacancyCount) || vacancyCount < 0)
    throw new Error("invalid vacancies");
  if (!Number.isSafeInteger(workers) || workers < 0)
    throw new Error("invalid workers");
  const ratio = vacancyCount / Math.max(1, workers);
  return Math.round(
    10000 *
      Math.min(
        MAX_PRESSURE_BP / 10000,
        Math.max(MIN_PRESSURE_BP / 10000, ratio),
      ),
  );
}

/** Open posts across every employer in the city; an overstaffed house adds none. */
export function vacancies(
  employers: readonly { posts: number; staffed: number }[],
): number {
  for (const employer of employers)
    for (const [label, value] of [
      ["posts", employer.posts],
      ["staffed", employer.staffed],
    ] as const)
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(`invalid employer ${label}`);
  return employers.reduce((n, e) => n + Math.max(0, e.posts - e.staffed), 0);
}

/** What one post actually costs this month, in whole Pfennig. */
export function marketWageMinor(
  baseMonthlyWageMinor: number,
  pressureBp: number,
): number {
  if (!Number.isSafeInteger(baseMonthlyWageMinor) || baseMonthlyWageMinor <= 0)
    throw new Error("invalid base wage");
  if (
    !Number.isSafeInteger(pressureBp) ||
    pressureBp < MIN_PRESSURE_BP ||
    pressureBp > MAX_PRESSURE_BP
  )
    throw new Error("invalid pressure");
  return Math.round((baseMonthlyWageMinor * pressureBp) / 10000);
}
