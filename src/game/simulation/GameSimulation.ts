import {
  captureRngState,
  createRngStreams,
  restoreRngStreams,
} from "../domain/rng";
import { CITY, seasonalityBp } from "../content/1991/frankfurt";
import { pickSegment } from "../content/1991/guestSegments";
import { STARTER_HOTEL } from "../content/1991/starterHotel";
import { supplierForSku } from "../content/1991/suppliers";
import {
  canWalkIn,
  cancel,
  checkIn,
  checkOut,
  holdsRoomOn,
  lateChargeMinor,
  markNoShow,
  reserve,
} from "../bookings/bookingEngine";
import type { BookingChannel } from "../bookings/bookingTypes";
import {
  getRate,
  isRoomCategory,
  setRate,
  ROOM_CATEGORIES,
  type RoomCategory,
} from "../revenue/rates";
import {
  advanceCityMonth,
  allocateCityDay,
  recordPlayerRoomNights,
  type PlayerHouse,
} from "../city/cityMarket";
import { totalRoomNights } from "../city/demand";
import {
  forecastBand,
  MAX_INFORMATION_QUALITY,
  qualityAfterReport,
  REPORT_COST_MINOR,
} from "../marketResearch/forecast";
import { marketWageMinor } from "../labor/market";
import { BASE_MONTHLY_WAGE_MINOR } from "../content/1991/cityMarket";
import {
  adrMinor,
  occupancyBasisPoints,
  revParMinor,
} from "../revenue/metrics";
import { assignRoom, processReceptionQueue } from "../guests/guestJourney";
import {
  authorizeRecovery,
  complaintForWait,
  resolveComplaint,
} from "../guests/complaints";
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
import {
  serviceAsset,
  toEngineeringAsset,
  SERVICE_MINUTES,
} from "../maintenance/maintenance";
import { elevatorTrips, elevatorWaitMinutes } from "../facilities/mobility";
import { createUtilityState, meterUtilities } from "../facilities/utilities";
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
  expansionCostMinor,
  specializationBonusBp,
  EXPANDABLE_AREAS,
  EXPANSION_SQM,
  SPECIALIZATIONS,
  type ExpandableArea,
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
import { compareIds } from "../domain/ids";
import { STAFF_ROLES, type StaffRole } from "../domain/staffRoles";
import {
  commandEnvelope,
  type CommandActor,
  type CommandEnvelope,
  type CommandResult,
  type GameCommand,
} from "../commands/commandEnvelope";
import {
  CommandHandler,
  type CommandExecutor,
  type RngStreams,
} from "../commands/commandHandler";
import { QUANTUM_MINUTES, advanceClock } from "./clock";
import { assertInvariants } from "./invariants";
import {
  createEventJournal,
  drainEvents,
  emitEvent,
} from "../domain/eventBuffer";
import type { DomainEvent, DomainEventPayload } from "../domain/events";
import {
  createGuestSatisfaction,
  createRenderDescriptors,
  createSavePolicyMetadata,
  type AlertRecord,
  type EventRecord,
  type GameState,
  type ReservationRecord,
  type RoomRecord,
  type StayRecord,
} from "./initialState";
import { createNarrativeState } from "../narrative/narrativeState";
import { detectMilestones } from "../milestones/milestoneEngine";
import { appendChronicleEntry } from "../chronicle/chronicle";
import {
  chooseEndlessContinuation,
  type RecoveryPath,
} from "../campaign/careerOutcome";
import {
  careerFacts,
  applyRecoveryPath,
  validateRecoveryPath,
} from "../campaign/recovery";
import {
  createCampaignConfig,
  adjustedStartingCapitalMinor,
  DIFFICULTY_IDS,
} from "../campaign/campaignConfig";
import {
  refreshCareerOutcome,
  resolveNarrativeChoice,
  runNarrativeMonth,
  validateNarrativeChoice,
} from "../narrative/narrativeSystem";
import { createWorldState, WorldSimulation } from "../world/WorldSimulation";
import {
  adoptionCostMinor,
  advanceTechnologyProject,
} from "../technology/adoption";
import {
  advanceBookingChannels,
  availableChannels,
  netChannelRevenueMinor,
} from "../distribution/channelEvolution";
import { createRevenuePolicy } from "../revenue/revenuePolicy";
import { createCompanyState } from "../company/companyState";
import { createCommercialState } from "../commercial/commercialState";
import {
  applyReputationEvent,
  createReputationState,
  decayReputation,
} from "../reputation/dimensions";
import { earnPoints, releaseBreakageMinor } from "../commercial/loyalty";
import { recordStay as recordCrmStay } from "../commercial/crm";
import {
  createContract as createEmploymentContract,
  createWorkforceState,
  employ,
  markSick,
  fallsSick,
  resign,
  returnToWork,
  startEmploymentMonth,
  willResign,
  workOvertime,
} from "../staff/employeeLifecycle";
import { createProcurementState } from "../purchasing/contracts";
import { createManagerAuthority } from "../management/managerAuthority";
import {
  beginStay,
  createGuestRelationsState,
  createParty,
  recordStayEvent,
  registerParty,
} from "../guests/partyLifecycle";
import {
  applyRecovery,
  openComplaint,
  satisfactionAfterRecovery,
} from "../guests/recoveryAuthority";
import {
  createCommercialSpaceState,
  isOpen as isSpaceOpen,
  monthlyContributionMinor,
  recordUse,
  securityLoad,
  spaceThroughput,
  startSpaceMonth,
} from "../facilities/commercialSpaces";
import {
  automationFailureModes,
  availableSelfService,
  deflectedDemand,
  emptyLobbyDemand,
  lobbyThroughput,
} from "../facilities/lobbyAutomation";
import {
  applyCompanyCommand,
  isCompanyCommand,
  validateCompanyCommand,
} from "../company/companyCommands";
import { runCompanyMonth, syncTreasury } from "../company/companyMonth";
import {
  capitaliseAsset,
  createStatements,
  depreciationMinor,
  postDepreciation,
} from "../finance/statements";
import {
  createInsuranceState,
  totalMonthlyPremiumMinor,
} from "../risk/insurance";
import {
  UTILITY_KINDS,
  createUtilityContracts,
  readMeters,
  standingChargeMinor,
  utilityUsageMinor,
  wasteDisposalMinor,
} from "../utilities/consumption";
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

// The command union and its envelope live in src/game/commands: the
// simulation executes commands, it does not define what a command is.
export type {
  CommandActor,
  CommandEnvelope,
  CommandResult,
  GameCommand,
} from "../commands/commandEnvelope";

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
/** How long a plant asset is written down over; a balancing constant. */
const ASSET_USEFUL_LIFE_MONTHS = 120;
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
/** Productive minutes one technician contributes to a day. */
const TECHNICIAN_MINUTES_PER_DAY = 240;
/** Technician minutes a breakdown repair is allowed each day. */
const REPAIR_MINUTES_PER_DAY = 120;
/** Days a finished booking is kept on the books for its own history. */
const BOOKING_RETENTION_DAYS = 30;
/** Share of the first night an unhonoured booking is charged, in bp. */
const LATE_CHARGE_BP = 10000;
/** Chance in basis points that a future booking cancels on a given day. */
const DAILY_CANCELLATION_BP = 300;
/** Chance in basis points that an unguaranteed party never turns up. */
const NO_SHOW_BP = 400;
/** Condition alerts re-decided at every arrival wave. */
const ARRIVAL_ALERT_IDS = [
  "alert.security-short",
  "alert.staff-areas-crowded",
  "alert.construction-noise",
];
const HANDLED_COMPLAINT_LIMIT = 256;
/** The minute of the hotel day the commercial spaces are settled for. */
const SHOP_TRADING_MINUTE = 1080;
/** Share of the house's waste that is actually sorted before collection. */
const SORTED_WASTE_BP = 2500;

const WATER_UNIT_MINOR = 2;
const ENERGY_UNIT_MINOR = 3;

export class GameSimulation implements CommandExecutor {
  private queued: CommandEnvelope[] = [];
  private decided: CommandResult[] = [];
  private streams: RngStreams;
  private dayRolled = false;
  private monthRolled = false;
  /** The one boundary through which authoritative state may change. */
  private readonly commands: CommandHandler;
  /** The command currently executing, so its events can name their cause. */
  private causingCommandId: string | undefined;

