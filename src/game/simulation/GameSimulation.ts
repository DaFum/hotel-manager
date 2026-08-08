import { captureRngState, restoreRngStreams } from "../domain/rng";
import { CITY, seasonalityBp } from "../content/1991/frankfurt";
import { GUEST_SEGMENTS } from "../content/1991/guestSegments";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { supplierForSku } from "../content/1991/suppliers";
import { canWalkIn, markNoShow, reserve } from "../bookings/bookingEngine";
import { getRate, setRate } from "../revenue/rates";
import {
  adrMinor,
  occupancyBasisPoints,
  revParMinor,
} from "../revenue/metrics";
import { assignRoom, processReceptionQueue } from "../guests/guestJourney";
import { complaintForWait } from "../guests/complaints";
import { cleanRoom } from "../rooms/housekeeping";
import { serveBreakfast } from "../fnb/breakfastService";
import { consume, deliverOrder, placeOrder } from "../purchasing/inventory";
import { degradeAsset, repairAsset } from "../maintenance/maintenance";
import { hireApplicant } from "../staff/staffing";
import { postEntry } from "../finance/ledger";
import { accrueMonthlyInterestMinor } from "../finance/loans";
import { closeMonth } from "../finance/monthlyClose";
import { completeRenovation, startRenovation } from "../building/renovations";
import { addDays, MINUTES_PER_DAY } from "../domain/calendar";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import type {
  AlertRecord,
  GameState,
  ReservationRecord,
  RoomRecord,
} from "./initialState";

/** The MASTER deterministic phase contract; order is part of the save format. */
export const PHASE_ORDER = [
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
] as const;

export type SimulationPhase = (typeof PHASE_ORDER)[number];

export type GameCommand =
  | { type: "SET_RATE"; dateKey: string; category: string; rateMinor: number }
  | { type: "ORDER_SUPPLIES"; sku: string; quantity: number }
  | { type: "HIRE"; role: string; shift: string; monthlyWageMinor: number }
  | { type: "START_RENOVATION" };

const CHECKOUT_MINUTE = 660;
const ARRIVAL_MINUTE = 840;
const DEMAND_MINUTE = 600;
const BREAKFAST_START = 390;
/** Reception handles two parties per staffed quantum. */
const PARTIES_PER_RECEPTIONIST = 2;

export class GameSimulation {
  private queued: GameCommand[] = [];
  private streams: ReturnType<typeof restoreRngStreams>;
  private dayRolled = false;
  private hiredCount = 0;

  constructor(public state: GameState) {
    this.streams = restoreRngStreams(state.rngState);
  }

  get pendingCommandCount(): number {
    return this.queued.length;
  }

  queueCommand(command: GameCommand): void {
    this.queued.push(command);
  }

  advanceQuantum(): void {
    for (const phase of PHASE_ORDER) this.runPhase(phase);
    this.state.rngState = captureRngState(this.streams);
    assertInvariants(this.state);
  }

  snapshot(): GameState {
    return structuredClone(this.state);
  }

  private runPhase(phase: SimulationPhase): void {
    switch (phase) {
      case "commands":
        return this.applyCommands();
      case "time":
        return this.advanceTime();
      case "arrivalsDepartures":
        return this.arrivalsDepartures();
      case "roomState":
        return this.runHousekeeping();
      case "staffService":
        return this.runReception();
      case "facilityThroughput":
        return this.runBreakfast();
      case "inventory":
        return this.receiveOrders();
      case "maintenanceFailures":
        return this.runMaintenance();
      case "satisfaction":
        return this.runSatisfaction();
      case "finance":
        return this.runFinance();
      case "demandBookings":
        return this.generateDemand();
      case "events":
        return this.refreshAlerts();
      case "snapshot":
        return this.refreshMetrics();
    }
  }

  // --- phases ------------------------------------------------------------

  private applyCommands(): void {
    for (const command of this.queued) {
      try {
        this.applyCommand(command);
      } catch (error) {
        this.pushAlert({
          id: `alert.command.${this.state.elapsedMinutes}`,
          severity: "warning",
          title: "Command rejected",
          cause: (error as Error).message,
        });
      }
    }
    this.queued = [];
  }

