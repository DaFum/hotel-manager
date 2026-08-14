import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import {
  createInitialGameState,
  type GameState,
  type ReservationRecord,
} from "../simulation/initialState";
import { cancel, holdsRoomOn, markNoShow, stayDates } from "./bookingEngine";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { balanceMinor } from "../finance/ledger";
import { QUANTUM_MINUTES } from "../simulation/clock";
import type { DomainEvent } from "../domain/events";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function reservation(
  overrides: Partial<ReservationRecord> = {},
): ReservationRecord {
  return {
    id: "booking.test.1",
    roomsRequested: 1,
    rateMinor: 15_000,
    status: "confirmed",
    channel: "directPhone",
    partySize: 2,
    segmentId: "segment.leisure",
    category: "double",
    arrivalDateKey: "1991-01-01",
    nights: 2,
    terms: { guaranteed: true, freeCancellationDays: 1, lateChargeBp: 10000 },
    history: [{ status: "confirmed", atMinutes: 0 }],
    bookingDateKey: "1990-12-20",
    ratePlanId: "flexible",
    commissionBp: 0,
    depositMinor: 0,
    specialRequirements: [],
    ...overrides,
  };
}

/** A house with a known set of bookings on the books and nothing else. */
function houseWith(
  bookings: ReservationRecord[],
  edit: (state: GameState) => void = () => {},
): GameSimulation {
  const state = createInitialGameState(31);
  state.reservations = bookings;
  edit(state);
  const s = new GameSimulation(state);
  s.refreshDerivedState();
  s.takeDomainEvents();
  return s;
}

function runDays(s: GameSimulation, days: number): DomainEvent[] {
  const collected: DomainEvent[] = [];
  for (let day = 0; day < days; day++) {
    for (let q = 0; q < QUANTA_PER_DAY; q++) s.advanceQuantum();
    collected.push(...s.takeDomainEvents());
  }
  return collected;
}

const doublesFree = (s: GameSimulation, dateKey: string) =>
  s.state.hotel.rooms.filter((r) => r.category === "double").length -
  s.state.reservations
    .filter((b) => b.category === "double" && holdsRoomOn(b, dateKey))
    .reduce((n, b) => n + b.roomsRequested, 0);

