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
import { barCovers, barRevenueMinor, BAR_OPEN_MINUTE } from "../fnb/barService";
import {
  deliveryMinutes,
  lateDeliveryComplaints,
  roomServiceOrders,
  ROOM_SERVICE_OPEN_MINUTE,
} from "../fnb/roomService";
import { externalCovers } from "../fnb/externalDemand";
import { averageCoverMinor, menuItem } from "../content/1991/menu";
import { linenSoiled, runLaundryDay, LINEN_SKU } from "../laundry/laundry";
import { bookSlot } from "../wellness/reservations";
import { fitnessCapacity } from "../wellness/fitness";
import { executionLoad, roomBlockNights } from "../eventsales/contracts";
import {
  leadConverts,
  offerPriceMinor,
  qualifyLead,
} from "../eventsales/leads";
import { effectiveCapacity } from "../engineering/assets";
import { isDueForService, preventiveCostMinor } from "../engineering/policy";
import { serviceAsset, toEngineeringAsset } from "../maintenance/maintenance";
import { elevatorTrips, elevatorWaitMinutes } from "../facilities/mobility";
import {
  requiredSecurityStaff,
  securityGapAlert,
} from "../facilities/security";
import {
  changingRoomPressureBp,
  staffAreaCapacity,
} from "../facilities/staffAreas";
import { facilityRow } from "../facilities/facilityBoard";
import { classify } from "../classification/quality";
import {
  specializationBonusBp,
  SPECIALIZATIONS,
} from "../classification/specialization";
import { roomAppeal, segmentFitBp } from "../rooms/product";
import { roomModule, roomProductFor } from "../content/rooms/modules";
import { noisePenaltyBp } from "../renovation/projects";
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
import { STAFF_ROLES, type StaffRole } from "../domain/staffRoles";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import type {
  AlertRecord,
  EventRecord,
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

export { STAFF_ROLES, type StaffRole } from "../domain/staffRoles";

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
  | { type: "START_RENOVATION" }
  | { type: "SET_SPECIALIZATION"; specializationId: string | null };

const CHECKOUT_MINUTE = 660;
const ARRIVAL_MINUTE = 840;
const DEMAND_MINUTE = 600;
const BREAKFAST_START = 390;
const BAR_SERVICE_MINUTE = BAR_OPEN_MINUTE + 120;
const ROOM_SERVICE_MINUTE = ROOM_SERVICE_OPEN_MINUTE + 30;
const WELLNESS_OPEN_MINUTE = 600;
const LAUNDRY_MINUTE = 480;
/** Basis points of in-house guests who ask for a treatment on a given day. */
const WELLNESS_TAKE_UP_BP = 1500;
/** Basis points of in-house guests who use the bar in an evening. */
const BAR_TAKE_UP_BP = 6000;
/** Basis points of days on which a conference enquiry arrives. */
const EVENT_LEAD_CHANCE_BP = 1200;
const MAX_ALERTS = 20;
/** Half a percent chance per day that a worn asset fails, in basis points. */
const DAILY_FAILURE_BP = 50;
/** One receptionist checks in six parties per simulated hour. */
const PARTIES_PER_RECEPTIONIST_PER_HOUR = 6;
/** A room takes half an hour of housekeeping labour. */
const ROOM_CLEAN_MINUTES = 30;
/** Productive minutes one member of staff contributes to a shift. */
const MINUTES_PER_SHIFT = 480;
/** Trips one lift car can make in a day. */
const LIFT_TRIPS_PER_DAY = 400;

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
        case "SET_SPECIALIZATION": {
          if (
            command.specializationId !== null &&
            !SPECIALIZATIONS.some((x) => x.id === command.specializationId)
          )
            return { ok: false, reason: "unknown specialization" };
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
        return this.runFacilities();
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
      case "SET_SPECIALIZATION": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        s.specializationId = command.specializationId;
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
    if (this.dayRolled) {
      // Lift trips and conference housekeeping are per-day loads, so they
      // start each day at zero rather than accumulating forever.
      s.elevatorTrips = 0;
      s.eventHousekeepingMinutes = 0;
    }
  }

  private arrivalsDepartures(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay === CHECKOUT_MINUTE) {
      const leaving = s.stays.filter(
        (stay) => stay.departureDateKey <= s.calendar.dateKey,
      );
      const turned: { moduleId: string }[] = [];
      for (const stay of leaving) {
        const room = s.hotel.rooms.find((r) => r.id === stay.roomId);
        if (room) {
          room.state = "VacantDirty";
          room.cleanliness = 40;
          turned.push({ moduleId: room.moduleId });
        }
      }
      s.linen.dirty += linenSoiled(turned);
      s.elevatorTrips += elevatorTrips({
        arrivals: 0,
        departures: leaving.length,
        serviceRuns: 0,
      });
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

    this.runEventCalendar();

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
      const pieces = roomModule(dirty.moduleId).linenPieces;
      if (s.linen.clean < pieces) {
        this.pushAlert({
          id: "alert.linen-short",
          severity: "warning",
          title: "Out of clean linen",
          cause: "rooms cannot be made up until the laundry catches up",
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
      s.linen.clean -= pieces;
      // Trolleys and linen ride the same lift the guests do.
      s.elevatorTrips += elevatorTrips({
        arrivals: 0,
        departures: 0,
        serviceRuns: 1,
      });
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
      s.elevatorTrips += elevatorTrips({
        arrivals: 1,
        departures: 0,
        serviceRuns: 0,
      });
      booking.status = "checkedIn";
      s.stays.push({
        bookingId: booking.id,
        roomId: target.id,
        rateMinor: booking.rateMinor,
        departureDateKey: addDays(booking.arrivalDateKey, booking.nights),
      });
    }
  }

  /**
   * Every serviced area runs here, in a fixed order, so one house-wide load
   * (a conference, a full night) reaches breakfast, the bar, the spa, the
   * laundry and the lifts through the same quantum.
   */
  private runFacilities(): void {
    this.runBreakfast();
    this.runBar();
    this.runRoomService();
    this.runWellness();
    this.runLaundry();
  }

  private runBreakfast(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== BREAKFAST_START) return;
    const result = serveBreakfast({
      demand: s.stays.length + this.eventBreakfastCovers(),
      seats: STARTER_HOTEL.breakfastSeats,
      kitchenCovers: STARTER_HOTEL.kitchenCovers,
      stock: s.stock["breakfast-portion"] ?? 0,
      priceMinor: STARTER_HOTEL.breakfastPriceMinor,
      minuteOfDay: s.calendar.minuteOfDay,
      // The recipe cost is what the portion actually cost to buy, so the
      // reported contribution reconciles with the purchasing ledger.
      ingredientMinor: supplierForSku("breakfast-portion").unitPriceMinor,
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

  private runBar(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== BAR_SERVICE_MINUTE) return;
    const houseDemand = Math.floor((s.stays.length * BAR_TAKE_UP_BP) / 10000);
    const outside = externalCovers({
      baseCovers: 20,
      seasonalityBp: seasonalityBp(s.calendar.dateKey),
      priceIndexBp: 10000,
      reputationBp: 5000,
    });
    const covers = barCovers({
      seats: STARTER_HOTEL.barSeats,
      staffed: this.onDuty("fnb"),
      demand: houseDemand + outside,
      minuteOfDay: s.calendar.minuteOfDay,
    });
    if (covers <= 0) return;
    const revenue = barRevenueMinor(covers, averageCoverMinor("bar"));
    this.earn(revenue, "barRevenue", `${covers} bar covers`);
    s.finance.month.otherRevenueMinor += revenue;
  }

  private runRoomService(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== ROOM_SERVICE_MINUTE) return;
    const orders = roomServiceOrders({
      occupiedRooms: s.stays.length,
      minuteOfDay: s.calendar.minuteOfDay,
    });
    if (orders <= 0) return;
    const item = menuItem("menu.roomservice.club");
    const minutes = deliveryMinutes({
      kitchen: item.prepMinutes,
      elevator: elevatorWaitMinutes(s.elevatorTrips, this.workingLifts()),
      service: 6,
    });
    s.elevatorTrips += elevatorTrips({
      arrivals: 0,
      departures: 0,
      serviceRuns: orders,
    });
    const revenue = orders * item.priceMinor;
    this.earn(revenue, "roomServiceRevenue", `${orders} room-service orders`);
    s.finance.month.otherRevenueMinor += revenue;
    const late = lateDeliveryComplaints(orders, minutes);
    if (late > 0)
      this.pushAlert({
        id: "alert.room-service-late",
        severity: "warning",
        title: "Room service running late",
        cause: `${minutes} minutes door to door, mostly waiting for the lift`,
      });
  }

  private runWellness(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay === WELLNESS_OPEN_MINUTE) {
      s.wellness = {
        ...s.wellness,
        therapists: this.onDuty("wellness"),
        booked: 0,
      };
      const demand = Math.floor((s.stays.length * WELLNESS_TAKE_UP_BP) / 10000);
      let sold = 0;
      for (let i = 0; i < demand; i++) {
        const outcome = bookSlot(s.wellness, `stay.${i}`);
        if (!outcome.accepted) break;
        s.wellness = outcome.schedule;
        sold += 1;
      }
      if (sold > 0) {
        const revenue = sold * STARTER_HOTEL.wellnessTreatmentPriceMinor;
        this.earn(revenue, "wellnessRevenue", `${sold} treatments`);
        s.finance.month.otherRevenueMinor += revenue;
      }
      if (demand > sold && s.wellness.therapists === 0)
        this.pushAlert({
          id: "alert.spa-unstaffed",
          severity: "warning",
          title: "Spa unstaffed",
          cause: "treatment rooms are open but no therapist is rostered",
        });
    }
  }

  private runLaundry(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== LAUNDRY_MINUTE) return;
    const day = runLaundryDay({
      clean: s.linen.clean,
      dirty: s.linen.dirty,
      // Washing is hot water: a tired boiler is a smaller laundry.
      machine: Math.min(
        STARTER_HOTEL.laundryMachinePieces,
        effectiveCapacity({
          rated: STARTER_HOTEL.laundryMachinePieces,
          condition: this.assetCondition("asset.boiler"),
        }),
      ),
      staffed: this.onDuty("laundry") * STARTER_HOTEL.laundryPiecesPerStaff,
      externalPieces: STARTER_HOTEL.externalLaundryPieces,
    });
    s.linen = { clean: day.clean, dirty: day.dirty };
    if (day.externalCostMinor > 0)
      this.spend(
        day.externalCostMinor,
        "laundry",
        `${day.washedExternally} pieces to contract laundry`,
      );
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
    const technicianShift = this.onDuty("technician") * 240;
    const serviced: string[] = [];
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
      // Planned service happens before a failure, not after one, and costs
      // technician time and money up front.
      if (
        this.dayRolled &&
        technicianShift > 0 &&
        isDueForService({
          minutesSinceService: degraded.minutesSinceService ?? 0,
        })
      ) {
        serviced.push(degraded.id);
        return { ...degraded, ...serviceAsset(degraded, technicianShift) };
      }
      return degraded;
    });

    for (const id of serviced) {
      const asset = s.assets.find((a) => a.id === id);
      if (!asset) continue;
      this.spend(
        preventiveCostMinor({ replacementMinor: asset.replacementMinor }),
        "maintenance",
        `preventive service on ${id}`,
      );
    }

    if (this.dayRolled) {
      const repairCost =
        s.assets.filter((a) => a.status !== "operational").length *
        STARTER_HOTEL.dailyRepairCostMinor;
      if (repairCost) this.spend(repairCost, "maintenance", "repairs");
    }
  }

  private runSatisfaction(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay === ARRIVAL_MINUTE) {
      const gap = securityGapAlert(
        this.onDuty("security"),
        requiredSecurityStaff({
          base: STARTER_HOTEL.baseSecurityStaff,
          eventGuests: this.runningEvents().reduce((n, e) => n + e.guests, 0),
          vipLevel: 0,
        }),
      );
      if (gap)
        this.pushAlert({
          id: "alert.security-short",
          severity: "warning",
          title: "Security understaffed",
          cause: `${gap.short} guards short for ${gap.cause}`,
        });

      const pressureBp = changingRoomPressureBp(
        s.staff.filter((m) => !m.absent).length,
        staffAreaCapacity({ areaSqm: STARTER_HOTEL.staffAreaSqm }),
      );
      if (pressureBp > 0)
        this.pushAlert({
          id: "alert.staff-areas-crowded",
          severity: "warning",
          title: "Back of house overcrowded",
          cause: "changing rooms cannot take the whole shift at once",
        });

      const noiseBp = s.renovation
        ? noisePenaltyBp(s.renovation.project, s.stays.length)
        : 0;
      if (noiseBp > 0)
        this.pushAlert({
          id: "alert.construction-noise",
          severity: "warning",
          title: "Construction noise",
          cause: `${s.stays.length} guests are in the house while the site is live`,
        });
    }

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
    this.generateEventLeads();

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
            // A profile the hotel actually built for lifts what its segment
            // will pay; an undeclared or unbuilt profile lifts nothing.
            willingnessMinor: Math.round(
              (segment.willingnessMinor *
                (10000 + this.specializationBonusFor(segment.id))) /
                10000,
            ),
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
    this.refreshFacilities();
    this.refreshClassification();
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

  private onDuty(role: StaffRole): number {
    return this.state.staff.filter((m) => m.role === role && !m.absent).length;
  }

  private assetCondition(assetId: string): number {
    const asset = this.state.assets.find((a) => a.id === assetId);
    return asset ? Math.round(asset.condition / 100) : 0;
  }

  private workingLifts(): number {
    const lift = this.state.assets.find((a) => a.id === "asset.lift");
    return lift && lift.status === "operational"
      ? STARTER_HOTEL.elevatorCars
      : 0;
  }

  private runningEvents(): EventRecord[] {
    return this.state.events.filter((e) => e.status === "running");
  }

  private eventBreakfastCovers(): number {
    return this.runningEvents().reduce(
      (n, e) => n + executionLoad(e).breakfastCovers,
      0,
    );
  }

  /** Sleeping rooms a confirmed conference holds on a given date. */
  private eventRoomsBlocked(dateKey: string): number {
    return this.state.events
      .filter(
        (e) =>
          e.status !== "complete" &&
          e.startDateKey <= dateKey &&
          addDays(e.startDateKey, e.nights) > dateKey,
      )
      .reduce((n, e) => n + e.roomsBlocked, 0);
  }

  /**
   * Moves conferences in and out and pushes their execution load into the
   * rest of the house: covers, housekeeping minutes and lift trips.
   */
  private runEventCalendar(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== ARRIVAL_MINUTE) return;
    for (const event of s.events) {
      if (
        event.status === "confirmed" &&
        event.startDateKey === s.calendar.dateKey
      ) {
        event.status = "running";
        const load = executionLoad(event);
        // A delegation arrives together: lifts, housekeeping and catering all
        // feel it on the same day.
        s.elevatorTrips += elevatorTrips({
          arrivals: event.roomsBlocked,
          departures: 0,
          serviceRuns: Math.ceil(load.cateringCovers / 20),
        });
        s.eventHousekeepingMinutes += load.housekeepingMinutes;
        continue;
      }
      if (
        event.status === "running" &&
        addDays(event.startDateKey, event.nights) <= s.calendar.dateKey
      ) {
        event.status = "complete";
        s.elevatorTrips += elevatorTrips({
          arrivals: 0,
          departures: event.roomsBlocked,
          serviceRuns: 0,
        });
        this.earn(event.valueMinor, "eventRevenue", `conference ${event.id}`);
        s.finance.month.otherRevenueMinor += event.valueMinor;
      }
    }
    s.events = s.events.filter((e) => e.status !== "complete");
  }

  /** One conference enquiry a week or so, priced against its own budget. */
  private generateEventLeads(): void {
    const s = this.state;
    if (this.streams.events.nextUint32() % 10000 >= EVENT_LEAD_CHANCE_BP)
      return;
    const guests = 40 + (this.streams.events.nextUint32() % 100);
    const nights = 1 + (this.streams.events.nextUint32() % 2);
    const leadDays = 5 + (this.streams.events.nextUint32() % 20);
    const roomsBlocked = Math.min(
      Math.floor(s.hotel.rooms.length / 3),
      Math.floor(guests / 4),
    );
    const budgetMinor =
      guests * nights * (9000 + (this.streams.events.nextUint32() % 4000));
    const lead = {
      id: `lead.${s.elapsedMinutes}`,
      guests,
      nights,
      budgetMinor,
      leadDays,
    };
    if (!qualifyLead(lead).ok) return;
    const offer = offerPriceMinor({ guests, nights, roomsBlocked });
    if (!leadConverts(lead, offer)) return;
    s.events.push({
      id: `event.${s.elapsedMinutes}`,
      guests,
      nights,
      roomsBlocked,
      startDateKey: addDays(s.calendar.dateKey, leadDays),
      valueMinor: offer,
      status: "confirmed",
    });
    this.pushAlert({
      id: `alert.event.${s.elapsedMinutes}`,
      severity: "info",
      title: "Conference booked",
      cause: `${guests} delegates for ${nights} day(s), ${roomsBlocked} rooms blocked`,
    });
  }

  /** The board rows the UI and the Pixi layer both read. */
  private refreshFacilities(): void {
    const s = this.state;
    const inHouse = s.stays.length;
    const eventCovers = this.eventBreakfastCovers();
    const housekeepers = this.onDuty("housekeeping");
    const dirtyRooms = s.hotel.rooms.filter(
      (r) => r.state === "VacantDirty",
    ).length;

    s.facilities = [
      facilityRow({
        id: "facility.breakfast_room",
        name: "Breakfast room",
        demand: inHouse + eventCovers,
        constraints: [
          { label: "seating", value: STARTER_HOTEL.breakfastSeats * 8 },
          { label: "kitchen line", value: STARTER_HOTEL.kitchenCovers },
          {
            label: "portions in stock",
            value: s.stock["breakfast-portion"] ?? 0,
          },
        ],
      }),
      facilityRow({
        id: "facility.bar",
        name: "Bar and lounge",
        demand: Math.floor((inHouse * BAR_TAKE_UP_BP) / 10000),
        constraints: [
          { label: "seating", value: STARTER_HOTEL.barSeats * 7 },
          { label: "staffed throughput", value: this.onDuty("fnb") * 40 },
        ],
      }),
      facilityRow({
        id: "facility.wellness",
        name: "Wellness",
        demand: Math.floor((inHouse * WELLNESS_TAKE_UP_BP) / 10000),
        constraints: [
          {
            label: "treatment rooms",
            value: Math.floor(
              s.wellness.treatmentRooms * (s.wellness.openMinutes / 45),
            ),
          },
          {
            label: "therapists on duty",
            value: Math.floor(
              this.onDuty("wellness") * (s.wellness.openMinutes / 45),
            ),
          },
        ],
      }),
      facilityRow({
        id: "facility.fitness",
        name: "Fitness",
        demand: Math.floor(inHouse / 5),
        constraints: [
          {
            label: "stations and floor area",
            value: fitnessCapacity({
              areaSqm: STARTER_HOTEL.fitnessSqm,
              equipmentStations: STARTER_HOTEL.fitnessStations,
            }),
          },
        ],
      }),
      facilityRow({
        id: "facility.conference",
        name: "Conference",
        demand: this.runningEvents().reduce((n, e) => n + e.guests, 0),
        constraints: [
          { label: "hall capacity", value: STARTER_HOTEL.conferenceCapacity },
        ],
      }),
      facilityRow({
        id: "facility.housekeeping",
        name: "Housekeeping",
        demand: dirtyRooms * ROOM_CLEAN_MINUTES + s.eventHousekeepingMinutes,
        constraints: [
          {
            label: "housekeepers on duty",
            value: housekeepers * MINUTES_PER_SHIFT,
          },
          { label: "clean linen", value: s.linen.clean * ROOM_CLEAN_MINUTES },
        ],
      }),
      facilityRow({
        id: "facility.laundry",
        name: "Laundry",
        demand: s.linen.dirty,
        constraints: [
          {
            label: "machine capacity",
            value: effectiveCapacity({
              rated: STARTER_HOTEL.laundryMachinePieces,
              condition: this.assetCondition("asset.boiler"),
            }),
          },
          {
            label: "laundry staff",
            value: this.onDuty("laundry") * STARTER_HOTEL.laundryPiecesPerStaff,
          },
        ],
      }),
      facilityRow({
        id: "facility.elevator",
        name: "Lifts",
        demand: s.elevatorTrips,
        constraints: [
          {
            label: "cars in service",
            value: this.workingLifts() * LIFT_TRIPS_PER_DAY,
          },
        ],
      }),
      facilityRow({
        id: "facility.security",
        name: "Security",
        demand: requiredSecurityStaff({
          base: STARTER_HOTEL.baseSecurityStaff,
          eventGuests: this.runningEvents().reduce((n, e) => n + e.guests, 0),
          vipLevel: 0,
        }),
        constraints: [
          { label: "guards rostered", value: this.onDuty("security") },
        ],
      }),
      facilityRow({
        id: "facility.staff_area",
        name: "Staff areas",
        demand: s.staff.filter((m) => !m.absent).length,
        constraints: [
          {
            label: "changing room space",
            value: staffAreaCapacity({ areaSqm: STARTER_HOTEL.staffAreaSqm }),
          },
        ],
      }),
    ];
  }

  /** The star rating and the standard that is holding it back. */
  private refreshClassification(): void {
    const s = this.state;
    const rooms = s.hotel.rooms;
    const roomScore = rooms.length
      ? Math.round(
          rooms.reduce(
            (sum, r) =>
              sum +
              roomAppeal(
                roomProductFor(r.moduleId, {
                  condition: r.cleanliness,
                  styleAgeYears: r.styleAgeYears,
                }),
              ).appeal,
            0,
          ) / rooms.length,
        )
      : 0;
    const maintenance = s.assets.length
      ? Math.round(
          s.assets.reduce(
            (sum, a) => sum + toEngineeringAsset(a, a.rated).condition,
            0,
          ) / s.assets.length,
        )
      : 0;
    // Reception quality is service reality: how many parties are still waiting.
    const reception = Math.max(0, 100 - s.receptionQueue.length * 10);
    const facilities = Math.min(
      100,
      Math.round((STARTER_HOTEL.conferenceSqm + STARTER_HOTEL.wellnessSqm) / 5),
    );
    s.classification = classify({
      room: roomScore,
      reception,
      maintenance,
      facilities,
    });
  }

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
          category: roomModule(step.job.targetModuleId).category,
          state: "VacantClean",
          cleanliness: 100,
          moduleId: step.job.targetModuleId,
          styleAgeYears: 0,
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
    // A conference holds its sleeping rooms out of general sale.
    return Math.max(0, total - held - this.eventRoomsBlocked(dateKey));
  }

  /** Demand bonus for a declared profile the hotel has actually invested in. */
  private specializationBonusFor(segmentId: string): number {
    const id = this.state.specializationId;
    if (!id) return 0;
    const spec = SPECIALIZATIONS.find((x) => x.id === id);
    if (!spec || spec.segmentId !== segmentId) return 0;
    return specializationBonusBp(id, {
      conferenceSqm: STARTER_HOTEL.conferenceSqm,
      wellnessSqm: STARTER_HOTEL.wellnessSqm,
    });
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