  private applyCommand(command: GameCommand): void {
    const s = this.state;
    switch (command.type) {
      case "SET_RATE":
        s.rates = setRate(
          s.rates,
          command.dateKey,
          command.category,
          command.rateMinor,
        );
        return;
      case "ORDER_SUPPLIES": {
        const supplier = supplierForSku(command.sku);
        const result = placeOrder(
          { cashMinor: s.finance.cashMinor, nowMinutes: s.elapsedMinutes },
          {
            supplierId: supplier.id,
            sku: supplier.sku,
            quantity: command.quantity,
            unitPriceMinor: supplier.unitPriceMinor,
            leadMinutes: supplier.leadMinutes,
          },
        );
        this.spend(
          s.finance.cashMinor - result.cashMinor,
          "supplies",
          `${command.quantity} ${command.sku}`,
        );
        s.pendingOrders.push(result.order);
        return;
      }
      case "HIRE": {
        const hired = hireApplicant(
          {
            id: `staff.${command.role}.${++this.hiredCount + 100}`,
            role: command.role,
            skill: 50 + (this.streams.staffing.nextUint32() % 40),
          },
          {
            shift: command.shift as "morning" | "evening" | "night",
            monthlyWageMinor: command.monthlyWageMinor,
          },
        );
        s.staff.push({
          id: hired.id,
          role: hired.role,
          shift: hired.shift,
          skill: hired.skill,
          monthlyWageMinor: hired.monthlyWageMinor,
          absent: false,
        });
        return;
      }
      case "START_RENOVATION": {
        if (s.renovation) throw new Error("renovation already running");
        const started = startRenovation(
          "module.free.1",
          s.elapsedMinutes,
          s.finance.cashMinor,
        );
        this.spend(
          s.finance.cashMinor - started.cashMinor,
          "capex",
          "module conversion",
        );
        s.renovation = started.job;
        return;
      }
    }
  }

  private advanceTime(): void {
    const s = this.state;
    const before = s.calendar.dateKey;
    s.calendar = advanceClock(s.calendar);
    s.elapsedMinutes += QUANTUM_MINUTES;
    this.dayRolled = s.calendar.dateKey !== before;
    if (!this.dayRolled) return;

    s.finance.month.availableRoomNights += s.hotel.rooms.length;
    if (before.slice(0, 7) !== s.calendar.dateKey.slice(0, 7))
      this.closeMonth();
  }

  private arrivalsDepartures(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay === CHECKOUT_MINUTE) {
      const leaving = s.stays.filter(
        (stay) => stay.departureDateKey <= s.calendar.dateKey,
      );
      for (const stay of leaving) {
        const room = s.hotel.rooms.find((r) => r.id === stay.roomId);
        if (room) {
          room.state = "VacantDirty";
          room.cleanliness = 40;
        }
      }
      s.stays = s.stays.filter((stay) => !leaving.includes(stay));
    }

    if (s.calendar.minuteOfDay === ARRIVAL_MINUTE) {
      for (const booking of s.reservations) {
        if (
          booking.status === "confirmed" &&
          booking.arrivalDateKey === s.calendar.dateKey
        )
          s.receptionQueue.push({ bookingId: booking.id, waitedMinutes: 0 });
      }
    }

