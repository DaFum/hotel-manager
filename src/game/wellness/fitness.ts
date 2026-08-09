/** Square metres a gym needs per person before it feels like a corridor. */
export const SQM_PER_USER = 4;
/** Satisfaction a completely full gym gives up, in basis points. */
const CROWDING_BP = 4000;

/** The gym is limited by floor area or by stations, whichever runs out first. */
export function fitnessCapacity(i: {
  areaSqm: number;
  equipmentStations: number;
}): number {
  return Math.max(
    0,
    Math.min(
      Math.floor(Math.max(0, i.areaSqm) / SQM_PER_USER),
      Math.max(0, i.equipmentStations),
    ),
  );
}

/**
 * How the gym feels at a given load. A gym nobody can enter scores zero rather
 * than perfect: an unusable facility is not a satisfied guest.
 */
export function fitnessSatisfactionBp(users: number, capacity: number): number {
  if (capacity <= 0) return 0;
  const loadBp = Math.min(
    10000,
    Math.round((Math.max(0, users) * 10000) / capacity),
  );
  return Math.max(0, 10000 - Math.round((loadBp * CROWDING_BP) / 10000));
}