  constructor(public state: GameState) {
    // A save written before the command and event journals existed carries
    // neither. Opening it at zero is the honest reading — nothing is known
    // about decisions taken before the journal did — and it keeps a migrated
    // old save runnable rather than crashing on its first derived section.
    state.stateVersion ??= 0;
    state.commandSequence ??= 0;
    state.commandLog ??= [];
    state.eventJournal ??= createEventJournal();
    state.guestSatisfaction ??= createGuestSatisfaction();
    state.handledComplaintIds ??= [];
    state.utilities ??= createUtilityState();
    state.utilities.pendingExpenseMinor ??= 0;
    state.renderDescriptors ??= createRenderDescriptors(state.hotel.rooms);
    state.savePolicy ??= createSavePolicyMetadata();
    state.linen.floorStock ??= 0;
    state.world ??= createWorldState();
    state.revenuePolicy ??= createRevenuePolicy();
    state.technologyProjects ??= [];
    state.technologyImplementations ??= [];
    state.company ??= createCompanyState();
    state.statements ??= createStatements();
    state.insurance ??= createInsuranceState();
    state.utilityContracts ??= createUtilityContracts();
    state.meters ??= { energy: 0, water: 0, waste: 0 };
    state.outages ??= [];
    state.commercial ??= createCommercialState();
    state.reputation ??= createReputationState();
    state.workforce ??= createWorkforceState();
    state.procurement ??= createProcurementState();
    state.guestRelations ??= createGuestRelationsState();
    state.recoveries ??= [];
    // A loaded game's career reading comes from the position it is actually
    // in, never from an optimistic constant a fresh game would have had.
    state.narrative ??= createNarrativeState({ career: careerFacts(state) });
    state.rngState.narrative ??= createRngStreams(state.seed).narrative.state;
    state.commercialSpaces ??= createCommercialSpaceState();
    state.lobby ??= {
      served: 0,
      unserved: 0,
      cause: "lobby is coping",
      automation: [],
    };
    this.streams = restoreRngStreams(state.rngState);
    this.commands = new CommandHandler(
      () => this.state,
      (next) => {
        this.state = next;
        // The committed draft owns the RNG cursor now; the streams the rest of
        // the quantum draws from have to be the ones that were committed.
        this.streams = restoreRngStreams(next.rngState);
      },
      this,
    );
  }

  get pendingCommandCount(): number {
    return this.queued.length;
  }

  /**
   * Verdicts for commands the commands phase has actually decided, drained by
   * the Worker so an acknowledgement describes an applied command rather than
   * a queued one.
   */
  takeCommandResults(): CommandResult[] {
    const decided = this.decided;
    this.decided = [];
    return decided;
  }

  /** Publishes the completed facts recorded since the last drain, in order. */
  takeDomainEvents(): DomainEvent[] {
    return drainEvents(this.state.eventJournal);
  }

  /**
   * Records a completed transition. Called only after the write it describes,
   * and inside a command it inherits that command as its cause.
   */
  private emit(payload: DomainEventPayload, entities: readonly string[]): void {
    emitEvent(this.state.eventJournal, payload, {
      atMinutes: this.state.elapsedMinutes,
      entities,
      causedBy: this.causingCommandId,
    });
  }

  /**
   * Queues a payload as a well-formed envelope. The id is derived from
   * authoritative state so an uninterrupted run and a replay agree on it.
   */
  queueCommand(command: GameCommand, actor: CommandActor = "player"): void {
    this.queueEnvelope(
      commandEnvelope({
        commandId: `cmd.${this.state.commandSequence + this.queued.length}.${command.type}`,
        issuedAtMinutes: this.state.elapsedMinutes,
        actor,
        payload: command,
      }),
    );
  }

  queueEnvelope(envelope: CommandEnvelope): void {
    this.queued.push(envelope);
  }

  /**
   * Decides a batch of envelopes immediately through the command boundary.
   * This is what the Worker calls, so an acknowledgement can describe an
   * applied command rather than a queued one.
   */
  submitCommands(envelopes: readonly CommandEnvelope[]): CommandResult[] {
    const results = this.commands.run(envelopes);
    // Derived sections are only recomputed when something actually changed: a
    // batch that was refused in full must leave the snapshot untouched.
    if (results.some((r) => r.status === "accepted")) this.refreshMetrics();
    assertInvariants(this.state);
    return results;
  }