    // Anyone still unserved at midnight never arrived.
    if (s.calendar.minuteOfDay === 0) {
      const yesterday = addDays(s.calendar.dateKey, -1);
      for (const booking of s.reservations) {
        if (
          booking.status === "confirmed" &&
          booking.arrivalDateKey === yesterday
        ) {
          const updated = markNoShow(booking);
          booking.status = updated.status;
        }
      }
      s.receptionQueue = [];
      s.reservations = s.reservations.filter(
        (b) => b.status === "confirmed" || b.status === "checkedIn",
      );
    }
  }

  private runHousekeeping(): void {
    const s = this.state;
    for (const room of s.hotel.rooms)
      if (room.state === "Inspected") room.state = "VacantClean";

    const housekeepers = s.staff.filter(
      (m) => m.role === "housekeeping" && !m.absent,
    ).length;
    for (let i = 0; i < housekeepers; i++) {
      const dirty = s.hotel.rooms.find((r) => r.state === "VacantDirty");
      if (!dirty) return;
      if ((s.stock["cleaning-unit"] ?? 0) < 1) {
        this.pushAlert({
          id: "alert.cleaning-stockout",
          severity: "critical",
          title: "Cleaning supplies out of stock",
          cause: "housekeeping cannot turn rooms around",
        });
        return;
      }
      const cleaned = cleanRoom(
        { state: dirty.state, cleanliness: dirty.cleanliness },
        { minutes: 30, cleaningUnits: s.stock["cleaning-unit"] },
      );
      dirty.state = cleaned.room.state;
      dirty.cleanliness = cleaned.room.cleanliness;
      s.stock = consume(s.stock, "cleaning-unit", 1);
    }
  }

  private runReception(): void {
    const s = this.state;
    if (s.receptionQueue.length === 0) return;
    for (const waiting of s.receptionQueue)
      waiting.waitedMinutes += QUANTUM_MINUTES;

    const receptionists = s.staff.filter(
      (m) => m.role === "reception" && !m.absent,
    ).length;
    const { processed } = processReceptionQueue(
      s.receptionQueue.map((w) => w.bookingId),
      receptionists * PARTIES_PER_RECEPTIONIST,
    );

    for (const bookingId of processed) {
      const booking = s.reservations.find((b) => b.id === bookingId);
      s.receptionQueue = s.receptionQueue.filter(
        (w) => w.bookingId !== bookingId,
      );
      if (!booking || booking.status !== "confirmed") continue;
      const room = assignRoom(s.hotel.rooms, this.categoryFor(booking));
      if (!room) continue;
      const target = s.hotel.rooms.find((r) => r.id === room.id) as RoomRecord;
      target.state = "Occupied";
      booking.status = "checkedIn";
      s.stays.push({
        bookingId: booking.id,
        roomId: target.id,
        rateMinor: booking.rateMinor,
        departureDateKey: addDays(booking.arrivalDateKey, booking.nights),
      });
    }
  }

  private runBreakfast(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== BREAKFAST_START) return;
    const result = serveBreakfast({
      demand: s.stays.length,
      seats: STARTER_HOTEL.breakfastSeats,
      kitchenCovers: STARTER_HOTEL.kitchenCovers,
      stock: s.stock["breakfast-portion"] ?? 0,
      priceMinor: STARTER_HOTEL.breakfastPriceMinor,
      minuteOfDay: s.calendar.minuteOfDay,
    });
    if (result.served === 0) return;
    s.stock = consume(s.stock, "breakfast-portion", result.served);
    this.earn(result.revenueMinor, "breakfastRevenue", "breakfast covers");
    s.finance.month.otherRevenueMinor += result.revenueMinor;
    if (result.queue > 0)
      this.pushAlert({
        id: "alert.breakfast-queue",
        severity: "warning",
        title: "Breakfast queue",
        cause: `${result.queue} guests could not be served`,
      });
  }

  private receiveOrders(): void {
    const s = this.state;
    const due = s.pendingOrders.filter(
      (o) => o.dueAtMinutes <= s.elapsedMinutes,
    );
    for (const order of due)
      s.stock = deliverOrder(s.stock, order, s.elapsedMinutes);
    if (due.length)
      s.pendingOrders = s.pendingOrders.filter((o) => !due.includes(o));

    // Reorder automatically so an unattended hotel still runs.
    for (const sku of ["cleaning-unit", "breakfast-portion"]) {
      const low = (s.stock[sku] ?? 0) < 30;
      const onOrder = s.pendingOrders.some((o) => o.sku === sku);
      if (!low || onOrder) continue;
      const supplier = supplierForSku(sku);
      if (
        s.finance.cashMinor <
        supplier.unitPriceMinor * supplier.minimumQuantity
      )
        continue;
      this.applyCommand({
        type: "ORDER_SUPPLIES",
        sku,
        quantity: supplier.minimumQuantity,
      });
    }
  }

  private runMaintenance(): void {
    const s = this.state;
    s.assets = s.assets.map((asset) => {
      const degraded = { ...asset, ...degradeAsset(asset, QUANTUM_MINUTES) };
      if (degraded.status === "operational" && degraded.condition < 2000) {
        const roll = this.streams.failures.nextUint32() % 10000;
        if (roll < 50) return { ...degraded, status: "failed" as const };
      }
      if (degraded.status !== "operational") {
        const technicianMinutes = this.dayRolled ? 120 : 0;
        return { ...degraded, ...repairAsset(degraded, technicianMinutes) };
      }
      return degraded;
    });

    if (this.dayRolled) {
      const repairCost =
        s.assets.filter((a) => a.status !== "operational").length * 25_000;
      if (repairCost) this.spend(repairCost, "maintenance", "repairs");
    }
  }

  private runSatisfaction(): void {
    const s = this.state;
    for (const waiting of s.receptionQueue) {
      const complaint = complaintForWait(
        waiting.bookingId,
        waiting.waitedMinutes,
      );
      if (!complaint) continue;
      this.pushAlert({
        id: `alert.${complaint.id}`,
        severity: "warning",
        title: "Long check-in",
        cause: `${waiting.bookingId} waited ${waiting.waitedMinutes} minutes at reception`,
      });
    }
  }

  private runFinance(): void {
    if (!this.dayRolled) return;
    const s = this.state;

    for (const stay of s.stays) {
      this.earn(stay.rateMinor, "roomRevenue", stay.roomId);
      s.finance.month.roomRevenueMinor += stay.rateMinor;
      s.finance.month.soldRoomNights += 1;
    }

    const dailyWages = Math.round(
      s.staff.reduce((sum, m) => sum + m.monthlyWageMinor, 0) / 30,
    );
    this.spend(dailyWages, "wages", "daily payroll");

    if (s.calendar.dateKey.slice(8) === "01") {
      const interest = accrueMonthlyInterestMinor(s.loan);
      this.spend(interest, "interest", "loan interest");
    }

    if (s.renovation) {
      const completion = completeRenovation(s.renovation, s.elapsedMinutes);
      if (completion.roomsAdded > 0) {
        const nextNumber = STARTER_HOTEL.firstRoomNumber + s.hotel.rooms.length;
        for (let i = 0; i < completion.roomsAdded; i++)
          s.hotel.rooms.push({
            id: `room.${nextNumber + i}`,
            category: "double",
            state: "VacantClean",
            cleanliness: 100,
          });
        s.renovation = null;
      }
    }
  }

  private generateDemand(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== DEMAND_MINUTE) return;

    const season = seasonalityBp(s.calendar.dateKey);
    const parties = Math.round(
      ((4 + (this.streams.guests.nextUint32() % 5)) * season) / 10000,
    );
    for (let i = 0; i < parties; i++) {
      const segment =
        GUEST_SEGMENTS[
          this.streams.guests.nextUint32() % GUEST_SEGMENTS.length
        ];
      const leadDays = this.streams.guests.nextUint32() % 7;
      const arrivalDateKey = addDays(s.calendar.dateKey, leadDays);
      const category =
        this.streams.guests.nextUint32() % 2 ? "double" : "single";
      const rateMinor = getRate(
        s.rates,
        arrivalDateKey,
        category,
        STARTER_HOTEL.defaultRateMinor[category],
      );
      const availableRooms = this.availableRooms(arrivalDateKey, category);
      if (leadDays === 0 && !canWalkIn(this.sameDayInventory())) continue;
      try {
        const booking = reserve(
          { availableRooms },
          {
            id: `booking.${s.elapsedMinutes}.${i}`,
            roomsRequested: 1,
            rateMinor,
            willingnessMinor: segment.willingnessMinor,
          },
        );
        const reservation: ReservationRecord = {
          ...booking,
          arrivalDateKey,
          nights: segment.averageNights,
          segmentId: segment.id,
        };
        s.reservations.push(reservation);
      } catch {
        /* demand lost to price or inventory; the alerts phase reports it */
      }
    }
  }

  private refreshAlerts(): void {
    const s = this.state;
    const dirty = s.hotel.rooms.filter((r) => r.state === "VacantDirty").length;
    s.alerts = s.alerts.filter((a) => a.id !== "alert.housekeeping-backlog");
    if (dirty > 5)
      this.pushAlert({
        id: "alert.housekeeping-backlog",
        severity: "warning",
        title: "Housekeeping backlog",
        cause: `${dirty} rooms waiting for cleaning`,
      });
    if (s.alerts.length > 20) s.alerts = s.alerts.slice(-20);
  }

  private refreshMetrics(): void {
    const m = this.state.finance.month;
    this.state.metrics = {
      adrMinor: adrMinor(m.roomRevenueMinor, m.soldRoomNights),
      revParMinor: revParMinor(m.roomRevenueMinor, m.availableRoomNights),
      occupancyBasisPoints: occupancyBasisPoints(
        m.soldRoomNights,
        m.availableRoomNights,
      ),
    };
  }

  // --- helpers -----------------------------------------------------------

  private closeMonth(): void {
    const s = this.state;
    const m = s.finance.month;
    s.lastMonthlyClose = closeMonth({
      openingCashMinor: m.openingCashMinor,
      closingCashMinor: s.finance.cashMinor,
      roomRevenueMinor: m.roomRevenueMinor,
      otherRevenueMinor: m.otherRevenueMinor,
      operatingExpenseMinor: m.operatingExpenseMinor,
      soldRoomNights: m.soldRoomNights,
      availableRoomNights: m.availableRoomNights,
    });
    s.finance.month = {
      openingCashMinor: s.finance.cashMinor,
      roomRevenueMinor: 0,
      otherRevenueMinor: 0,
      operatingExpenseMinor: 0,
      soldRoomNights: 0,
      availableRoomNights: 0,
    };
  }

  private categoryFor(booking: ReservationRecord): string {
    return booking.rateMinor >= STARTER_HOTEL.defaultRateMinor.double
      ? "double"
      : "single";
  }

  private availableRooms(dateKey: string, category: string): number {
    const s = this.state;
    const total = s.hotel.rooms.filter((r) => r.category === category).length;
    const held = s.reservations.filter(
      (b) =>
        b.status === "confirmed" &&
        b.arrivalDateKey <= dateKey &&
        addDays(b.arrivalDateKey, b.nights) > dateKey,
    ).length;
    return Math.max(0, total - held);
  }

  private sameDayInventory() {
    const s = this.state;
    return {
      cleanRooms: s.hotel.rooms.filter((r) => r.state === "VacantClean").length,
      confirmedArrivals: s.reservations.filter(
        (b) =>
          b.status === "confirmed" && b.arrivalDateKey === s.calendar.dateKey,
      ).length,
    };
  }

  private earn(amountMinor: number, account: string, memo: string): void {
    if (amountMinor <= 0) return;
    const s = this.state;
    s.finance.cashMinor += amountMinor;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account,
      amountMinor,
      memo,
    });
  }

  private spend(amountMinor: number, account: string, memo: string): void {
    if (amountMinor <= 0) return;
    const s = this.state;
    const paid = Math.min(amountMinor, s.finance.cashMinor);
    s.finance.cashMinor -= paid;
    s.finance.month.operatingExpenseMinor += paid;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account,
      amountMinor: -paid,
      memo,
    });
    if (paid < amountMinor)
      this.pushAlert({
        id: "alert.insolvent",
        severity: "critical",
        title: "Out of cash",
        cause: `${memo} could not be paid in full`,
      });
  }

  private pushAlert(alert: AlertRecord): void {
    if (this.state.alerts.some((a) => a.id === alert.id)) return;
    this.state.alerts.push(alert);
  }
}

export const SIMULATION_CITY = CITY;
