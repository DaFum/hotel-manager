import { captureRngState, restoreRngStreams } from "../domain/rng";
import { CITY, seasonalityBp } from "../content/1991/frankfurt";
import { pickSegment } from "../content/1991/guestSegments";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { supplierForSku } from "../content/1991/suppliers";
import { canWalkIn, markNoShow, reserve } from "../bookings/bookingEngine";
import {
  getRate,
  isRoomCategory,
  setRate,
  type RoomCategory,
} from "../revenue/rates";
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
import { hireApplicant, type Shift } from "../staff/staffing";
import { postEntry } from "../finance/ledger";
import { accrueMonthlyInterestMinor } from "../finance/loans";
import { closeMonth } from "../finance/monthlyClose";
import {
  advanceRenovation,
  renovationBlockedRooms,
  startRenovation,
} from "../building/renovations";
import { addDays, daysInMonth, MINUTES_PER_DAY } from "../domain/calendar";
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

export type StaffRole = "reception" | "housekeeping" | "kitchen" | "technician";

export const STAFF_ROLES: readonly StaffRole[] = [
  "reception",
  "housekeeping",
  "kitchen",
  "technician",
];

export const SHIFTS: readonly Shift[] = ["morning", "evening", "night"];

export type GameCommand =
  | {
      type: "SET_RATE";
      dateKey: string;
      category: RoomCategory;
      rateMinor: number;
    }
  | { type: "ORDER_SUPPLIES"; sku: string; quantity: number }
  | {
      type: "HIRE";
      role: StaffRole;
      shift: Shift;
      monthlyWageMinor: number;
    }
  | { type: "START_RENOVATION" };

const CHECKOUT_MINUTE = 660;
const ARRIVAL_MINUTE = 840;
const DEMAND_MINUTE = 600;
const BREAKFAST_START = 390;
const MAX_ALERTS = 20;
/** Half a percent chance per day that a worn asset fails, in basis points. */
const DAILY_FAILURE_BP = 50;
/** One receptionist checks in six parties per simulated hour. */
const PARTIES_PER_RECEPTIONIST_PER_HOUR = 6;
/** A room takes half an hour of housekeeping labour. */
const ROOM_CLEAN_MINUTES = 30;

export class GameSimulation {
  private queued: GameCommand[] = [];
  private streams: ReturnType<typeof restoreRngStreams>;
  private dayRolled = false;
  private monthRolled = false;

  constructor(public state: GameState) {
    this.streams = restoreRngStreams(state.rngState);
  }

  get pendingCommandCount(): number {
    return this.queued.length;
  }

  queueCommand(command: GameCommand): void {
    this.queued.push(command);
  }

  /**
   * Pre-flight check so the worker can answer COMMAND_ACCEPTED or
   * COMMAND_REJECTED truthfully; the command still mutates state only in the
   * commands phase.
   */
  validateCommand(
    command: GameCommand,
  ): { ok: true } | { ok: false; reason: string } {
    const s = this.state;
    try {
      switch (command.type) {
        case "SET_RATE":
          setRate(
            s.rates,
            command.dateKey,
            command.category,
            command.rateMinor,
          );
          return { ok: true };
        case "ORDER_SUPPLIES": {
          const supplier = supplierForSku(command.sku);
          if (command.quantity < supplier.minimumQuantity)
            return {
              ok: false,
              reason: `minimum order is ${supplier.minimumQuantity} ${supplier.sku}`,
            };
          placeOrder(
            { cashMinor: s.finance.cashMinor, nowMinutes: s.elapsedMinutes },
            {
              supplierId: supplier.id,
              sku: supplier.sku,
              quantity: command.quantity,
              unitPriceMinor: supplier.unitPriceMinor,
              leadMinutes: supplier.leadMinutes,
            },
          );
          return { ok: true };
        }
        case "HIRE":
          if (!STAFF_ROLES.includes(command.role))
            return { ok: false, reason: "unknown role" };
          if (!SHIFTS.includes(command.shift))
            return { ok: false, reason: "unknown shift" };
          hireApplicant(
            { id: "applicant", role: command.role, skill: 50 },
            {
              shift: command.shift,
              monthlyWageMinor: command.monthlyWageMinor,
            },
          );
          return { ok: true };
        case "START_RENOVATION": {
          if (s.renovation)
            return { ok: false, reason: "renovation already running" };
          startRenovation("module.free.1", s.finance.cashMinor);
          return { ok: true };
        }
        default:
          return { ok: false, reason: "unknown command" };
      }
    } catch (error) {
      return { ok: false, reason: (error as Error).message };
    }
  }

