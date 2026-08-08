import { describe, expect, it } from "vitest";
import { reserve, cancel, markNoShow, canWalkIn } from "./bookingEngine";

describe("booking engine", () => {
  it("reserves multiple room nights only inside inventory", () => {
    const b = reserve(
      { availableRooms: 5 },
      { id: "b1", roomsRequested: 2, rateMinor: 9000, willingnessMinor: 10000 },
    );
    expect(b.roomsRequested).toBe(2);
    expect(b.status).toBe("confirmed");
  });

  it("rejects a rate above guest willingness to pay", () => {
    expect(() =>
      reserve(
        { availableRooms: 5 },
        {
          id: "b2",
          roomsRequested: 1,
          rateMinor: 12000,
          willingnessMinor: 10000,
        },
      ),
    ).toThrow(/price/);
  });

  it("never oversells the remaining inventory", () => {
    expect(() =>
      reserve(
        { availableRooms: 1 },
        {
          id: "b3",
          roomsRequested: 2,
          rateMinor: 9000,
          willingnessMinor: 10000,
        },
      ),
    ).toThrow(/inventory/);
  });

  it("releases a confirmed booking on cancellation", () => {
    expect(
      cancel({
        id: "b1",
        roomsRequested: 2,
        rateMinor: 9000,
        status: "confirmed",
      }).status,
    ).toBe("cancelled");
  });

  it("cancels only confirmed bookings", () => {
    expect(() =>
      cancel({
        id: "b1",
        roomsRequested: 2,
        rateMinor: 9000,
        status: "cancelled",
      }),
    ).toThrow(/cancellable/);
  });

  it("marks an unarrived confirmed booking as a no show", () => {
    expect(
      markNoShow({
        id: "b1",
        roomsRequested: 1,
        rateMinor: 9000,
        status: "confirmed",
      }).status,
    ).toBe("noShow");
  });

  it("allows walk in only with clean same day inventory", () => {
    expect(canWalkIn({ cleanRooms: 1, confirmedArrivals: 1 })).toBe(false);
    expect(canWalkIn({ cleanRooms: 2, confirmedArrivals: 1 })).toBe(true);
  });
});
