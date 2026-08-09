import { describe, expect, it } from "vitest";
import {
  cancel,
  canWalkIn,
  markNoShow,
  reserve,
  stayDates,
} from "./bookingEngine";
import type {
  Booking,
  GuaranteeTerms,
  ReservationRequest,
} from "./bookingTypes";

const TERMS: GuaranteeTerms = {
  guaranteed: true,
  freeCancellationDays: 1,
  lateChargeBp: 10000,
};

/** The same number of rooms free on every date of the stay. */
const flat = (availableRooms: number) => ({
  availableRoomsOn: () => availableRooms,
});

const request = (
  overrides: Partial<ReservationRequest> = {},
): ReservationRequest => ({
  id: "b1",
  roomsRequested: 1,
  rateMinor: 9000,
  willingnessMinor: 10000,
  channel: "directPhone",
  partySize: 2,
  segmentId: "segment.leisure",
  category: "double",
  arrivalDateKey: "1991-03-10",
  nights: 2,
  terms: TERMS,
  atMinutes: 100,
  ...overrides,
});

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "b1",
  roomsRequested: 2,
  rateMinor: 9000,
  status: "confirmed",
  channel: "directPhone",
  partySize: 3,
  segmentId: "segment.leisure",
  category: "double",
  arrivalDateKey: "1991-03-10",
  nights: 2,
  terms: TERMS,
  history: [{ status: "confirmed", atMinutes: 0 }],
  ...overrides,
});

describe("booking engine", () => {
  it("reserves multiple room nights only inside inventory", () => {
    const b = reserve(flat(5), request({ roomsRequested: 2 }));
    expect(b.roomsRequested).toBe(2);
    expect(b.status).toBe("confirmed");
    expect(b.history).toEqual([{ status: "confirmed", atMinutes: 100 }]);
  });

  it("names every date a stay occupies a room", () => {
    expect(stayDates("1991-03-10", 3)).toEqual([
      "1991-03-10",
      "1991-03-11",
      "1991-03-12",
    ]);
    // The departure day is not a night, so it is not one of them.
    expect(stayDates("1991-03-10", 1)).toEqual(["1991-03-10"]);
    expect(() => stayDates("1991-03-10", 0)).toThrow(/at least one night/);
  });

  it("rejects a rate above guest willingness to pay", () => {
    expect(() =>
      reserve(flat(5), request({ rateMinor: 12000, willingnessMinor: 10000 })),
    ).toThrow(/price/);
  });

  it("never oversells the remaining inventory", () => {
    expect(() => reserve(flat(1), request({ roomsRequested: 2 }))).toThrow(
      /inventory/,
    );
  });

  it("refuses a stay whose later nights are full", () => {
    // Arrival night is free, the second is not: the booking is still refused,
    // and it says which night could not be honoured.
    const inventory = {
      availableRoomsOn: (dateKey: string) => (dateKey === "1991-03-10" ? 3 : 0),
    };
    expect(() => reserve(inventory, request({ nights: 2 }))).toThrow(
      /1991-03-11/,
    );
    expect(reserve(inventory, request({ nights: 1 })).status).toBe("confirmed");
  });

  it("rejects monetary inputs that are not whole non-negative Pfennig", () => {
    for (const rateMinor of [-1, 99.9, Number.NaN, Number.MAX_SAFE_INTEGER + 2])
      expect(() =>
        reserve(flat(5), request({ rateMinor, willingnessMinor: 20000 })),
      ).toThrow(/rate/);
    for (const willingnessMinor of [-1, 0.5, Number.NaN])
      expect(() => reserve(flat(5), request({ willingnessMinor }))).toThrow(
        /willingness/,
      );
  });

  it("releases a confirmed booking on cancellation", () => {
    const cancelled = cancel(booking(), 500);
    expect(cancelled.status).toBe("cancelled");
    // The whole life of the reservation is on the record, in order.
    expect(cancelled.history.map((h) => h.status)).toEqual([
      "confirmed",
      "cancelled",
    ]);
    expect(cancelled.history.at(-1)?.atMinutes).toBe(500);
  });

  it("cancels only confirmed bookings", () => {
    expect(() => cancel(booking({ status: "cancelled" }), 500)).toThrow(
      /cannot become cancelled/,
    );
  });

  it("marks an unarrived confirmed booking as a no show", () => {
    expect(markNoShow(booking(), 700).status).toBe("noShow");
    expect(() => markNoShow(booking({ status: "checkedIn" }), 700)).toThrow(
      /cannot become noShow/,
    );
  });

  it("allows walk in only with clean same day inventory", () => {
    expect(canWalkIn({ cleanRooms: 1, confirmedArrivals: 1 })).toBe(false);
    expect(canWalkIn({ cleanRooms: 2, confirmedArrivals: 1 })).toBe(true);
  });
});
