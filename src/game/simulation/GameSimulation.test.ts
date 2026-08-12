import { describe, expect, it } from "vitest";
import { GameSimulation, PHASE_ORDER } from "./GameSimulation";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import { createInitialGameState, type GameState } from "./initialState";
import { SERVICE_INTERVAL_MINUTES } from "../engineering/policy";
import { reserve } from "../bookings/bookingEngine";
import { startRenovation } from "../building/renovations";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function runQuanta(sim: GameSimulation, quanta: number) {
  for (let i = 0; i < quanta; i++) sim.advanceQuantum();
}

describe("simulation order", () => {
  it("credits separate bookings to one persistent commercial guest", () => {
    const sim = new GameSimulation(createInitialGameState(3));
    const booking = (id: string) =>
      reserve(
        { availableRoomsOn: () => 1 },
        {
          id,
          guestId: "guest.returning.1",
          roomsRequested: 1,
          rateMinor: 10_000,
          willingnessMinor: 10_000,
          channel: "directPhone",
          partySize: 1,
          segmentId: "segment.leisure",
          category: "single",
          arrivalDateKey: "1991-01-01",
          nights: 1,
          terms: {
            guaranteed: true,
            freeCancellationDays: 1,
            lateChargeBp: 10_000,
          },
          atMinutes: 0,
        },
      );
    sim.state.reservations = [
      booking("booking.return.1"),
      booking("booking.return.2"),
    ];
    runQuanta(sim, QUANTA_PER_DAY);
    expect(sim.state.commercial.crm.profiles).toMatchObject([
      {
        guestId: "guest.returning.1",
        stayHistory: ["booking.return.1", "booking.return.2"],
      },
    ]);
    expect(sim.state.commercial.loyalty.members).toHaveLength(1);
  });
  it("matches the MASTER deterministic phase contract exactly", () => {
    expect(PHASE_ORDER).toEqual([
      "commands",
      "time",
      "arrivalsDepartures",
      "roomState",
      "staffService",
      "facilityThroughput",
      "inventory",
      "maintenanceFailures",
      "satisfaction",
      "finance",
      "demandBookings",
      "events",
      "snapshot",
    ]);
  });

  it("advances the clock by one five minute quantum and rolls the day over", () => {
    expect(QUANTUM_MINUTES).toBe(5);
    expect(advanceClock({ dateKey: "1991-01-01", minuteOfDay: 0 })).toEqual({
      dateKey: "1991-01-01",
      minuteOfDay: 5,
    });
    expect(advanceClock({ dateKey: "1991-01-01", minuteOfDay: 1435 })).toEqual({
      dateKey: "1991-01-02",
      minuteOfDay: 0,
    });
  });

  it("drains queued commands and moves simulation time each quantum", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand({
      type: "SET_RATE",
      dateKey: "1991-01-02",
      category: "single",
      rateMinor: 9500,
    });
    sim.advanceQuantum();
    expect(sim.pendingCommandCount).toBe(0);
    expect(sim.snapshot().rates["1991-01-02/single"]).toBe(9500);
    expect(sim.snapshot().calendar).toEqual({
      dateKey: "1991-01-01",
      minuteOfDay: 5,
    });
  });

  it("produces snapshots that are detached from live state", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const snap = sim.snapshot();
    snap.hotel.rooms[0].cleanliness = 1;
    snap.finance.cashMinor = 0;
    sim.advanceQuantum();
    expect(snap.calendar.minuteOfDay).toBe(0);
    expect(sim.snapshot().hotel.rooms[0].cleanliness).toBe(100);
    expect(sim.snapshot().finance.cashMinor).toBeGreaterThan(0);
  });

  it("rejects states that violate cash or room invariants", () => {
    const state = createInitialGameState(42);
    expect(() => assertInvariants(state)).not.toThrow();
    expect(() =>
      assertInvariants({
        ...state,
        finance: { ...state.finance, cashMinor: -1 },
      }),
    ).toThrow(/cash/);
    expect(() =>
      assertInvariants({
        ...state,
        finance: { ...state.finance, cashMinor: 1.5 },
      }),
    ).toThrow(/cash/);
  });

  it("rejects impossible F&B operating records", () => {
    const state = createInitialGameState(42);
    state.fnb.outlets[0].stockLeft = -1;
    expect(() => assertInvariants(state)).toThrow(/F&B.*stock/i);

    state.fnb.outlets[0].stockLeft = 0;
    state.fnb.outlets[0].demand = 1;
    state.fnb.outlets[0].capacity = 1;
    state.fnb.outlets[0].served = 2;
    expect(() => assertInvariants(state)).toThrow(/F&B.*served/i);

    state.fnb.outlets[0].served = 1;
    state.fnb.outlets[0].serviceUtilizationBp = 1_000_001;
    expect(() => assertInvariants(state)).toThrow(/F&B.*utilization/i);
  });
});

