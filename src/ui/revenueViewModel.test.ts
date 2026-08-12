import { describe, expect, it } from "vitest";
import {
  createInitialGameState,
  type ReservationRecord,
} from "../game/simulation/initialState";
import { setRate } from "../game/revenue/rates";
import {
  bookingsOnTheBooksRows,
  channelMixRows,
  overbookingExposureRow,
  pickupRows,
  occupancyDriverRows,
  rateGridRows,
} from "./revenueViewModel";

function booking(
  overrides: Partial<ReservationRecord> = {},
): ReservationRecord {
  return {
    id: "booking.1",
    roomsRequested: 2,
    rateMinor: 10_000,
    status: "confirmed",
    channel: "directPhone",
    partySize: 2,
    segmentId: "segment.business",
    category: "single",
    arrivalDateKey: "1991-01-02",
    nights: 2,
    terms: { guaranteed: true, freeCancellationDays: 1, lateChargeBp: 10_000 },
    history: [{ status: "confirmed", atMinutes: 0 }],
    bookingDateKey: "1991-01-01",
    ratePlanId: "flexible",
    commissionBp: 0,
    depositMinor: 0,
    specialRequirements: [],
    ...overrides,
  };
}

describe("revenue view model", () => {
  it("projects rates and multi-night bookings onto one bounded window", () => {
    const state = createInitialGameState(1);
    state.rates = setRate(state.rates, "1991-01-01", "single", 11_000);
    state.reservations = [booking()];
    expect(
      rateGridRows(state).find((row) => row.dateKey === "1991-01-01")!.cells[0],
    ).toMatchObject({
      category: "single",
      rateMinor: 11_000,
    });
    expect(
      bookingsOnTheBooksRows(state).find((row) => row.dateKey === "1991-01-02")!
        .confirmedRooms,
    ).toBe(2);
    expect(
      bookingsOnTheBooksRows(state).find((row) => row.dateKey === "1991-01-04")!
        .confirmedRooms,
    ).toBe(0);
  });

  it("aggregates channel share, recent pickup, and exposure", () => {
    const state = createInitialGameState(1);
    state.reservations = [
      booking(),
      booking({
        id: "booking.2",
        channel: "ota",
        roomsRequested: 200,
        rateMinor: 20_000,
      }),
    ];
    state.revenuePolicy.overbookingLimitRooms = 2;
    expect(channelMixRows(state)).toHaveLength(2);
    expect(
      channelMixRows(state).find((row) => row.channel === "ota"),
    ).toMatchObject({ rooms: 200, revenueMinor: 8_000_000 });
    expect(
      pickupRows(state).find((row) => row.dateKey === "1991-01-02")!.rooms,
    ).toBe(202);
    const exposure = overbookingExposureRow(state);
    expect(exposure).toMatchObject({ limitRooms: 2 });
    expect(
      exposure.dates.find((row) => row.dateKey === "1991-01-02")!.exposureRooms,
    ).toBe(Math.max(0, 202 - state.hotel.rooms.length));
    state.cityMarket.occupancyAttribution.contributors = [
      { factor: "eventUplift", weight: 100 },
      { factor: "businessDemandChange", weight: -500 },
    ];
    expect(occupancyDriverRows(state)[0].factor).toBe("businessDemandChange");
  });
});
