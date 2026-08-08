/** Calendar days are ISO `YYYY-MM-DD` keys; the sim never reads wall clock time. */
export const MINUTES_PER_DAY = 1440;

export interface CalendarPosition {
  dateKey: string;
  minuteOfDay: number;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateKey(dateKey: string): number {
  if (!DATE_KEY.test(dateKey)) throw new Error("invalid date key");
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  // Date.UTC rolls impossible components over ("1991-02-31" becomes March),
  // so the only safe check is that the value formats back to the same key.
  if (Number.isNaN(utc) || formatDateKey(utc) !== dateKey)
    throw new Error("invalid date key");
  return utc;
}

export function formatDateKey(utcMillis: number): string {
  return new Date(utcMillis).toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new Error("invalid day offset");
  return formatDateKey(parseDateKey(dateKey) + days * 86_400_000);
}

export function nextDateKey(dateKey: string): string {
  return addDays(dateKey, 1);
}

export function daysInMonth(dateKey: string): number {
  const [y, m] = dateKey.split("-").map(Number);
  return new Date(
    Date.UTC(m === 12 ? y + 1 : y, m % 12, 1) - 86_400_000,
  ).getUTCDate();
}

/** 0 is Monday, matching how the slice schedules staff shifts. */
export function dayOfWeek(dateKey: string): number {
  return (new Date(parseDateKey(dateKey)).getUTCDay() + 6) % 7;
}