  /**
   * Pre-flight rules check. It answers from the state it is given and must
   * never write to it: a question about a command may not be answered by
   * having started to carry it out.
   */
  validateCommand(
    command: GameCommand,
    state: GameState = this.state,
  ): { ok: true } | { ok: false; reason: string } {
    const s = state;
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
              // The city's labour market sets the floor; a tight market has
              // to be paid for, not wished away.
              marketWageMinor: this.marketWageMinor(s),
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
        case "EXPAND_FACILITY": {
          if (!EXPANDABLE_AREAS.includes(command.area))
            return { ok: false, reason: "unknown facility area" };
          if (s.finance.cashMinor < expansionCostMinor())
            return { ok: false, reason: "insufficient cash" };
          return { ok: true };
        }
        case "BUY_MARKET_RESEARCH":
          if (s.cityMarket.informationQuality >= MAX_INFORMATION_QUALITY)
            return {
              ok: false,
              reason: "market information is already complete",
            };
          if (s.finance.cashMinor < REPORT_COST_MINOR)
            return { ok: false, reason: "insufficient cash" };
          return { ok: true };
        case "ADOPT_TECHNOLOGY": {
          const technology = s.world.technologies.find(
            (candidate) => candidate.id === command.technologyId,
          );
          if (!technology) return { ok: false, reason: "unknown technology" };
          if (technology.adoptionBp < 500)
            return {
              ok: false,
              reason: "technology is not commercially available",
            };
          if (
            s.technologyImplementations.includes(command.technologyId) ||
            s.technologyProjects.some(
              (project) => project.technologyId === command.technologyId,
            )
          )
            return {
              ok: false,
              reason: "technology already adopted or in progress",
            };
          if (
            s.finance.cashMinor <
            adoptionCostMinor(2_000_000, technology.adoptionBp)
          )
            return { ok: false, reason: "insufficient cash" };
          return { ok: true };
        }
        case "SET_CAMPAIGN_DIFFICULTY":
          if (!DIFFICULTY_IDS.includes(command.difficulty))
            return { ok: false, reason: "unknown difficulty" };
          // Difficulty is part of what the campaign is. Changing it after the
          // first day would make the run unreplayable and the career a lie.
          if (s.elapsedMinutes > 0)
            return { ok: false, reason: "the career has already started" };
          return { ok: true };
        case "RESOLVE_NARRATIVE_EVENT":
          return validateNarrativeChoice(s, command.eventId, command.choiceId);
        case "TAKE_RECOVERY_MEASURE":
          return validateRecoveryPath(s, command.path);
        case "CONTINUE_ENDLESS_CAREER":
          if (!s.narrative.career.careerMilestone2026)
            return {
              ok: false,
              reason: "the 2026 review has not been reached",
            };
          return { ok: true };
        default:
          if (isCompanyCommand(command))
            return validateCompanyCommand(s, command);
          return { ok: false, reason: "unknown command" };
      }
    } catch (error) {
      return { ok: false, reason: (error as Error).message };
    }
  }

  /** The `CommandExecutor` rules half; see `validateCommand`. */
  validate(
    state: GameState,
    command: GameCommand,
  ): { ok: true } | { ok: false; reason: string } {
    return this.validateCommand(command, state);
  }

  /**
   * The `CommandExecutor` write half. The draft and its RNG streams stand in
   * for the live ones for exactly as long as the command runs, so every
   * existing rule writes through the transaction without knowing about it.
   * Throwing rejects the command and discards the draft entirely.
   */
  apply(
    draft: GameState,
    streams: RngStreams,
    envelope: CommandEnvelope,
  ): void {
    const liveState = this.state;
    const liveStreams = this.streams;
    this.state = draft;
    this.streams = streams;
    this.causingCommandId = envelope.commandId;
    try {
      this.applyCommand(envelope.payload);
    } finally {
      this.state = liveState;
      this.streams = liveStreams;
      this.causingCommandId = undefined;
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

  /**
   * Recomputes the derived sections (facility board, classification, metrics)
   * without advancing time, so a freshly initialised or loaded game publishes
   * a correct board before the first quantum runs.
   */
  refreshDerivedState(): void {
    this.refreshMetrics();
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
    if (this.queued.length === 0) return;
    const batch = this.queued;
    this.queued = [];
    // Verdicts travel out through the protocol, not through game state: an
    // alert here would be authoritative state changing on a rejection, which
    // is exactly what the transactional boundary promises not to do. The
    // command journal already records every refusal.
    this.decided.push(...this.commands.run(batch));
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
        this.emit(
          {
            type: "SUPPLY_ORDERED",
            sku: command.sku,
            quantity: command.quantity,
            costMinor: s.finance.cashMinor - result.cashMinor,
          },
          [supplier.id, command.sku],
        );
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
            marketWageMinor: this.marketWageMinor(),
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
        // A new hire is a person under a contract, not another rota row.
        s.workforce = employ(s.workforce, {
          id: `employee.${hired.id}`,
          staffId: hired.id,
          contract: createEmploymentContract({
            monthlyWageMinor: hired.monthlyWageMinor,
          }),
          skill: hired.skill,
        });
        this.emit(
          {
            type: "STAFF_HIRED",
            staffId: hired.id,
            role: hired.role,
            shift: hired.shift,
          },
          [hired.id],
        );
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
        this.emit(
          {
            type: "RENOVATION_STARTED",
            projectId: started.job.id,
            targetModuleId: started.job.targetModuleId,
          },
          [started.job.id],
        );
        return;
      }
      case "SET_SPECIALIZATION": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        s.specializationId = command.specializationId;
        this.emit(
          {
            type: "SPECIALIZATION_SET",
            specializationId: command.specializationId,
          },
          [s.hotel.id],
        );
        return;
      }
      case "EXPAND_FACILITY": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        // Building the area is CapEx; the profile only starts paying once the
        // floor space actually exists.
        this.spend(
          expansionCostMinor(),
          "capex",
          `${EXPANSION_SQM} sqm more ${command.area}`,
        );
        s.investedArea = {
          ...s.investedArea,
          [command.area]: s.investedArea[command.area] + EXPANSION_SQM,
        };
        this.emit(
          {
            type: "FACILITY_EXPANDED",
            area: command.area,
            addedSqm: EXPANSION_SQM,
          },
          [s.hotel.id],
        );
        return;
      }
      case "BUY_MARKET_RESEARCH": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        this.spend(REPORT_COST_MINOR, "marketResearch", "city market report");
        s.cityMarket.informationQuality = qualityAfterReport(
          s.cityMarket.informationQuality,
        );
        s.cityMarket.forecast = forecastBand(
          totalRoomNights(s.cityMarket.demand),
          s.cityMarket.informationQuality,
        );
        this.emit(
          {
            type: "MARKET_RESEARCH_PURCHASED",
            informationQuality: s.cityMarket.informationQuality,
            costMinor: REPORT_COST_MINOR,
          },
          [s.hotel.id],
        );
        return;
      }
      case "ADOPT_TECHNOLOGY": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        const technology = s.world.technologies.find(
          (candidate) => candidate.id === command.technologyId,
        )!;
        const costMinor = adoptionCostMinor(2_000_000, technology.adoptionBp);
        this.spend(costMinor, "capex", command.technologyId);
        const projectId = `technology-project.${command.technologyId}`;
        s.technologyProjects.push({
          id: projectId,
          technologyId: command.technologyId,
          status: "planned",
          remainingMonths: 6,
          costMinor,
        });
        this.emit(
          {
            type: "TECHNOLOGY_ADOPTION_STARTED",
            projectId,
            technologyId: command.technologyId,
            costMinor,
          },
          [projectId, command.technologyId],
        );
        return;
      }
      case "SET_CAMPAIGN_DIFFICULTY": {
        const campaign = createCampaignConfig(
          command.difficulty,
          s.narrative.campaign.sandbox,
        );
        s.narrative.campaign = campaign;
        // The disclosed inputs are the whole of what difficulty does: the
        // opening balance and what the bank charges, both visible up front.
        const opening = adjustedStartingCapitalMinor(
          STARTER_HOTEL.startingCashMinor,
          campaign,
        );
        // Posted, not assigned: the opening balance is the ledger's business
        // too, and cash that appears beside it is cash that cannot be audited.
        const delta = opening - s.finance.cashMinor;
        if (delta !== 0) {
          s.finance.cashMinor += delta;
          // The month's opening balance is what the close measures the cash
          // movement against; leaving it behind would report a delta the
          // hotel never traded.
          s.finance.month.openingCashMinor = opening;
          s.finance.ledger = postEntry(s.finance.ledger, {
            day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
            account: "capital",
            amountMinor: delta,
            memo: `opening capital at ${campaign.difficulty}`,
          });
        }
        s.loan = {
          ...s.loan,
          annualRateBasisPoints: Math.trunc(
            (STARTER_HOTEL.startingLoan.annualRateBasisPoints *
              campaign.inputs.creditSpreadBasisPoints) /
              10_000,
          ),
        };
        syncTreasury(s);
        refreshCareerOutcome(s);
        this.emit(
          {
            type: "CAMPAIGN_DIFFICULTY_SET",
            difficulty: campaign.difficulty,
            openingCapitalDeltaMinor: delta,
          },
          [s.company.companyId],
        );
        return;
      }
      case "RESOLVE_NARRATIVE_EVENT": {
        resolveNarrativeChoice(s, command.eventId, command.choiceId, {
          emit: (payload, entities) => this.emit(payload, entities),
          spend: (amountMinor, account, memo) =>
            this.spend(amountMinor, account, memo),
          earn: (amountMinor, account, memo) =>
            this.earn(amountMinor, account, memo),
        });
        syncTreasury(s);
        refreshCareerOutcome(s);
        return;
      }
      case "TAKE_RECOVERY_MEASURE": {
        const taken = applyRecoveryPath(s, command.path as RecoveryPath, {
          earn: (amountMinor, account, memo) =>
            this.earn(amountMinor, account, memo),
          spend: (amountMinor, account, memo) =>
            this.spend(amountMinor, account, memo),
        });
        syncTreasury(s);
        refreshCareerOutcome(s);
        this.emit(
          {
            type: "RECOVERY_MEASURE_TAKEN",
            measure: taken.measure,
            amountMinor: taken.amountMinor,
          },
          [s.company.companyId],
        );
        return;
      }
      case "CONTINUE_ENDLESS_CAREER": {
        s.narrative.career = chooseEndlessContinuation(s.narrative.career);
        this.emit(
          {
            type: "ENDLESS_CAREER_CONTINUED",
            dateKey: s.calendar.dateKey,
          },
          [s.company.companyId],
        );
        return;
      }
      default: {
        if (!isCompanyCommand(command))
          throw new Error(`unknown command ${(command as GameCommand).type}`);
        // The corporate layer writes through the same draft, so an
        // acquisition that fails halfway takes the whole command with it.
        applyCompanyCommand(s, command, {
          emit: (payload, entities) => this.emit(payload, entities),
          spend: (amountMinor, account, memo) =>
            this.spend(amountMinor, account, memo),
        });
        // Group cash moved; the treasury has to say so in the same breath.
        syncTreasury(s);
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
      // Outstanding conference work does not evaporate overnight; only the
      // day's worked total starts again at zero.
      s.eventHousekeepingWorkedMinutes = 0;
      s.utilities.waterUsed = 0;
      s.utilities.energyUsed = 0;
      this.runEmploymentDay();
    }
    // A fit-out dates by the calendar, not by wear: on every new year every
    // room is one year further from being current.
    if (this.dayRolled && before.slice(0, 4) !== s.calendar.dateKey.slice(0, 4))
      for (const room of s.hotel.rooms) room.styleAgeYears += 1;
  }

  private arrivalsDepartures(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay === CHECKOUT_MINUTE) {
      const leaving = s.stays.filter(
        (stay) => stay.departureDateKey <= s.calendar.dateKey,
      );
      const turned: { moduleId: string }[] = [];
      for (const stay of leaving) {
        const booking = s.reservations.find((b) => b.id === stay.bookingId);
        if (booking && booking.status === "checkedIn") {
          const completed = checkOut(booking, s.elapsedMinutes);
          booking.status = completed.status;
          booking.history = completed.history;
        }
        const room = s.hotel.rooms.find((r) => r.id === stay.roomId);
        if (room) {
          const from = room.state;
          room.state = "VacantDirty";
          room.cleanliness = 40;
          turned.push({ moduleId: room.moduleId });
          this.emit(
            {
              type: "GUEST_CHECKED_OUT",
              bookingId: stay.bookingId,
              roomId: room.id,
            },
            [stay.bookingId, room.id],
          );
          this.emit(
            {
              type: "ROOM_STATE_CHANGED",
              roomId: room.id,
              from,
              to: room.state,
            },
            [room.id],
          );
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
          booking.status !== "confirmed" ||
          booking.arrivalDateKey !== s.calendar.dateKey
        )
          continue;
        // A room held on trust is the one that can go unclaimed. A party who
        // has already paid at the desk always arrives.
        const turnsUp =
          booking.terms.guaranteed ||
          this.streams.guests.nextUint32() % 10000 >= NO_SHOW_BP;
        if (!turnsUp) continue;
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
          const updated = markNoShow(booking, s.elapsedMinutes);
          booking.status = updated.status;
          booking.history = updated.history;
          // The terms the booking was taken on decide what may be charged.
          const charge = lateChargeMinor(booking, yesterday);
          if (charge > 0) {
            this.earn(charge, "otherRevenue", `no-show ${booking.id}`);
            s.finance.month.otherRevenueMinor += charge;
          }
          this.emit(
            {
              type: "BOOKING_NO_SHOW",
              bookingId: booking.id,
              releasedRooms: booking.roomsRequested,
            },
            [booking.id],
          );
        }
      }
      // A finished booking is kept for a while rather than dropped the
      // moment it ends: its status history is what makes the stay auditable,
      // and a fixed retention window keeps that bounded.
      s.reservations = s.reservations.filter((b) => {
        if (b.status === "confirmed" || b.status === "checkedIn") return true;
        const ended = addDays(b.arrivalDateKey, b.nights);
        return addDays(ended, BOOKING_RETENTION_DAYS) > s.calendar.dateKey;
      });
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
    if (s.linen.clean > 0) this.clearAlerts(["alert.linen-short"]);

    // Conference set-up and hall turnarounds are real work and are done
    // first: they compete with room turnaround for the same shift, which is
    // what makes an oversold event visible as dirty rooms.
    if (s.eventHousekeepingMinutes > 0 && s.housekeepingMinutes > 0) {
      const spent = Math.min(s.eventHousekeepingMinutes, s.housekeepingMinutes);
      s.eventHousekeepingMinutes -= spent;
      s.housekeepingMinutes -= spent;
      s.eventHousekeepingWorkedMinutes += spent;
    }

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
        this.clearAlerts(["alert.linen-short"]);
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
      const wasState = dirty.state;
      dirty.state = cleaned.room.state;
      this.emit(
        {
          type: "ROOM_STATE_CHANGED",
          roomId: dirty.id,
          from: wasState,
          to: dirty.state,
        },
        [dirty.id],
      );
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
      // A party takes every room it booked, or it keeps waiting. Handing a
      // three-room booking one room would leave the other two held out of
      // sale for the whole stay and never billed, so the assignment is all
      // or nothing.
      const assigned: RoomRecord[] = [];
      for (let i = 0; i < booking.roomsRequested; i++) {
        const free = assignRoom(
          s.hotel.rooms.filter((r) => !assigned.some((a) => a.id === r.id)),
          booking.category,
        );
        if (!free) break;
        assigned.push(
          s.hotel.rooms.find((r) => r.id === free.id) as RoomRecord,
        );
      }
      if (assigned.length < booking.roomsRequested) continue;

      // Read the wait before the party leaves the queue: how long check-in
      // took is part of what just happened to this guest.
      const waitedMinutes =
        s.receptionQueue.find((w) => w.bookingId === bookingId)
          ?.waitedMinutes ?? 0;
      s.receptionQueue = s.receptionQueue.filter(
        (w) => w.bookingId !== bookingId,
      );
      const arrived = checkIn(booking, s.elapsedMinutes);
      booking.status = arrived.status;
      booking.history = arrived.history;
      this.openPartyStay(booking, assigned[0].id, waitedMinutes);
      // The whole party rides up together.
      s.elevatorTrips += elevatorTrips({
        arrivals: assigned.length,
        departures: 0,
        serviceRuns: 0,
      });
      for (const target of assigned) {
        const fromState = target.state;
        target.state = "Occupied";
        this.emit(
          {
            type: "GUEST_CHECKED_IN",
            bookingId: booking.id,
            roomId: target.id,
            waitedMinutes,
          },
          [booking.id, target.id],
        );
        this.emit(
          {
            type: "ROOM_STATE_CHANGED",
            roomId: target.id,
            from: fromState,
            to: target.state,
          },
          [target.id],
        );
        s.stays.push({
          bookingId: booking.id,
          roomId: target.id,
          rateMinor: booking.rateMinor,
          departureDateKey: addDays(booking.arrivalDateKey, booking.nights),
        });
      }
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
    // Metered before the wash: facility.laundry is charged for the linen it
    // is about to put through, not for the empty pile it leaves behind.
    if (this.state.calendar.minuteOfDay === LAUNDRY_MINUTE)
      this.meterDailyUtilities();
    this.runLaundry();
    this.runCommercialSpaces();
  }

  /**
   * The parts of the house that are not bedrooms. Each space trades on its
   * own hours, capacity and staffing, and what it earns depends on who
   * operates it rather than on a flat share of guests.
   */
  private runCommercialSpaces(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== SHOP_TRADING_MINUTE) return;
    const inHouse = s.stays.length;
    for (const space of s.commercialSpaces.spaces) {
      // Demand comes from the guests actually in the house, at a take-up
      // rate the space's own fit decides.
      const fitBp = space.fitBp ?? (space.fit ?? 0) * 100;
      const demand = Math.trunc((inHouse * fitBp) / 10_000);
      const result = spaceThroughput({
        space,
        demand,
        staffOnDuty: this.onDuty("reception"),
        minuteOfDay: s.calendar.minuteOfDay,
      });
      if (result.served > 0)
        s.commercialSpaces = recordUse(
          s.commercialSpaces,
          space.id,
          result.served,
        );
      if (result.turnedAway > 0)
        this.pushAlert({
          id: `alert.space.${space.id}`,
          severity: "info",
          title: `${space.id} turned guests away`,
          cause: result.cause,
        });
      else this.clearAlerts([`alert.space.${space.id}`]);
    }

    // Security has to cover everything that is open, not just the bedrooms.
    const security = securityLoad({
      inHouseGuests: inHouse,
      eventGuests: this.runningEvents().reduce((n, e) => n + e.guests, 0),
      openSpaces: s.commercialSpaces.spaces.filter((space) =>
        isSpaceOpen(space, s.calendar.minuteOfDay),
      ).length,
    });
    if (security.guardsRequired > this.onDuty("security"))
      this.pushAlert({
        id: "alert.security.spaces",
        severity: "warning",
        title: "Security short",
        cause: security.cause,
      });
    else this.clearAlerts(["alert.security.spaces"]);
  }

  /** Recomputes the derived lobby description for the snapshot. */
  private refreshLobby(): void {
    const s = this.state;
    const adoption = Object.fromEntries(
      s.world.technologies.map((t) => [t.id, t.adoptionBp]),
    );
    const installed = availableSelfService(adoption).filter((option) =>
      s.technologyImplementations.includes(option.technologyId),
    );
    const load = this.lobbyLoad();
    s.lobby = {
      served: load.served,
      unserved: load.unserved,
      cause: load.cause,
      automation: automationFailureModes(installed),
    };
  }

  /** What the lobby is being asked for right now, and whether it copes. */
  lobbyLoad(): ReturnType<typeof lobbyThroughput> {
    const s = this.state;
    const adoption = Object.fromEntries(
      s.world.technologies.map((t) => [t.id, t.adoptionBp]),
    );
    const arriving = s.receptionQueue.length;
    const demand = {
      ...emptyLobbyDemand(),
      arrival: arriving,
      orientation: arriving,
      waiting: arriving,
      reception: arriving,
      checkout: s.stays.filter(
        (stay) => stay.departureDateKey <= s.calendar.dateKey,
      ).length,
      baggage: arriving * 2,
      concierge: Math.trunc(s.stays.length / 4),
    };
    // Only technology the house has actually implemented deflects anything.
    const installed = availableSelfService(adoption).filter((option) =>
      s.technologyImplementations.includes(option.technologyId),
    );
    return lobbyThroughput({
      demand: deflectedDemand(demand, installed).demand,
      receptionists: this.onDuty("reception"),
      // The same people carry the bags in a house this size, but not at the
      // same time as they are working the desk.
      porters: Math.floor(this.onDuty("reception") / 2),
      partiesPerReceptionist: STARTER_HOTEL.partiesPerReceptionist,
      bagsPerPorter: STARTER_HOTEL.bagsPerPorter,
    });
  }

  private meterDailyUtilities(): void {
    const s = this.state;
    const metered = meterUtilities(
      s.utilities,
      [
        {
          id: "facility.kitchen",
          waterUnits: s.stays.length + this.eventBreakfastCovers(),
          energyUnits: s.stays.length * 2,
        },
        {
          id: "facility.laundry",
          waterUnits: s.linen.dirty,
          energyUnits: Math.ceil(s.linen.dirty / 2),
        },
        {
          id: "facility.wellness",
          waterUnits: s.wellness.booked * 3,
          energyUnits: s.wellness.booked * 2,
        },
      ],
      { waterMinor: WATER_UNIT_MINOR, energyMinor: ENERGY_UNIT_MINOR },
    );
    // Billed here rather than at the close: the daily counters are reset at
    // midnight, so the only moment the day's actual draw exists is this one.
    const energyUnits = metered.state.energyUsed - s.utilities.energyUsed;
    const waterUnits = metered.state.waterUsed - s.utilities.waterUsed;
    s.utilities = { ...metered.state, pendingExpenseMinor: 0 };
    this.billUtilities(energyUnits, waterUnits);
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
      baseCovers: STARTER_HOTEL.barBaseExternalCovers,
      seasonalityBp: seasonalityBp(s.calendar.dateKey),
      priceIndexBp: STARTER_HOTEL.barPriceIndexBp,
      reputationBp: STARTER_HOTEL.barReputationBp,
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
      this.clearAlerts(["alert.spa-unstaffed"]);
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
      floorStock: s.linen.floorStock,
    });
    s.linen = {
      clean: day.clean,
      floorStock: day.floorStock,
      dirty: day.dirty,
    };
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
    for (const order of due) {
      s.stock = deliverOrder(s.stock, order, s.elapsedMinutes);
      this.emit(
        {
          type: "SUPPLY_DELIVERED",
          sku: order.sku,
          quantity: order.quantity,
        },
        [order.supplierId, order.sku],
      );
    }
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
      // Queue it: commands are the mutation boundary, so the standing order
      // goes through validation in the next commands phase like any other. It
      // is issued by the house, not the player, and says so.
      this.queueCommand(
        {
          type: "ORDER_SUPPLIES",
          sku,
          quantity: supplier.minimumQuantity,
        },
        "automation",
      );
    }
  }

  private runMaintenance(): void {
    const s = this.state;
    // Wear is applied once a day: a five-minute quantum floors to zero decay.
    const wearMinutes = this.dayRolled ? MINUTES_PER_DAY : 0;
    // A shift is a budget, not a per-asset allowance: every service booked
    // today draws it down, so two assets due at once need two technicians.
    let technicianMinutesLeft = this.dayRolled
      ? this.onDuty("technician") * TECHNICIAN_MINUTES_PER_DAY
      : 0;
    const serviced: string[] = [];
    s.assets = s.assets.map((asset) => {
      const degraded = { ...asset, ...degradeAsset(asset, wearMinutes) };
      if (
        this.dayRolled &&
        degraded.status === "operational" &&
        degraded.condition < 2000
      ) {
        const roll = this.streams.failures.nextUint32() % 10000;
        if (roll < DAILY_FAILURE_BP) {
          this.emit({ type: "ASSET_FAILED", assetId: degraded.id }, [
            degraded.id,
          ]);
          return { ...degraded, status: "failed" as const };
        }
      }
      if (degraded.status !== "operational") {
        const technicianMinutes = this.dayRolled ? REPAIR_MINUTES_PER_DAY : 0;
        const repaired = {
          ...degraded,
          ...repairAsset(degraded, technicianMinutes),
        };
        if (repaired.status === "operational")
          this.emit({ type: "ASSET_REPAIRED", assetId: repaired.id }, [
            repaired.id,
          ]);
        return repaired;
      }
      // Planned service happens before a failure, not after one, and costs
      // technician time and money up front.
      if (
        technicianMinutesLeft >= SERVICE_MINUTES &&
        isDueForService({
          minutesSinceService: degraded.minutesSinceService ?? 0,
        })
      ) {
        technicianMinutesLeft -= SERVICE_MINUTES;
        serviced.push(degraded.id);
        return { ...degraded, ...serviceAsset(degraded, SERVICE_MINUTES) };
      }
      return degraded;
    });

    for (const id of serviced) {
      const asset = s.assets.find((a) => a.id === id);
      if (!asset) continue;
      const costMinor = preventiveCostMinor({
        replacementMinor: asset.replacementMinor,
      });
      this.spend(costMinor, "maintenance", `preventive service on ${id}`);
      this.emit({ type: "ASSET_SERVICED", assetId: id, costMinor }, [id]);
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
      // These describe a condition, not an event, so each evaluation clears
      // the previous verdict before deciding again; otherwise a warning the
      // player has already fixed stays on the board.
      this.clearAlerts(ARRIVAL_ALERT_IDS);
      const load = {
        base: STARTER_HOTEL.baseSecurityStaff,
        eventGuests: this.runningEvents().reduce((n, e) => n + e.guests, 0),
        vipLevel: 0,
      };
      const gap = securityGapAlert(
        this.onDuty("security"),
        requiredSecurityStaff(load),
        load,
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
      if (s.handledComplaintIds.includes(complaint.id)) continue;
      s.handledComplaintIds.push(complaint.id);
      this.pruneHandledComplaints();
      this.emit(
        {
          type: "COMPLAINT_RAISED",
          complaintId: complaint.id,
          bookingId: waiting.bookingId,
        },
        [complaint.id, waiting.bookingId],
      );
      // A complaint costs goodwill whether or not anything is done about it.
      this.moveSatisfaction(-4, `${complaint.cause} at reception`);
      this.attemptRecovery(complaint.id, waiting.bookingId);
    }
  }

  private pruneHandledComplaints(): void {
    const s = this.state;
    if (s.handledComplaintIds.length <= HANDLED_COMPLAINT_LIMIT) return;
    const active = new Set(
      s.receptionQueue
        .map((waiting) =>
          complaintForWait(waiting.bookingId, waiting.waitedMinutes),
        )
        .filter((complaint) => complaint !== null)
        .map((complaint) => complaint.id),
    );
    const excess = s.handledComplaintIds.length - HANDLED_COMPLAINT_LIMIT;
    let removed = 0;
    s.handledComplaintIds = s.handledComplaintIds.filter((id) => {
      if (removed >= excess || active.has(id)) return true;
      removed += 1;
      return false;
    });
  }

  /**
   * Tries to put a complaint right. A gesture nobody is present to authorise,
   * or that the hotel cannot pay for, is refused — and a refused recovery
   * posts no money and moves no satisfaction at all.
   */
  private attemptRecovery(complaintId: string, bookingId: string): void {
    const s = this.state;
    const booking = s.reservations.find((b) => b.id === bookingId);
    const roomChargeMinor = booking?.rateMinor ?? 0;
    const verdict = authorizeRecovery("discount10", roomChargeMinor, {
      frontDeskOnDuty: this.onDuty("reception"),
      cashMinor: s.finance.cashMinor,
    });
    if (!verdict.ok) {
      this.pushAlert({
        id: `alert.recovery.${complaintId}`,
        severity: "critical",
        title: "Complaint left unanswered",
        cause: verdict.reason,
      });
      return;
    }
    const outcome = resolveComplaint(
      { cause: "longCheckIn", satisfaction: s.guestSatisfaction.score },
      "discount10",
      roomChargeMinor,
    );
    // The manager's own authority decides whether the gesture may be made at
    // all. A refused authorisation posts nothing and leaves the record saying
    // it went up, which is the point of having a limit.
    const manager = this.state.company.managers.find(
      (candidate) => candidate.hotelId === s.hotel.id,
    );
    const record = applyRecovery(
      openComplaint({
        id: complaintId,
        bookingId,
        stage: "checkIn",
        cause: "waited too long at reception",
        severity: "serious",
        raisedAtMinutes: s.elapsedMinutes,
      }),
      {
        id: `offer.${complaintId}`,
        complaintId,
        remedy: "goodwill discount",
        costMinor: outcome.expenseMinor,
      },
      // An unmanaged house delegates nothing: every gesture goes up.
      manager?.authority ??
        createManagerAuthority({
          repairLimitMinor: 0,
          capexLimitMinor: 0,
          recoveryLimitMinor: 0,
        }),
      manager?.id ?? "unmanaged",
    );
    s.recoveries = [...s.recoveries, record].slice(-HANDLED_COMPLAINT_LIMIT);
    if (record.status !== "accepted") {
      this.pushAlert({
        id: `alert.recovery.${complaintId}`,
        severity: "warning",
        title: "Recovery escalated",
        cause: `the manager may not authorise ${outcome.expenseMinor}`,
      });
      return;
    }
    if (record.postedCostMinor > 0)
      this.spend(
        record.postedCostMinor,
        "serviceRecovery",
        `goodwill discount for ${bookingId}`,
      );
    const explained = satisfactionAfterRecovery({
      before: Math.round(s.guestSatisfaction.score),
      severity: "serious",
      recoveryCostMinor: record.postedCostMinor,
      fullRemedyCostMinor: Math.max(1, roomChargeMinor),
    });
    this.moveSatisfaction(
      explained.after - Math.round(s.guestSatisfaction.score),
      `recovery for ${bookingId}: ${explained.causes.join("; ")}`,
    );
    this.emit(
      {
        type: "SERVICE_RECOVERY_APPLIED",
        complaintId,
        bookingId,
        // What the ledger actually took, not what a full remedy would cost.
        costMinor: record.postedCostMinor,
      },
      [complaintId, bookingId],
    );
  }

  /**
   * Opens the guest-relations record for an arriving party: who they are,
   * what they need, and what check-in was actually like for them. The record
   * is what later explains a review, so it starts the moment they arrive.
   */
  private openPartyStay(
    booking: ReservationRecord,
    roomId: string,
    waitedMinutes: number,
  ): void {
    const s = this.state;
    const partyId = `party.${booking.id}`;
    if (!s.guestRelations.parties.some((party) => party.id === partyId))
      s.guestRelations = registerParty(
        s.guestRelations,
        createParty({
          id: partyId,
          segmentId: booking.segmentId,
          adults: Math.max(1, booking.partySize),
          children: 0,
          budgetPerNightMinor: booking.rateMinor,
          needs: [...booking.specialRequirements].sort(),
          preferences: [],
          // A party that paid more is less forgiving of a poor arrival.
          tolerance: 60,
          loyalty: 0,
          bookingId: booking.id,
        }),
      );

    let stay = beginStay({ partyId, bookingId: booking.id, roomId });
    stay = recordStayEvent(stay, {
      stage: "checkIn",
      cause:
        waitedMinutes > 0
          ? `waited ${waitedMinutes} minutes at reception`
          : "checked in without waiting",
      delta: waitedMinutes > 20 ? -8 : waitedMinutes > 0 ? -2 : 2,
    });
    s.guestRelations = {
      ...s.guestRelations,
      stays: [...s.guestRelations.stays, stay].slice(-HANDLED_COMPLAINT_LIMIT),
    };
  }

  /** Moves goodwill and records why, so the number is always explainable. */
  private moveSatisfaction(delta: number, cause: string): void {
    const s = this.state;
    const score = Math.max(0, Math.min(100, s.guestSatisfaction.score + delta));
    if (score === s.guestSatisfaction.score) return;
    s.guestSatisfaction = {
      score,
      causes: [...s.guestSatisfaction.causes, cause].slice(-MAX_ALERTS),
    };
  }

  /**
   * The day's utilities, billed through the three separate contracts. The
   * meters move by what was actually drawn, so a bill can always be traced
   * back to a reading rather than to an accumulated expense figure.
   */
  private billUtilities(energyUnits: number, waterUnits: number): void {
    const s = this.state;
    // Guests and covers make rubbish; the kitchen makes most of it.
    const wasteKilos =
      s.stays.length + Math.ceil(this.eventBreakfastCovers() / 4);

    if (energyUnits > 0 || waterUnits > 0) {
      this.spend(
        utilityUsageMinor(s.utilityContracts.energy, energyUnits),
        "utilities",
        `metered energy: ${energyUnits} units`,
      );
      this.spend(
        utilityUsageMinor(s.utilityContracts.water, waterUnits),
        "utilities",
        `metered water: ${waterUnits} units`,
      );
    }
    if (wasteKilos > 0)
      this.spend(
        wasteDisposalMinor(s.utilityContracts.waste, {
          kilos: wasteKilos,
          sortedBasisPoints: SORTED_WASTE_BP,
        }),
        "utilities",
        `waste: ${wasteKilos} kilos`,
      );

    s.meters = readMeters(s.meters, {
      energy: energyUnits,
      water: waterUnits,
      waste: wasteKilos,
    });
  }

  /**
   * Everybody's day. Absence is not a coin flip against a staff row: it is
   * the consequence of the hours the player rostered, drawn from the staffing
   * stream, and it puts a named reason on the person who is missing.
   */
  private runEmploymentDay(): void {
    const s = this.state;
    // A busy house works its people beyond their contract, and that is what
    // eventually makes them ill and then makes them leave.
    const strain = s.stays.length > s.hotel.rooms.length / 2 ? 1 : 0;
    for (const employee of [...s.workforce.employees].sort((a, b) =>
      compareIds(a.id, b.id),
    )) {
      if (employee.status === "resigned" || employee.status === "dismissed")
        continue;
      if (strain > 0 && employee.status === "working")
        s.workforce = workOvertime(s.workforce, employee.id, strain);

      const current = s.workforce.employees.find((e) => e.id === employee.id)!;
      if (current.status === "sick" || current.status === "onLeave") {
        s.workforce = returnToWork(s.workforce, current.id);
        continue;
      }
      if (fallsSick(current, this.streams.staffing)) {
        s.workforce = markSick(
          s.workforce,
          current.id,
          `off after ${current.overtimeHours} hours of overtime`,
        );
        continue;
      }
      if (willResign(current, this.streams.staffing)) {
        s.workforce = resign(
          s.workforce,
          current.id,
          `morale at ${current.morale}`,
        );
        // Somebody who has left is off the rota for good.
        s.staff = s.staff.filter((member) => member.id !== current.staffId);
      }
    }
    // The rota is the employment record's shadow, never its own truth.
    for (const member of s.staff) {
      const employee = s.workforce.employees.find(
        (e) => e.staffId === member.id,
      );
      member.absent = employee ? employee.status !== "working" : member.absent;
    }
  }

  /**
   * The commercial consequences of a night actually sold: the guest is
   * remembered if they agreed to be, the scheme owes them points, and the
   * house's own reputation moves for a reason that can be read back.
   */
  private recordCommercialStay(stay: StayRecord): void {
    const s = this.state;
    const booking = s.reservations.find(
      (reservation) => reservation.id === stay.bookingId,
    );
    const guestId = booking?.guestId ?? `guest.${stay.bookingId}`;
    s.commercial = {
      ...s.commercial,
      crm: recordCrmStay(s.commercial.crm, {
        guestId,
        stayId: stay.bookingId,
      }),
      loyalty: earnPoints(s.commercial.loyalty, {
        guestId,
        roomRevenueMinor: stay.rateMinor,
        nights: 1,
      }),
    };
  }

  /** Reputation moves only for things that actually happened to somebody. */
  private moveReputation(
    dimension: Parameters<typeof applyReputationEvent>[1]["dimension"],
    scopeId: string,
    delta: number,
    cause: string,
  ): void {
    this.state.reputation = applyReputationEvent(this.state.reputation, {
      dimension,
      scopeId,
      delta,
      cause,
      atMinutes: this.state.elapsedMinutes,
    });
  }

  private runFinance(): void {
    if (!this.dayRolled) return;
    const s = this.state;

    for (const stay of s.stays) {
      const booking = s.reservations.find(
        (candidate) => candidate.id === stay.bookingId,
      );
      const recognized = netChannelRevenueMinor(
        stay.rateMinor,
        booking?.commissionBp ?? 0,
      );
      this.earn(recognized, "roomRevenue", stay.roomId);
      this.recordCommercialStay(stay);
      s.finance.month.roomRevenueMinor += recognized;
      s.finance.month.soldRoomNights += 1;
      // The city closes on the same occupied nights as the hotel ledger. An
      // accepted booking is not a sale until the guest actually stays.
      recordPlayerRoomNights(s.cityMarket, 1);
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
    this.runCancellations();
    this.generateEventLeads();
    // The city settles its month before the new one's first day trades.
    const endedMonthKey = addDays(s.calendar.dateKey, -1);
    const endedMonthWasClosed =
      s.lastMonthlyClose?.periodKey === endedMonthKey.slice(0, 7);
    if (s.calendar.dateKey.slice(8) === "01" && endedMonthWasClosed)
      this.runCityMonth();
    const cityAllocation = this.runCityDay();
    const shareIndex = cityAllocation.playerShareIndex;

    const season = seasonalityBp(s.calendar.dateKey);
    const parties = Math.max(
      0,
      Math.round(
        ((4 + (this.streams.guests.nextUint32() % 5)) * season * shareIndex) /
          10000,
      ),
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
      // Walk-ins draw on the same inventory as anyone else; they simply have
      // no lead time in which to have held it.
      if (leadDays === 0 && !canWalkIn(this.sameDayInventory())) continue;
      const channels = availableChannels({
        technologyAdoptionBp: Object.fromEntries(
          s.world.technologies.map((technology) => [
            technology.id,
            technology.adoptionBp,
          ]),
        ),
        hotelImplementations: new Set(s.technologyImplementations),
        standardNetworkBp:
          s.world.technologies.find(
            (technology) => technology.id === "internet",
          )?.adoptionBp ?? 0,
      });
      const advanceChannels = advanceBookingChannels(channels);
      const channelDefinition =
        leadDays === 0
          ? channels.find((candidate) => candidate.id === "walkIn")!
          : advanceChannels[
              this.streams.guests.nextUint32() % advanceChannels.length
            ];
      const channel = channelDefinition.id as BookingChannel;
      const bookingId = `booking.${s.elapsedMinutes}.${i}`;
      try {
        const reservation: ReservationRecord = reserve(
          { availableRoomsOn: (date) => this.availableRooms(date, category) },
          {
            id: bookingId,
            guestId: `guest.${segment.id}.${(Math.floor(s.elapsedMinutes / 1440) + i) % 32}`,
            roomsRequested: 1,
            rateMinor,
            // A profile the hotel actually built for lifts what its segment
            // will pay; an undeclared or unbuilt profile lifts nothing.
            willingnessMinor: Math.round(
              (segment.willingnessMinor *
                (10000 + this.specializationBonusFor(segment.id))) /
                10000,
            ),
            channel,
            partySize: 1 + (this.streams.guests.nextUint32() % 2),
            segmentId: segment.id,
            category,
            arrivalDateKey,
            nights: segment.averageNights,
            terms: {
              // A walk-in has paid at the desk; a phone booking is held on
              // trust and is the one that can fail to turn up.
              guaranteed: channel === "walkIn",
              freeCancellationDays: 1,
              lateChargeBp: LATE_CHARGE_BP,
            },
            atMinutes: s.elapsedMinutes,
            bookingDateKey: s.calendar.dateKey,
            ratePlanId: "flexible",
            commissionBp: channelDefinition.commissionBp,
            depositMinor: 0,
            specialRequirements: [],
          },
        );
        s.reservations.push(reservation);
        this.emit(
          {
            type: "BOOKING_CONFIRMED",
            bookingId: reservation.id,
            arrivalDateKey,
            nights: reservation.nights,
            category,
            roomsRequested: reservation.roomsRequested,
            rateMinor,
            segmentId: segment.id,
          },
          [reservation.id],
        );
      } catch (error) {
        const reason = (error as Error).message;
        if (
          reason === "price rejected" ||
          reason.startsWith("no inventory on ")
        ) {
          this.pushAlert({
            id: `alert.booking-refused.${bookingId}`,
            severity: "info",
            title: "Booking request refused",
            cause: reason,
          });
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Plans change. A booking cancelled in good time costs nothing and releases
   * exactly the rooms it was holding; one cancelled inside the agreed window
   * pays the agreed share of the first night.
   */
  private runCancellations(): void {
    const s = this.state;
    for (const booking of s.reservations) {
      if (
        booking.status !== "confirmed" ||
        booking.arrivalDateKey <= s.calendar.dateKey
      )
        continue;
      if (this.streams.guests.nextUint32() % 10000 >= DAILY_CANCELLATION_BP)
        continue;
      const released = booking.roomsRequested;
      const charge = lateChargeMinor(booking, s.calendar.dateKey);
      const cancelled = cancel(booking, s.elapsedMinutes);
      booking.status = cancelled.status;
      booking.history = cancelled.history;
      if (charge > 0) {
        this.earn(charge, "otherRevenue", `late cancellation ${booking.id}`);
        s.finance.month.otherRevenueMinor += charge;
      }
      this.emit(
        {
          type: "BOOKING_CANCELLED",
          bookingId: booking.id,
          releasedRooms: released,
        },
        [booking.id],
      );
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
    // Group cash is one number wherever it moved this quantum; the treasury
    // only records where inside the group it sits.
    syncTreasury(this.state);
    this.refreshLobby();
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

  // --- city market -------------------------------------------------------

  /**
   * The player's house as the city market weighs it: its size, the rate it is
   * actually asking, and how appealing its product is against an ordinary
   * house. It is the same shape a rival has, because the market must not be
   * able to tell them apart.
   */
  private playerHouse(): PlayerHouse {
    const s = this.state;
    const rates = ROOM_CATEGORIES.filter((category) =>
      s.hotel.rooms.some((r) => r.category === category),
    ).map((category) =>
      getRate(
        s.rates,
        s.calendar.dateKey,
        category,
        STARTER_HOTEL.defaultRateMinor[category] ??
          STARTER_HOTEL.defaultRateMinor.double,
      ),
    );
    return {
      id: s.hotel.id,
      rooms: s.hotel.rooms.length,
      rateMinor: rates.length
        ? Math.round(rates.reduce((n, r) => n + r, 0) / rates.length)
        : STARTER_HOTEL.defaultRateMinor.double,
      // A rated house is a more attractive one; the rating is already the
      // game's own summary of the product, so it is not re-derived here.
      appealBp: 9000 + s.classification.stars * 400,
      conferenceSeats: Math.floor(
        s.investedArea.conferenceSqm / STARTER_HOTEL.conferenceSqmPerSeat,
      ),
    };
  }

  /** What one post costs in this city this month, in whole Pfennig. */
  private marketWageMinor(state: GameState = this.state): number {
    return marketWageMinor(
      BASE_MONTHLY_WAGE_MINOR,
      state.cityMarket.wagePressureBp,
    );
  }

  /** Settles the ended month for the whole city and its rivals. */
  private runCityMonth(): void {
    const s = this.state;
    // The city is compared with itself across the settlement so entry, exit
    // and route changes are reported as the facts they are, rather than being
    // reconstructed later from a difference in supply.
    const before = new Map(
      s.competitors.map((c) => [c.id, { rooms: c.rooms, status: c.status }]),
    );
    const transportBefore = { ...s.cityMarket.transport };
    const endedMonthKey = addDays(s.calendar.dateKey, -1);
    const roomNightsBefore = s.cityMarket.soldRoomNights;

    s.competitors = advanceCityMonth(
      s.cityMarket,
      s.competitors,
      this.playerHouse(),
      {
        endedMonthKey,
        dateKey: s.calendar.dateKey,
        economy: this.streams.economy,
        ai: this.streams.AI,
      },
    );
    s.world = new WorldSimulation(this.streams).stepMonth(s.world);
    s.technologyProjects = s.technologyProjects.map(advanceTechnologyProject);
    for (const project of s.technologyProjects)
      if (
        project.status === "complete" &&
        !s.technologyImplementations.includes(project.technologyId)
      ) {
        s.technologyImplementations.push(project.technologyId);
        this.emit(
          {
            type: "TECHNOLOGY_ADOPTION_COMPLETED",
            projectId: project.id,
            technologyId: project.technologyId,
          },
          [project.id, project.technologyId],
        );
      }
    s.technologyProjects = s.technologyProjects.filter(
      (project) => project.status !== "complete",
    );

    this.emit(
      {
        type: "CITY_MONTH_ADVANCED",
        periodKey: endedMonthKey.slice(0, 7),
        roomNights: roomNightsBefore,
      },
      [CITY.id],
    );

    const after = new Map(s.competitors.map((c) => [c.id, c]));
    for (const competitor of s.competitors)
      if (!before.has(competitor.id))
        this.emit(
          {
            type: "COMPETITOR_ENTERED",
            competitorId: competitor.id,
            rooms: competitor.rooms,
          },
          [competitor.id],
        );
    // A house that has failed is dropped from the city's list, so its exit is
    // read from the gap it leaves rather than from a status it no longer has.
    for (const [id, was] of before)
      if (!after.has(id) || after.get(id)?.status === "exit")
        this.emit(
          {
            type: "COMPETITOR_EXITED",
            competitorId: id,
            releasedRooms: was.rooms,
          },
          [id],
        );

    for (const [mode, points] of Object.entries(s.cityMarket.transport)) {
      const was = transportBefore[mode as keyof typeof transportBefore];
      if (was !== points)
        this.emit(
          { type: "TRANSPORT_ROUTE_CHANGED", mode, from: was, to: points },
          [CITY.id, mode],
        );
    }
  }

  /**
   * Splits today's city room nights across every house and returns what
   * competition did to this hotel's own share of them.
   */
  private runCityDay(): ReturnType<typeof allocateCityDay> {
    const s = this.state;
    return allocateCityDay(
      s.cityMarket,
      s.competitors,
      this.playerHouse(),
      s.calendar.dateKey,
    );
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

  /**
   * Sleeping rooms a confirmed conference holds on a given date, in one rate
   * category. A block comes out of the category it was sold from; subtracting
   * a house-wide figure from every category would hold each room twice.
   */
  private eventRoomsBlocked(dateKey: string, category: string): number {
    return this.state.events
      .filter(
        (e) =>
          e.status !== "complete" &&
          e.blockedCategory === category &&
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
        this.emit(
          {
            type: "CONFERENCE_COMPLETED",
            eventId: event.id,
            valueMinor: event.valueMinor,
          },
          [event.id],
        );
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
    // Delegations sleep in doubles, so the block is capped by that category's
    // own inventory rather than by the size of the whole house.
    const blockedCategory = "double";
    const categoryRooms = s.hotel.rooms.filter(
      (r) => r.category === blockedCategory,
    ).length;
    const roomsBlocked = Math.min(
      Math.floor(categoryRooms / 2),
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
    const eventId = `event.${s.elapsedMinutes}`;
    s.events.push({
      id: eventId,
      guests,
      nights,
      roomsBlocked,
      blockedCategory,
      startDateKey: addDays(s.calendar.dateKey, leadDays),
      valueMinor: offer,
      status: "confirmed",
    });
    this.emit(
      {
        type: "CONFERENCE_BOOKED",
        eventId,
        guests,
        roomsBlocked,
        valueMinor: offer,
      },
      [eventId],
    );
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
    const previousCause = new Map(s.facilities.map((f) => [f.id, f.cause]));
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
          {
            label: "facility.cause.kitchenLine",
            value: STARTER_HOTEL.kitchenCovers,
          },
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
          {
            label: "hall capacity",
            value: Math.floor(
              s.investedArea.conferenceSqm / STARTER_HOTEL.conferenceSqmPerSeat,
            ),
          },
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

    // What binds an area is the fact worth telling: a load that moved without
    // changing the constraint is not news.
    for (const facility of s.facilities)
      if (previousCause.get(facility.id) !== facility.cause)
        this.emit(
          {
            type: "FACILITY_CONSTRAINT_CHANGED",
            facilityId: facility.id,
            cause: facility.cause,
          },
          [facility.id],
        );
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
      Math.round(
        (s.investedArea.conferenceSqm + s.investedArea.wellnessSqm) / 5,
      ),
    );
    const before = s.classification.stars;
    s.classification = classify({
      room: roomScore,
      reception,
      maintenance,
      facilities,
    });
    if (s.classification.stars !== before)
      this.emit(
        {
          type: "CLASSIFICATION_CHANGED",
          from: before,
          to: s.classification.stars,
        },
        [s.hotel.id],
      );
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
      else if (
        before.has(room.id) &&
        !blocked.has(room.id) &&
        room.state === "OutOfOrder"
      )
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
      this.emit(
        {
          type: "RENOVATION_COMPLETED",
          projectId: step.job.id,
          roomsAdded: step.roomsAdded,
        },
        [step.job.id],
      );
    }
  }

  private closeMonth(): void {
    const s = this.state;
    const periodKey = addDays(s.calendar.dateKey, -1).slice(0, 7);

    // Everything the closed month owes is charged first, so the report the
    // player reads is the whole month rather than the month before overheads.
    this.chargeUtilityStandingCharges();
    this.runCommercialSpaceMonth();
    this.runEmploymentMonth();
    this.runCommercialMonth();
    this.chargeInsuranceAndDepreciation(periodKey);
    runCompanyMonth(s, `${periodKey}-01`, {
      emit: (payload, entities) => this.emit(payload, entities),
      earn: (amountMinor, account, memo) =>
        this.earn(amountMinor, account, memo),
      spend: (amountMinor, account, memo) =>
        this.spend(amountMinor, account, memo),
    });

    const m = s.finance.month;
    s.lastMonthlyClose = closeMonth({
      periodKey,
      openingCashMinor: m.openingCashMinor,
      closingCashMinor: s.finance.cashMinor,
      roomRevenueMinor: m.roomRevenueMinor,
      otherRevenueMinor: m.otherRevenueMinor,
      operatingExpenseMinor: m.operatingExpenseMinor,
      soldRoomNights: m.soldRoomNights,
      availableRoomNights: m.availableRoomNights,
    });
    // The flagship published its result from the month accumulator before the
    // corporate postings landed, so it is restated from the finished report.
    const flagship = s.company.hotelResults[s.hotel.id];
    if (flagship)
      s.company.hotelResults[s.hotel.id] = {
        ...flagship,
        roomRevenueMinor: s.lastMonthlyClose.roomRevenueMinor,
        otherRevenueMinor: s.lastMonthlyClose.otherRevenueMinor,
        operatingExpenseMinor: s.lastMonthlyClose.operatingExpenseMinor,
        grossOperatingProfitMinor: s.lastMonthlyClose.operatingProfitMinor,
      };
    // The period that just closed, not the day the close is being posted on:
    // December's close happens on 1 January and belongs to December's year.
    const closedYear = Number(periodKey.slice(0, 4));
    const annual = s.narrative.annualProfit;
    if (annual.year !== closedYear) {
      annual.year = closedYear;
      annual.operatingProfitMinor = 0;
    }
    annual.operatingProfitMinor += s.lastMonthlyClose.operatingProfitMinor;
    // A year is only profitable once it has finished being a year.
    if (Number(periodKey.slice(5, 7)) === 12)
      annual.lastCompletedYearProfitMinor = annual.operatingProfitMinor;
    const milestoneIds = detectMilestones({
      // A profitable year, not a profitable month: one good March is not a
      // milestone, and the accumulator resets when the calendar turns.
      annualProfitMinor: annual.lastCompletedYearProfitMinor,
      hotelCount: s.company.portfolio.hotelIds.length,
      year: closedYear,
      achieved: s.narrative.achievedMilestones,
    });
    for (const milestoneId of milestoneIds) {
      s.narrative.achievedMilestones.push(milestoneId);
      s.narrative.chronicle = appendChronicleEntry(s.narrative.chronicle, {
        id: `milestone.${milestoneId}`,
        date: s.calendar.dateKey,
        scope: "company",
        textKey: `chronicle.milestone.${milestoneId}`,
      });
      this.emit(
        {
          type: "MILESTONE_ACHIEVED",
          milestoneId,
          dateKey: s.calendar.dateKey,
        },
        [milestoneId],
      );
    }
    runNarrativeMonth(s, this.streams.narrative, {
      emit: (payload, entities) => this.emit(payload, entities),
      spend: (amountMinor, account, memo) =>
        this.spend(amountMinor, account, memo),
      earn: (amountMinor, account, memo) =>
        this.earn(amountMinor, account, memo),
    });
    refreshCareerOutcome(s);
    this.emit(
      {
        type: "MONTH_CLOSED",
        periodKey: s.lastMonthlyClose.periodKey,
        profitMinor: s.lastMonthlyClose.operatingProfitMinor,
        occupancyBasisPoints: s.lastMonthlyClose.occupancyBasisPoints,
      },
      [s.hotel.id],
    );
    s.finance.month = {
      openingCashMinor: s.finance.cashMinor,
      roomRevenueMinor: 0,
      otherRevenueMinor: 0,
      operatingExpenseMinor: 0,
      soldRoomNights: 0,
      // The first day of the new month is added right after this close.
      availableRoomNights: 0,
    };
    syncTreasury(s);
  }

  /**
   * The two monthly postings that are not a purchase: the premium the hotel
   * pays whether or not anything goes wrong, and the depreciation that is a
   * real expense moving no cash at all. Both are guarded by the period they
   * were last posted for, so a reload cannot repeat them.
   */
  private chargeInsuranceAndDepreciation(periodKey: string): void {
    const s = this.state;
    if (s.statements.lastDepreciationPeriodKey === periodKey) return;

    const premium = totalMonthlyPremiumMinor(s.insurance);
    if (premium > 0)
      this.spend(premium, "insurancePremium", "insurance premiums");

    for (const asset of [...s.assets].sort((a, b) => compareIds(a.id, b.id))) {
      const amountMinor = depreciationMinor({
        costMinor: asset.replacementMinor,
        usefulLifeMonths: ASSET_USEFUL_LIFE_MONTHS,
        accumulatedMinor: s.statements.depreciationByAsset[asset.id] ?? 0,
      });
      if (amountMinor <= 0) continue;
      s.statements = postDepreciation(s.statements, {
        assetId: asset.id,
        amountMinor,
        periodKey,
      });
    }
    // The period stamp moves even when nothing was left to depreciate, so the
    // guard above still holds for a fully written-down hotel.
    s.statements = { ...s.statements, lastDepreciationPeriodKey: periodKey };
  }

  /**
   * The three utility contracts' standing charges. They are owed once a month
   * whatever the meters read, which is why they are not part of the daily
   * usage posting.
   */
  private chargeUtilityStandingCharges(): void {
    for (const kind of UTILITY_KINDS)
      this.spend(
        standingChargeMinor(this.state.utilityContracts[kind]),
        "utilities",
        `${kind} standing charge`,
      );
  }

  /**
   * What the commercial spaces paid the hotel this month. Each operator model
   * settles differently, so the ledger keeps them apart rather than reporting
   * one "other income" line.
   */
  private runCommercialSpaceMonth(): void {
    const s = this.state;
    for (const space of s.commercialSpaces.spaces) {
      const contribution = monthlyContributionMinor(
        space,
        s.commercialSpaces.unitsSold[space.id] ?? 0,
      );
      if (contribution.hotelShareMinor > 0)
        this.earn(
          contribution.hotelShareMinor,
          "commercialSpaces",
          contribution.memo,
        );
      else if (contribution.hotelShareMinor < 0)
        this.spend(
          -contribution.hotelShareMinor,
          "commercialSpaces",
          contribution.memo,
        );
    }
    s.commercialSpaces = startSpaceMonth(s.commercialSpaces);
  }

  /**
   * The employment month: what the workforce did to the group's standing as
   * an employer, and then a clean sheet of hours for the month ahead.
   */
  private runEmploymentMonth(): void {
    const s = this.state;
    for (const event of s.workforce.employerEvents)
      this.moveReputation("employer", s.hotel.id, event.delta, event.cause);
    s.workforce = startEmploymentMonth(s.workforce);
  }

  /**
   * The commercial month: points nobody will ever claim are released as
   * income, campaigns age toward the end of their attribution window, and
   * every reputation dimension drifts a little back toward neutral.
   */
  private runCommercialMonth(): void {
    const s = this.state;
    const released = releaseBreakageMinor(s.commercial.loyalty);
    if (released.releasedMinor > 0)
      this.earn(
        released.releasedMinor,
        "loyaltyBreakage",
        "loyalty points released",
      );
    s.commercial = { ...s.commercial, loyalty: released.state };

    // The house's standing with guests follows what guests actually got.
    const satisfaction = Math.round(s.guestSatisfaction.score);
    this.moveReputation(
      "hotel",
      s.hotel.id,
      satisfaction >= 70 ? 2 : satisfaction <= 45 ? -3 : 0,
      `guest satisfaction ${satisfaction} at the close`,
    );
    // Reputation with staff follows whether the house is actually staffed.
    this.moveReputation(
      "employer",
      s.hotel.id,
      s.staff.some((member) => member.absent) ? -1 : 1,
      "monthly rota",
    );
    s.reputation = decayReputation(s.reputation);
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
    // Only a live booking holds anything: a cancellation or a no-show has
    // released exactly what it was holding, and nothing more.
    const held = s.reservations
      .filter((b) => b.category === category && holdsRoomOn(b, dateKey))
      .reduce((rooms, b) => rooms + b.roomsRequested, 0);
    // A conference holds its sleeping rooms out of general sale.
    return Math.max(
      0,
      total - held - this.eventRoomsBlocked(dateKey, category),
    );
  }

  /** Demand bonus for a declared profile the hotel has actually invested in. */
  private specializationBonusFor(segmentId: string): number {
    const id = this.state.specializationId;
    if (!id) return 0;
    const spec = SPECIALIZATIONS.find((x) => x.id === id);
    if (!spec || spec.segmentId !== segmentId) return 0;
    return specializationBonusBp(id, this.state.investedArea);
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
    // Capital spend buys something: the balance sheet has to know it exists.
    else s.statements = capitaliseAsset(s.statements, amountMinor);
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

  /** Drops condition alerts so the next evaluation can restate the truth. */
  private clearAlerts(ids: readonly string[]): void {
    this.state.alerts = this.state.alerts.filter((a) => !ids.includes(a.id));
  }

  /** Adds an alert once. Returns true when this is the first time it is said. */
  private pushAlert(alert: AlertRecord): boolean {
    if (this.state.alerts.some((a) => a.id === alert.id)) return false;
    this.state.alerts.push(alert);
    return true;
  }
}

export const SIMULATION_CITY = CITY;
