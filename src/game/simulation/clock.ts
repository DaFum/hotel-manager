import {
  MINUTES_PER_DAY,
  nextDateKey,
  type CalendarPosition,
} from "../domain/calendar";

/** The authoritative simulation quantum: five simulated minutes per step. */
export const QUANTUM_MINUTES = 5;

export function advanceClock(
  position: CalendarPosition,
  minutes: number = QUANTUM_MINUTES,
): CalendarPosition {
  if (!Number.isSafeInteger(minutes) || minutes < 0)
    throw new Error("invalid minute delta");
  let { dateKey, minuteOfDay } = position;
  minuteOfDay += minutes;
  while (minuteOfDay >= MINUTES_PER_DAY) {
    minuteOfDay -= MINUTES_PER_DAY;
    dateKey = nextDateKey(dateKey);
  }
  return { dateKey, minuteOfDay };
}

export function absoluteMinutes(
  position: CalendarPosition,
  epochDayIndex: number,
): number {
  return epochDayIndex * MINUTES_PER_DAY + position.minuteOfDay;
}
