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
  if (Number.isNaN(utc)) throw new Error("invalid date key");
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

/** 0 is Monday, matching how the slice schedules staff shifts. */
export function dayOfWeek(dateKey: string): number {
  return (new Date(parseDateKey(dateKey)).getUTCDay() + 6) % 7;
}