describe("booking lifecycle", () => {
  it("retains the full slice context of a confirmed booking", () => {
    const s = houseWith([reservation()]);
    const booking = s.state.reservations[0];

    // Everything an inventory decision or an explanation later needs is on
    // the booking itself, not reconstructed from what it left behind.
    expect(booking).toMatchObject({
      roomsRequested: 1,
      rateMinor: 15_000,
      channel: "directPhone",
      partySize: 2,
      segmentId: "segment.leisure",
      category: "double",
      arrivalDateKey: "1991-01-01",
      nights: 2,
      status: "confirmed",
    });
    expect(booking.terms).toEqual({
      guaranteed: true,
      freeCancellationDays: 1,
      lateChargeBp: 10000,
    });
    expect(booking.history).toEqual([{ status: "confirmed", atMinutes: 0 }]);
  });

  it("checks inventory across every date of a multi-night stay", () => {
    const s = houseWith([
      reservation({ id: "b.long", roomsRequested: 3, nights: 3 }),
    ]);

    // The rooms are held on all three nights, not merely on the arrival day.
    for (const dateKey of stayDates("1991-01-01", 3))
      expect(doublesFree(s, dateKey), dateKey).toBe(
        s.state.hotel.rooms.filter((r) => r.category === "double").length - 3,
      );
    // And released on the departure day, which is not a night.
    expect(doublesFree(s, "1991-01-04")).toBe(
      s.state.hotel.rooms.filter((r) => r.category === "double").length,
    );
  });

  it("takes every room a party booked, or none of them", () => {
    const s = houseWith([reservation({ id: "b.party", roomsRequested: 3 })]);

    runDays(s, 1);

    const mine = s.state.stays.filter((x) => x.bookingId === "b.party");
    // All three rooms, or the party would still be holding two out of sale
    // for the whole stay without ever being billed for them.
    expect(mine).toHaveLength(3);
    expect(new Set(mine.map((x) => x.roomId)).size).toBe(3);
    for (const stay of mine)
      expect(s.state.hotel.rooms.find((r) => r.id === stay.roomId)!.state).toBe(
        "Occupied",
      );
  });

  it("keeps a party waiting when the house cannot seat all its rooms", () => {
    const doubles = createInitialGameState(31).hotel.rooms.filter(
      (r) => r.category === "double",
    ).length;
    const s = houseWith([
      reservation({ id: "b.toobig", roomsRequested: doubles + 1 }),
    ]);

    runDays(s, 1);

    expect(s.state.stays.some((x) => x.bookingId === "b.toobig")).toBe(false);
    expect(s.state.reservations.find((b) => b.id === "b.toobig")?.status).toBe(
      "walked",
    );
  });

  it("releases exactly the held inventory on cancellation and no-show", () => {
    const s = houseWith([
      reservation({ id: "b.cancel", roomsRequested: 2 }),
      reservation({ id: "b.noshow", roomsRequested: 3 }),
      reservation({ id: "b.stays", roomsRequested: 1 }),
    ]);
    const doubles = s.state.hotel.rooms.filter(
      (r) => r.category === "double",
    ).length;
    expect(doublesFree(s, "1991-01-01")).toBe(doubles - 6);

    // Released through the engine transitions the release path actually uses,
    // so the guard and the history append are exercised too.
    const cancelled = s.state.reservations.find((b) => b.id === "b.cancel")!;
    Object.assign(cancelled, cancel(cancelled, 10));
    expect(doublesFree(s, "1991-01-01")).toBe(doubles - 4);

    const noShow = s.state.reservations.find((b) => b.id === "b.noshow")!;
    Object.assign(noShow, markNoShow(noShow, 20));
    // Exactly what each was holding came back: no more, no less.
    expect(doublesFree(s, "1991-01-01")).toBe(doubles - 1);
  });

  it("assigns a clean room of the booked category in stable order", () => {
    const s = houseWith([
      reservation({ id: "b.first" }),
      reservation({ id: "b.second" }),
    ]);

    runDays(s, 1);
    // The city keeps booking too; these are the two this test put on the books.
    const stays = s.state.stays
      .filter((x) => x.bookingId.startsWith("b."))
      .sort((a, b) => a.bookingId.localeCompare(b.bookingId));
    expect(stays.map((x) => x.bookingId)).toEqual(["b.first", "b.second"]);
    // Lowest free room id of the booked category, every time.
    expect(stays[0].roomId < stays[1].roomId).toBe(true);
    for (const stay of stays) {
      const room = s.state.hotel.rooms.find((r) => r.id === stay.roomId)!;
      expect(room.category).toBe("double");
      expect(room.state).toBe("Occupied");
    }
  });

  it("posts nothing for a rejected service recovery", () => {
    // Twenty parties, nobody on the desk: they wait, they complain, and there
    // is no one present to authorise a gesture.
    const s = houseWith(
      Array.from({ length: 20 }, (_, i) =>
        reservation({ id: `b.${i}`, nights: 1 }),
      ),
      (state) => {
        state.staff = state.staff.filter((m) => m.role !== "reception");
      },
    );
    const ledgerBefore = s.state.finance.ledger.length;
    const satisfactionBefore = s.state.guestSatisfaction.score;

    const events = runDays(s, 1);

    expect(events.some((e) => e.payload.type === "COMPLAINT_RAISED")).toBe(
      true,
    );
    expect(
      events.some((e) => e.payload.type === "SERVICE_RECOVERY_APPLIED"),
    ).toBe(false);
    // A refused recovery costs nothing and buys nothing: no goodwill posting,
    // no ledger line for it, and the complaint's own hit still stands.
    expect(
      s.state.finance.ledger
        .slice(ledgerBefore)
        .some((e) => e.account === "serviceRecovery"),
    ).toBe(false);
    expect(s.state.guestSatisfaction.score).toBeLessThan(satisfactionBefore);
    const unresolvedAlert = s.state.alerts.find(
      (a) => a.title === "alert.complaint-unanswered.title",
    );
    expect(unresolvedAlert).toBeDefined();
    expect(unresolvedAlert?.cause).toBeDefined();
  });

  it("classifies no-show and late-cancellation fees as other revenue", () => {
    const s = houseWith([
      reservation({
        id: "b.noshow.fee",
        arrivalDateKey: "1991-01-01",
        nights: 1,
      }),
      reservation({
        id: "b.cancel.fee",
        arrivalDateKey: "1991-01-03",
        nights: 1,
      }),
    ]);
    s.state.calendar = { dateKey: "1991-01-02", minuteOfDay: 0 };
    const phases = s as unknown as {
      arrivalsDepartures(): void;
      runCancellations(): void;
      streams: { guests: { nextUint32(): number } };
    };

    phases.arrivalsDepartures();
    phases.streams.guests.nextUint32 = () => 0;
    phases.runCancellations();

    const fees = s.state.finance.ledger.filter((entry) =>
      /no-show|late cancellation/.test(entry.memo),
    );
    expect(fees).toHaveLength(2);
    expect(fees.every((entry) => entry.account === "otherRevenue")).toBe(true);
    expect(fees.reduce((total, entry) => total + entry.amountMinor, 0)).toBe(
      s.state.finance.month.otherRevenueMinor,
    );
  });

  it("runs one stay end to end as a single causal chain", () => {
    const s = houseWith([reservation({ id: "b.chain", nights: 1 })]);

    const events = runDays(s, 3);
    const booking = s.state.reservations.find((b) => b.id === "b.chain");

    // Confirmed, checked in, checked out — in that order, on the record.
    expect(booking?.history.map((h) => h.status)).toEqual([
      "confirmed",
      "checkedIn",
      "completed",
    ]);
    const mine = events.filter((e) => e.entities.includes("b.chain"));
    expect(mine.map((e) => e.payload.type)).toEqual([
      "GUEST_CHECKED_IN",
      "GUEST_CHECKED_OUT",
    ]);
    // Events never go backwards, and the stay's own times are ordered.
    expect(mine[0].sequence).toBeLessThan(mine[1].sequence);
    expect(mine[0].atMinutes).toBeLessThan(mine[1].atMinutes);

    // The night was billed, and cash still agrees with the ledger.
    const room = s.state.finance.ledger.filter(
      (e) => e.account === "roomRevenue",
    );
    expect(room.length).toBeGreaterThan(0);
    expect(s.state.finance.cashMinor).toBe(
      STARTER_HOTEL.startingCashMinor + balanceMinor(s.state.finance.ledger),
    );
    // Leaving turned the room over rather than silently freeing it for sale.
    // Read from the typed payload, not by position in `entities`.
    const checkedOut = events.find(
      (e) => e.payload.type === "GUEST_CHECKED_OUT",
    )!.payload as Extract<
      DomainEvent["payload"],
      { type: "GUEST_CHECKED_OUT" }
    >;
    const roomId = checkedOut.roomId;
    const turned = events.find(
      (e) =>
        e.payload.type === "ROOM_STATE_CHANGED" &&
        e.payload.roomId === roomId &&
        e.payload.to === "VacantDirty",
    );
    expect(turned).toBeTruthy();
  });
});