describe("simulated operations", () => {
  it("does not settle a city month on the campaign's opening day", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    const before = sim.snapshot();
    runQuanta(sim, 600 / QUANTUM_MINUTES);
    const after = sim.snapshot();
    expect(after.competitors.map((c) => c.cashMinor)).toEqual(
      before.competitors.map((c) => c.cashMinor),
    );
    expect(after.competitors.map((c) => c.monthsSinceBuild)).toEqual(
      before.competitors.map((c) => c.monthsSinceBuild),
    );
    expect(after.rngState.economy).toBe(before.rngState.economy);
    expect(after.rngState.AI).toBe(before.rngState.AI);
  });

  it("books, checks in, and earns room revenue within the first week", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 7);
    const s = sim.snapshot();
    expect(s.reservations.length + s.stays.length).toBeGreaterThan(0);
    expect(s.stays.length).toBeGreaterThan(0);
    expect(s.finance.month.roomRevenueMinor).toBeGreaterThan(0);
    expect(s.metrics.adrMinor).toBeGreaterThan(0);
  });

  it("credits the city with the same player stay-nights as the hotel ledger", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 10);
    const s = sim.snapshot();
    const rivalRoomNights = s.competitors.reduce(
      (sum, competitor) => sum + competitor.soldRoomNights,
      0,
    );
    expect(s.cityMarket.soldRoomNights - rivalRoomNights).toBe(
      s.finance.month.soldRoomNights,
    );
  });

  it("produces a monthly close report once the month rolls over", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 32);
    const s = sim.snapshot();
    expect(s.calendar.dateKey.slice(0, 7)).toBe("1991-02");
    expect(s.lastMonthlyClose).not.toBeNull();
    expect(s.lastMonthlyClose!.revenueMinor).toBeGreaterThan(0);
    expect(s.lastMonthlyClose!.occupancyBasisPoints).toBeGreaterThan(0);
  });

  it("replays bit for bit from the same seed", () => {
    const a = new GameSimulation(createInitialGameState(424242));
    const b = new GameSimulation(createInitialGameState(424242));
    runQuanta(a, QUANTA_PER_DAY * 10);
    runQuanta(b, QUANTA_PER_DAY * 10);
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it("diverges for a different seed", () => {
    const a = new GameSimulation(createInitialGameState(1));
    const b = new GameSimulation(createInitialGameState(2));
    runQuanta(a, QUANTA_PER_DAY * 10);
    runQuanta(b, QUANTA_PER_DAY * 10);
    expect(a.snapshot()).not.toEqual(b.snapshot());
  });

  it("keeps cash whole and never lets the ledger drift from cash", () => {
    const initial = createInitialGameState(7);
    const openingCashMinor = initial.finance.cashMinor;
    const sim = new GameSimulation(initial);
    runQuanta(sim, QUANTA_PER_DAY * 14);
    const s = sim.snapshot();
    expect(Number.isSafeInteger(s.finance.cashMinor)).toBe(true);
    const ledgerNet = s.finance.ledger.reduce((n, e) => n + e.amountMinor, 0);
    expect(s.finance.cashMinor).toBe(openingCashMinor + ledgerNet);
  });

  it("rejects an invalid command before it is queued", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    expect(
      sim.validateCommand({
        type: "SET_RATE",
        dateKey: "1991-01-02",
        category: "single",
        rateMinor: 100,
      }),
    ).toEqual({ ok: false, reason: "rate outside slice bounds" });
    expect(
      sim.validateCommand({
        type: "SET_RATE",
        dateKey: "1991-01-02",
        category: "single",
        rateMinor: 9500,
      }),
    ).toEqual({ ok: true });
  });

  it("buys market research through the command boundary", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const before = sim.snapshot();
    sim.queueCommand({ type: "BUY_MARKET_RESEARCH" });
    sim.applyPendingCommands();
    const after = sim.snapshot();
    expect(after.finance.cashMinor).toBeLessThan(before.finance.cashMinor);
    expect(after.cityMarket.informationQuality).toBeGreaterThan(0);
    expect(
      after.cityMarket.forecast.high - after.cityMarket.forecast.low,
    ).toBeLessThan(
      before.cityMarket.forecast.high - before.cityMarket.forecast.low,
    );
  });

  it("applies a paused command without advancing the calendar", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand({
      type: "SET_RATE",
      dateKey: "1991-01-02",
      category: "single",
      rateMinor: 9500,
    });
    sim.applyPendingCommands();
    const s = sim.snapshot();
    expect(s.rates["1991-01-02/single"]).toBe(9500);
    expect(s.calendar).toEqual({ dateKey: "1991-01-01", minuteOfDay: 0 });
  });

  it("keeps the hiring sequence stable across a save and load", () => {
    const hire = {
      type: "HIRE",
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: 250_000,
    } as const;
    const sim = new GameSimulation(createInitialGameState(42));
    sim.queueCommand(hire);
    sim.advanceQuantum();
    const saved = sim.snapshot();

    sim.queueCommand(hire);
    sim.advanceQuantum();
    const continued = sim.snapshot().staff.map((m) => m.id);

    const reloaded = new GameSimulation(saved);
    reloaded.queueCommand(hire);
    reloaded.advanceQuantum();
    expect(reloaded.snapshot().staff.map((m) => m.id)).toEqual(continued);
    expect(new Set(continued).size).toBe(continued.length);
  });

  it("posts the final day into the month it belongs to", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 31);
    const s = sim.snapshot();
    const report = s.lastMonthlyClose!;
    // 31 days of a 24 room hotel, and none of February's capacity.
    expect(report.availableRoomNights).toBe(31 * 24);
    expect(s.finance.month.availableRoomNights).toBe(24);
  });

  it("keeps renovation CapEx out of the operating expense line", () => {
    const initial = createInitialGameState(424242);
    const openingCashMinor = initial.finance.cashMinor;
    const sim = new GameSimulation(initial);
    const before = sim.snapshot().finance.month.operatingExpenseMinor;
    sim.queueCommand({ type: "START_RENOVATION" });
    sim.advanceQuantum();
    const after = sim.snapshot();
    expect(after.finance.month.operatingExpenseMinor).toBe(before);
    expect(after.finance.cashMinor).toBe(openingCashMinor - 6_000_000);
  });

  it("records technology adoption as CapEx and publishes its start", () => {
    const initial = createInitialGameState(424242);
    const openingCashMinor = initial.finance.cashMinor;
    const sim = new GameSimulation(initial);
    sim.queueCommand({
      type: "ADOPT_TECHNOLOGY",
      technologyId: "personal-computer",
    });
    sim.advanceQuantum();
    expect(sim.state.finance.month.operatingExpenseMinor).toBe(0);
    expect(sim.state.finance.cashMinor).toBeLessThan(openingCashMinor);
    expect(sim.takeDomainEvents().map((event) => event.payload.type)).toContain(
      "TECHNOLOGY_ADOPTION_STARTED",
    );
  });

  it("wears assets down over simulated days", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const before = sim.snapshot().assets[0].condition;
    runQuanta(sim, QUANTA_PER_DAY * 3);
    expect(sim.snapshot().assets[0].condition).toBe(before - 30);
  });

  it("assigns the room category the guest actually booked", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 7);
    const s = sim.snapshot();
    let checked = 0;
    for (const stay of s.stays) {
      const booking = s.reservations.find((b) => b.id === stay.bookingId);
      const room = s.hotel.rooms.find((r) => r.id === stay.roomId)!;
      if (!booking) continue;
      expect(room.category).toBe(booking.category);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("rejects an order below the supplier minimum", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    expect(
      sim.validateCommand({
        type: "ORDER_SUPPLIES",
        sku: "cleaning-unit",
        quantity: 1,
      }),
    ).toEqual({ ok: false, reason: "minimum order is 50 cleaning-unit" });
    expect(
      sim.validateCommand({
        type: "ORDER_SUPPLIES",
        sku: "cleaning-unit",
        quantity: 50,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects unknown roles and shifts at the command boundary", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    expect(
      sim.validateCommand({
        type: "HIRE",
        role: "concierge",
        shift: "morning",
        monthlyWageMinor: 250_000,
      } as never),
    ).toEqual({ ok: false, reason: "unknown role" });
  });

  it("does not advance the staffing stream for a rejected hire", () => {
    const sim = new GameSimulation(createInitialGameState(42));
    const before = sim.snapshot().rngState.staffing;
    sim.queueCommand({
      type: "HIRE",
      role: "housekeeping",
      shift: "morning",
      monthlyWageMinor: -1,
    });
    sim.advanceQuantum();
    const after = sim.snapshot();
    expect(after.rngState.staffing).toBe(before);
    // The refusal is on the command journal, not written into the hotel: a
    // rejected command must leave authoritative state alone.
    expect(after.alerts.some((a) => a.id === "alert.command-rejected")).toBe(
      false,
    );
    expect(after.commandLog.at(-1)).toMatchObject({
      type: "HIRE",
      status: "rejected",
    });
  });

  it("follows the declared segment shares rather than a uniform draw", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 120);
    const s = sim.snapshot();
    const counts = new Map<string, number>();
    for (const b of s.reservations)
      counts.set(b.segmentId, (counts.get(b.segmentId) ?? 0) + 1);
    // Business holds 45 percent of demand, budget only 10 percent.
    expect(counts.get("segment.business") ?? 0).toBeGreaterThan(
      counts.get("segment.budget") ?? 0,
    );
  });

  it("holds inventory per category so doubles cannot block singles", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 20);
    const s = sim.snapshot();
    for (const category of ["single", "double"]) {
      const rooms = s.hotel.rooms.filter((r) => r.category === category).length;
      const byDate = new Map<string, number>();
      for (const b of s.reservations)
        if (b.category === category)
          byDate.set(b.arrivalDateKey, (byDate.get(b.arrivalDateKey) ?? 0) + 1);
      for (const held of byDate.values())
        expect(held).toBeLessThanOrEqual(rooms);
    }
  });

  it("charges exactly one monthly wage across a 31 day month", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    runQuanta(sim, QUANTA_PER_DAY * 31);
    const s = sim.snapshot();
    const wages = -s.finance.ledger
      .filter((e) => e.account === "wages")
      .reduce((n, e) => n + e.amountMinor, 0);
    const monthly = s.staff.reduce((n, m) => n + m.monthlyWageMinor, 0);
    // 31 daily postings that must sum to one contracted month, give or take
    // the per-day rounding remainder.
    expect(Math.abs(wages - monthly)).toBeLessThanOrEqual(31);
  });

  it("converts the free module into two extra rooms after the full lifecycle", () => {
    const sim = new GameSimulation(createInitialGameState(424242));
    sim.queueCommand({ type: "START_RENOVATION" });
    // Planning and approval run before any building starts, so the rooms are
    // still nine days away.
    runQuanta(sim, QUANTA_PER_DAY * 4);
    expect(sim.snapshot().hotel.rooms).toHaveLength(24);
    runQuanta(sim, QUANTA_PER_DAY * 6);
    expect(sim.snapshot().hotel.rooms).toHaveLength(26);
  });
});

