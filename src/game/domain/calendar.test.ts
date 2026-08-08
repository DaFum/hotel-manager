import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, daysInMonth, parseDateKey } from "./calendar";

describe("calendar", () => {
  it("rejects impossible dates instead of rolling them over", () => {
    expect(() => parseDateKey("1991-02-31")).toThrow(/invalid date key/);
    expect(() => parseDateKey("1991-13-01")).toThrow(/invalid date key/);
    expect(() => parseDateKey("91-01-01")).toThrow(/invalid date key/);
    expect(parseDateKey("1991-01-01")).toBe(Date.UTC(1991, 0, 1));
  });

  it("knows the length of each calendar month", () => {
    expect(daysInMonth("1991-01-15")).toBe(31);
    expect(daysInMonth("1991-02-01")).toBe(28);
    expect(daysInMonth("1992-02-01")).toBe(29);
    expect(daysInMonth("1991-12-31")).toBe(31);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("1991-01-31", 1)).toBe("1991-02-01");
    expect(addDays("1991-12-31", 1)).toBe("1992-01-01");
    expect(addDays("1991-01-01", -1)).toBe("1990-12-31");
  });

  it("counts Monday as the first day of the week", () => {
    expect(dayOfWeek("1991-01-01")).toBe(1);
  });
});