  /**
   * Applies queued commands while the game is paused. This deliberately runs
   * only the commands phase: a paused hotel must not advance time.
   */
  applyPendingCommands(): void {
    this.applyCommands();
    this.refreshMetrics();
    this.state.rngState = captureRngState(this.streams);
    assertInvariants(this.state);
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
    this.queued.forEach((command, index) => {
      try {
        this.applyCommand(command);
      } catch (error) {
        this.pushAlert({
          id: `alert.command.${this.state.elapsedMinutes}.${index}.${command.type}`,
          severity: "warning",
          title: "Command rejected",
          cause: (error as Error).message,
        });
      }
    });
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
        if (command.quantity < supplier.minimumQuantity)
          throw new Error(
            `minimum order is ${supplier.minimumQuantity} ${supplier.sku}`,
          );
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
        // Validate before drawing: a rejected command must not advance the
        // staffing stream, which is authoritative save state.
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        const hired = hireApplicant(
          {
            id: this.nextStaffId(command.role),
            role: command.role,
            skill: 50 + (this.streams.staffing.nextUint32() % 40),
          },
          {
            shift: command.shift,
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
        const started = startRenovation("module.free.1", s.finance.cashMinor);
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
    // The ended day's revenue and wages are posted in the finance phase, so
    // both the close and the new day's room-night capacity wait for it.
    this.monthRolled =
      this.dayRolled && before.slice(0, 7) !== s.calendar.dateKey.slice(0, 7);
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
      // A party still queued at reception has arrived; only guests who never
      // turned up become no-shows.
      const waiting = new Set(s.receptionQueue.map((w) => w.bookingId));
      for (const booking of s.reservations) {
        if (
          booking.status === "confirmed" &&
          booking.arrivalDateKey === yesterday &&
          !waiting.has(booking.id)
        ) {
          const updated = markNoShow(booking);
          booking.status = updated.status;
        }
      }
      s.reservations = s.reservations.filter(
        (b) => b.status === "confirmed" || b.status === "checkedIn",
      );
    }
  }

  private runHousekeeping(): void {
    const s = this.state;
    this.advanceRenovationProject();
    for (const room of s.hotel.rooms)
      if (room.state === "Inspected") room.state = "VacantClean";

    // Each housekeeper contributes QUANTUM_MINUTES of labour per quantum and a
    // room takes ROOM_CLEAN_MINUTES, so the surplus is carried across quanta.
    const housekeepers = s.staff.filter(
      (m) => m.role === "housekeeping" && !m.absent,
    ).length;
    s.housekeepingMinutes += housekeepers * QUANTUM_MINUTES;
    const roomsThisQuantum = Math.floor(
      s.housekeepingMinutes / ROOM_CLEAN_MINUTES,
    );
    for (let i = 0; i < roomsThisQuantum; i++) {
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
        {
          minutes: ROOM_CLEAN_MINUTES,
          cleaningUnits: s.stock["cleaning-unit"],
        },
      );
      s.housekeepingMinutes -= ROOM_CLEAN_MINUTES;
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
    s.receptionCapacity +=
      (receptionists * PARTIES_PER_RECEPTIONIST_PER_HOUR * QUANTUM_MINUTES) /
      60;
    const servable = Math.floor(s.receptionCapacity);
    const { processed } = processReceptionQueue(
      s.receptionQueue.map((w) => w.bookingId),
      servable,
    );

    for (const bookingId of processed) {
      const booking = s.reservations.find((b) => b.id === bookingId);
      if (!booking || booking.status !== "confirmed") {
        s.receptionQueue = s.receptionQueue.filter(
          (w) => w.bookingId !== bookingId,
        );
        continue;
      }
      // No clean room of the booked category yet: the party keeps waiting
      // rather than silently vanishing into a no-show at midnight.
      const room = assignRoom(s.hotel.rooms, booking.category);
      if (!room) continue;
      s.receptionQueue = s.receptionQueue.filter(
        (w) => w.bookingId !== bookingId,
      );
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
    if (result.served === 0 && result.queue === 0) return;
    if (result.served > 0) {
      s.stock = consume(s.stock, "breakfast-portion", result.served);
      this.earn(result.revenueMinor, "breakfastRevenue", "breakfast covers");
      s.finance.month.otherRevenueMinor += result.revenueMinor;
    }
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
      // Queue it: commands are the mutation boundary, so the order goes
      // through validation in the next commands phase like any other.
      this.queueCommand({
        type: "ORDER_SUPPLIES",
        sku,
        quantity: supplier.minimumQuantity,
      });
    }
  }

  private runMaintenance(): void {
    const s = this.state;
    // Wear is applied once a day: a five-minute quantum floors to zero decay.
    const wearMinutes = this.dayRolled ? MINUTES_PER_DAY : 0;
    s.assets = s.assets.map((asset) => {
      const degraded = { ...asset, ...degradeAsset(asset, wearMinutes) };
      if (
        this.dayRolled &&
        degraded.status === "operational" &&
        degraded.condition < 2000
      ) {
        const roll = this.streams.failures.nextUint32() % 10000;
        if (roll < DAILY_FAILURE_BP)
          return { ...degraded, status: "failed" as const };
      }
      if (degraded.status !== "operational") {
        const technicianMinutes = this.dayRolled ? 120 : 0;
        return { ...degraded, ...repairAsset(degraded, technicianMinutes) };
      }
      return degraded;
    });

    if (this.dayRolled) {
      const repairCost =
        s.assets.filter((a) => a.status !== "operational").length *
        STARTER_HOTEL.dailyRepairCostMinor;
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

    // Charge exactly one monthly wage per calendar month, whatever its length.
    // The finance phase settles the day that just ended, so the divisor is
    // that day's month length, not the new day's.
    const endedDay = addDays(s.calendar.dateKey, -1);
    const dailyWages = Math.round(
      s.staff.reduce((sum, m) => sum + m.monthlyWageMinor, 0) /
        daysInMonth(endedDay),
    );
    this.spend(dailyWages, "wages", "daily payroll");

    if (s.calendar.dateKey.slice(8) === "01") {
      const interest = accrueMonthlyInterestMinor(s.loan);
      this.spend(interest, "interest", "loan interest");
    }

    this.settlePayables();
    if (this.monthRolled) this.closeMonth();
    s.finance.month.availableRoomNights += s.hotel.rooms.length;
  }

  private generateDemand(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== DEMAND_MINUTE) return;

    const season = seasonalityBp(s.calendar.dateKey);
    const parties = Math.round(
      ((4 + (this.streams.guests.nextUint32() % 5)) * season) / 10000,
    );
    for (let i = 0; i < parties; i++) {
      const segment = pickSegment(this.streams.guests.nextUint32() % 10000);
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
          category,
          arrivalDateKey,
          nights: segment.averageNights,
          segmentId: segment.id,
        };
        s.reservations.push(reservation);
      } catch {
        /* demand lost to price or inventory; the slice does not yet count
           the causes, so this is intentionally silent */
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
    if (s.alerts.length > MAX_ALERTS) {
      // Critical alerts are pushed once and never refreshed, so newer warnings
      // must not evict them.
      const critical = s.alerts.filter((a) => a.severity === "critical");
      const rest = s.alerts.filter((a) => a.severity !== "critical");
      s.alerts = [...critical, ...rest.slice(-(MAX_ALERTS - critical.length))];
    }
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

  /**
   * Renovation lives in the roomState phase because that is where rooms open,
   * close, and change product; the cash left in the commands phase already.
   */
  private advanceRenovationProject(): void {
    const s = this.state;
    if (!s.renovation) return;
    const before = new Set(renovationBlockedRooms(s.renovation));
    const step = advanceRenovation(s.renovation, QUANTUM_MINUTES);
    s.renovation = step.job;
    const blocked = new Set(renovationBlockedRooms(step.job));

    for (const room of s.hotel.rooms) {
      if (blocked.has(room.id) && room.state !== "Occupied")
        room.state = "OutOfOrder";
      // Reopening is a cleaning job, not an instant sale: a handed-over room
      // still has to pass housekeeping.
      else if (before.has(room.id) && !blocked.has(room.id))
        room.state = "VacantDirty";
    }

    if (step.roomsAdded > 0) {
      const nextNumber = STARTER_HOTEL.firstRoomNumber + s.hotel.rooms.length;
      for (let i = 0; i < step.roomsAdded; i++)
        s.hotel.rooms.push({
          id: `room.${nextNumber + i}`,
          category: "double",
          state: "VacantClean",
          cleanliness: 100,
        });
      s.renovation = null;
    }
  }

  private closeMonth(): void {
    const s = this.state;
    const m = s.finance.month;
    s.lastMonthlyClose = closeMonth({
      periodKey: addDays(s.calendar.dateKey, -1).slice(0, 7),
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
      // The first day of the new month is added right after this close.
      availableRoomNights: 0,
    };
  }

  private nextStaffId(role: string): string {
    // Derived from authoritative state so a save/load round trip cannot reuse
    // an id or diverge from an uninterrupted run.
    const prefix = `staff.${role}.`;
    const highest = this.state.staff
      .filter((m) => m.id.startsWith(prefix))
      .map((m) => Number(m.id.slice(prefix.length)))
      .filter((n) => Number.isSafeInteger(n))
      .reduce((max, n) => Math.max(max, n), 100);
    return `${prefix}${highest + 1}`;
  }

  private availableRooms(dateKey: string, category: string): number {
    const s = this.state;
    const total = s.hotel.rooms.filter((r) => r.category === category).length;
    const held = s.reservations.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "checkedIn") &&
        b.category === category &&
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
    const unpaid = amountMinor - paid;
    s.finance.cashMinor -= paid;
    // CapEx buys an asset; it is cash out but not an operating expense. The
    // expense is recognised in full even when cash cannot cover it.
    if (account !== "capex")
      s.finance.month.operatingExpenseMinor += amountMinor;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account,
      amountMinor: -paid,
      memo,
    });
    if (unpaid > 0) {
      // The shortfall becomes a payable and is settled once cash returns.
      s.finance.payableMinor += unpaid;
      this.pushAlert({
        id: "alert.insolvent",
        severity: "critical",
        title: "Out of cash",
        cause: `${memo} could not be paid in full`,
      });
    }
  }

  private settlePayables(): void {
    const s = this.state;
    if (s.finance.payableMinor <= 0 || s.finance.cashMinor <= 0) return;
    const paid = Math.min(s.finance.payableMinor, s.finance.cashMinor);
    s.finance.payableMinor -= paid;
    s.finance.cashMinor -= paid;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account: "payables",
      amountMinor: -paid,
      memo: "overdue liabilities settled",
    });
  }

  private pushAlert(alert: AlertRecord): void {
    if (this.state.alerts.some((a) => a.id === alert.id)) return;
    this.state.alerts.push(alert);
  }
}

export const SIMULATION_CITY = CITY;