describe("hotel depth", () => {
  function stateWith(mutate: (s: GameState) => void): GameSimulation {
    const state = createInitialGameState(424242);
    mutate(state);
    return new GameSimulation(state);
  }

  it("takes a conference block out of one category only", () => {
    const sim = stateWith((s) => {
      s.events.push({
        id: "event.block",
        guests: 40,
        nights: 2,
        roomsBlocked: 6,
        blockedCategory: "double",
        startDateKey: s.calendar.dateKey,
        valueMinor: 100_000,
        status: "confirmed",
      });
    });
    const s = sim.state;
    const singles = s.hotel.rooms.filter((r) => r.category === "single").length;
    const doubles = s.hotel.rooms.filter((r) => r.category === "double").length;

    // The block belongs to doubles; singles must be untouched by it.
    const available = (category: string) =>
      (
        sim as unknown as {
          availableRooms: (d: string, c: string) => number;
        }
      ).availableRooms(s.calendar.dateKey, category);
    expect(available("single")).toBe(singles);
    expect(available("double")).toBe(doubles - 6);
  });

  it("spends a technician's shift once, not once per asset", () => {
    const sim = stateWith((s) => {
      // Both plant items fall due on the same day, with one technician on.
      for (const asset of s.assets)
        asset.minutesSinceService = SERVICE_INTERVAL_MINUTES;
      s.staff = s.staff.filter((m) => m.role !== "technician");
      s.staff.push({
        id: "staff.technician.1",
        role: "technician",
        shift: "morning",
        skill: 60,
        monthlyWageMinor: 290_000,
        absent: false,
      });
    });
    runQuanta(sim, QUANTA_PER_DAY + 1);
    const serviced = sim.state.assets.filter(
      (a) => (a.minutesSinceService ?? 0) < SERVICE_INTERVAL_MINUTES,
    );
    // One technician contributes 240 minutes and a service takes 180, so only
    // one of the two assets can be serviced that day.
    expect(serviced).toHaveLength(1);
  });

  it("ages every room's fit-out on the calendar year rollover", () => {
    const sim = stateWith((s) => {
      s.calendar = { dateKey: "1991-12-31", minuteOfDay: 1380 };
    });
    const before = sim.state.hotel.rooms[0].styleAgeYears;
    runQuanta(sim, QUANTA_PER_DAY);
    expect(sim.state.calendar.dateKey.slice(0, 4)).toBe("1992");
    expect(
      sim.state.hotel.rooms.every((r) => r.styleAgeYears === before + 1),
    ).toBe(true);
  });

  it("works conference housekeeping off the same shift the rooms use", () => {
    const sim = stateWith((s) => {
      s.calendar = { dateKey: s.calendar.dateKey, minuteOfDay: 835 };
      s.events.push({
        id: "event.load",
        guests: 120,
        nights: 1,
        roomsBlocked: 20,
        blockedCategory: "double",
        startDateKey: s.calendar.dateKey,
        valueMinor: 500_000,
        status: "confirmed",
      });
    });
    runQuanta(sim, 2);
    const s = sim.state;
    // The load was booked as real work and the shift has started on it.
    expect(
      s.eventHousekeepingMinutes + s.eventHousekeepingWorkedMinutes,
    ).toBeGreaterThan(0);
    expect(s.eventHousekeepingWorkedMinutes).toBeGreaterThan(0);
    // Labour spent on the hall is no longer available for room turnaround.
    expect(s.housekeepingMinutes).toBe(0);
  });
});

