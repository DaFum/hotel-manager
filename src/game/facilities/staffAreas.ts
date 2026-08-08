/** Changing room, break room and locker space one member of staff needs. */
export const STAFF_AREA_SQM_PER_HEAD = 2;

/** How many people the back-of-house area can actually take at once. */
export function staffAreaCapacity(i: { areaSqm: number }): number {
  return Math.max(
    0,
    Math.floor(Math.max(0, i.areaSqm) / STAFF_AREA_SQM_PER_HEAD),
  );
}

/**
 * Overcrowded back-of-house shows up as lost shift time before service even
 * starts, in basis points of the crowding over capacity.
 */
export function changingRoomPressureBp(
  headcount: number,
  capacity: number,
): number {
  if (capacity <= 0) return headcount > 0 ? 10000 : 0;
  return Math.max(0, Math.round(((headcount - capacity) * 10000) / capacity));
}
