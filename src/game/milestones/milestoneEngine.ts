import { assertCount, assertMinor } from "../domain/units";

/**
 * What the company has proved, read from state rather than from a mission
 * list. There is no chain and no order: a milestone is earned the moment the
 * facts say so, and 2026 is one more entry rather than an ending.
 */
export interface MilestoneFacts {
  /**
   * Operating profit for the financial year so far, not for one month. A
   * single good month is not a profitable year, and the caller is responsible
   * for accumulating and resetting this figure on the calendar year.
   */
  annualProfitMinor: number;
  hotelCount: number;
  year: number;
  achieved: readonly string[];
}

export function detectMilestones(input: MilestoneFacts): string[] {
  assertMinor(input.annualProfitMinor, "annual profit");
  assertCount(input.hotelCount, "hotel count");
  assertCount(input.year, "milestone year");
  const found: string[] = [];
  const add = (id: string, yes: boolean) => {
    if (yes && !input.achieved.includes(id)) found.push(id);
  };
  add("first-profitable-year", input.annualProfitMinor > 0);
  add("second-hotel", input.hotelCount >= 2);
  add("career-2026", input.year >= 2026);
  return found;
}