describe("localized alerts", () => {
  it("keeps a refused booking id in cause values", () => {
    const state = createInitialGameState(4242);
    state.calendar.minuteOfDay = 595;
    for (let day = 1; day <= 7; day++) {
      const dateKey = `1991-01-${String(day).padStart(2, "0")}`;
      state.rates[`${dateKey}/single`] = 50_000;
      state.rates[`${dateKey}/double`] = 50_000;
    }
    const sim = new GameSimulation(state);

    sim.advanceQuantum();

    expect(
      sim.state.alerts.find((alert) =>
        alert.id.startsWith("alert.booking-refused."),
      ),
    ).toMatchObject({
      title: "alert.booking-refused.title",
      cause: "alert.booking-refused.cause.price",
      causeValues: { bookingId: "booking.5.0" },
    });
  });

  it("keeps commercial-space and security inputs in cause values", () => {
    const state = createInitialGameState(101);
    state.calendar.minuteOfDay = 1075;
    state.stays = Array.from({ length: 100 }, (_, index) => ({
      bookingId: `booking.space.${index}`,
      roomId: state.hotel.rooms[index % state.hotel.rooms.length].id,
      rateMinor: 10_000,
      departureDateKey: "1991-01-02",
    }));
    const sim = new GameSimulation(state);

    sim.advanceQuantum();

    expect(
      sim.state.alerts.find(
        (alert) => alert.id === "alert.space.space.carpark",
      ),
    ).toMatchObject({
      severity: "notice",
      title: "alert.space.title",
      cause: "alert.space.cause.atCapacity",
      target: { entityId: "space.carpark", kind: "facility" },
      causeValues: {
        spaceId: "space.carpark",
        capacity: 18,
        demand: 70,
        turnedAway: 52,
      },
      category: "space",
      groupId: `${state.hotel.id}:space`,
      source: {
        companyId: state.company.companyId,
        hotelId: state.hotel.id,
        regionId: state.company.portfolio.hotelRegion[state.hotel.id],
      },
      gameTime: "1991-01-01:1080",
      delegate: "Anna Keller",
      acknowledged: false,
    });
    expect(
      sim.state.alerts.find((alert) => alert.id === "alert.security.spaces"),
    ).toMatchObject({
      title: "alert.security.spaces.title",
      cause: "alert.security.spaces.cause",
      target: { entityId: "facility.security", kind: "facility" },
      causeValues: {
        inHouseGuests: 100,
        eventGuests: 0,
        openSpaces: 3,
      },
    });
  });

  it("acknowledges an alert through the command boundary", () => {
    const state = createInitialGameState(101);
    state.alerts.push({
      id: "alert.test",
      severity: "notice",
      title: "alert.test",
      cause: "alert.test",
      category: "test",
      groupId: `${state.hotel.id}:test`,
      source: { companyId: state.company.companyId, hotelId: state.hotel.id },
      gameTime: "1991-01-01:0",
      acknowledged: false,
    });
    const sim = new GameSimulation(state);
    sim.queueCommand({ type: "ACKNOWLEDGE_ALERT", id: "alert.test" });
    sim.applyPendingCommands();
    expect(sim.state.alerts[0].acknowledged).toBe(true);
  });

  it("leaves an advisory with the player when no manager is assigned", () => {
    const state = createInitialGameState(101);
    state.company.managers = [];
    state.calendar.minuteOfDay = 1075;
    state.stays = Array.from({ length: 100 }, (_, index) => ({
      bookingId: `booking.space.unmanaged.${index}`,
      roomId: state.hotel.rooms[index % state.hotel.rooms.length].id,
      rateMinor: 10_000,
      departureDateKey: "1991-01-02",
    }));
    const sim = new GameSimulation(state);
    sim.advanceQuantum();
    expect(
      sim.state.alerts.find((alert) => alert.id === "alert.space.space.carpark")
        ?.delegate,
    ).toBeUndefined();
  });

  it("keeps booking and recovery amounts out of localized alert keys", () => {
    const state = createInitialGameState(102);
    const bookingId = "booking.localized.1";
    state.reservations = [
      reserve(
        { availableRoomsOn: () => 1 },
        {
          id: bookingId,
          guestId: "guest.localized.1",
          roomsRequested: 1,
          rateMinor: 1_000_000,
          willingnessMinor: 1_000_000,
          channel: "directPhone",
          partySize: 1,
          segmentId: "segment.leisure",
          category: "single",
          arrivalDateKey: "1991-01-01",
          nights: 1,
          terms: {
            guaranteed: true,
            freeCancellationDays: 1,
            lateChargeBp: 10_000,
          },
          atMinutes: 0,
        },
      ),
    ];
    state.receptionQueue = [{ bookingId, waitedMinutes: 21 }];
    state.staff.find((member) => member.id === "staff.reception.2")!.absent =
      true;
    const sim = new GameSimulation(state);

    sim.advanceQuantum();

    expect(
      sim.state.alerts.find(
        (alert) => alert.id === `alert.complaint.${bookingId}`,
      ),
    ).toMatchObject({
      title: "alert.long-check-in.title",
      cause: "alert.long-check-in.cause",
      target: {
        entityId: "navigation.reception.queue",
        kind: "navigation",
      },
      causeValues: { bookingId, waitedMinutes: 26 },
    });
    expect(
      sim.state.alerts.find(
        (alert) => alert.id === `alert.recovery.complaint.${bookingId}`,
      ),
    ).toMatchObject({
      title: "alert.recovery-escalated.title",
      cause: "alert.recovery-escalated.cause",
      target: {
        entityId: "navigation.reception.queue",
        kind: "navigation",
      },
      causeValues: { bookingId, expenseMinor: 100_000 },
    });
  });

  it("keeps an unpaid expense as a localization key in cause values", () => {
    const state = createInitialGameState(103);
    state.calendar.minuteOfDay = 1435;
    state.staff.push({
      id: "staff.expensive.1",
      role: "reception",
      shift: "morning",
      skill: 50,
      monthlyWageMinor: 2_000_000_000,
      absent: false,
    });
    const sim = new GameSimulation(state);

    sim.advanceQuantum();

    expect(
      sim.state.alerts.find((alert) => alert.id === "alert.insolvent"),
    ).toMatchObject({
      title: "alert.insolvent.title",
      cause: "alert.insolvent.cause",
      causeValues: { expense: "expense.operating" },
    });
  });

  it("publishes renovation phases and stable occupant references per room", () => {
    const state = createInitialGameState(424242);
    const room = state.hotel.rooms[0];
    state.renovation = startRenovation("module.free", state.finance.cashMinor, {
      affected: [room.id],
    }).job;
    const booking = reserve(
      { availableRoomsOn: () => 1 },
      {
        id: "booking.render.1",
        guestId: "guest.returning.1",
        roomsRequested: 1,
        rateMinor: 12_000,
        willingnessMinor: 12_000,
        channel: "directPhone",
        partySize: 1,
        segmentId: "segment.business",
        category: "single",
        arrivalDateKey: state.calendar.dateKey,
        nights: 2,
        terms: {
          guaranteed: true,
          freeCancellationDays: 1,
          lateChargeBp: 10_000,
        },
        atMinutes: 0,
      },
    );
    state.reservations = [booking];
    state.stays = [
      {
        bookingId: booking.id,
        roomId: room.id,
        rateMinor: booking.rateMinor,
        departureDateKey: "1991-01-03",
      },
    ];
    room.state = "Occupied";

    const sim = new GameSimulation(state);
    sim.advanceQuantum();

    expect(sim.state.renderDescriptors.renovationPhaseByRoomId[room.id]).toBe(
      "planning",
    );
    expect(sim.state.renderDescriptors.occupantByRoomId[room.id]).toEqual({
      guestId: "guest.returning.1",
      bookingId: booking.id,
      rateMinor: booking.rateMinor,
      departureDateKey: "1991-01-03",
    });
    expect(
      sim.state.renderDescriptors.agents.find(
        (agent) => agent.id === "agent.booking.render.1",
      ),
    ).toMatchObject({
      kind: "guest",
      locationId: room.id,
      status: "sleeping",
    });
    expect(
      sim.state.renderDescriptors.agents.some(
        (agent) => agent.kind === "staff",
      ),
    ).toBe(true);
    expect(sim.state.renderDescriptors.elevator).toMatchObject({
      id: "asset.lift",
      cars: [expect.objectContaining({ id: "asset.lift.car.1" })],
    });
  });

  it("targets the housekeeping backlog at the placed housekeeping area", () => {
    const state = createInitialGameState(104);
    for (const room of state.hotel.rooms.slice(0, 6)) {
      room.state = "VacantDirty";
      room.cleanliness = 20;
    }
    state.staff = state.staff.filter(
      (member) => member.role !== "housekeeping",
    );
    const sim = new GameSimulation(state);

    sim.advanceQuantum();

    expect(
      sim.state.alerts.find(
        (alert) => alert.id === "alert.housekeeping-backlog",
      ),
    ).toMatchObject({
      target: { entityId: "facility.housekeeping", kind: "facility" },
    });
  });

  it("does not count a guest already at breakfast as waiting for the lift", () => {
    const state = createInitialGameState(105);
    const room = state.hotel.rooms[0];
    state.calendar.minuteOfDay = 480;
    state.elapsedMinutes = 480;
    state.reservations = [
      reserve(
        { availableRoomsOn: () => 1 },
        {
          id: "booking.breakfast.1",
          guestId: "guest.breakfast.1",
          roomsRequested: 1,
          rateMinor: 12_000,
          willingnessMinor: 12_000,
          channel: "directPhone",
          partySize: 1,
          segmentId: "segment.business",
          category: "single",
          arrivalDateKey: state.calendar.dateKey,
          nights: 2,
          terms: {
            guaranteed: true,
            freeCancellationDays: 1,
            lateChargeBp: 10_000,
          },
          atMinutes: 0,
        },
      ),
    ];
    state.stays = [
      {
        bookingId: "booking.breakfast.1",
        roomId: room.id,
        rateMinor: 12_000,
        departureDateKey: "1991-01-03",
      },
    ];
    room.state = "Occupied";
    const sim = new GameSimulation(state);

    sim.refreshDerivedState();

    expect(
      sim.state.renderDescriptors.agents.find(
        (agent) => agent.guestId === "guest.breakfast.1",
      )?.locationId,
    ).toBe("facility.breakfast_room");
    expect(sim.state.renderDescriptors.elevator.queue).toBe(0);
    expect(
      sim.state.renderDescriptors.elevator.cars.every(
        (car) => car.waitingGuestIds.length === 0,
      ),
    ).toBe(true);
  });
});
