import { captureRngState, restoreRngStreams } from "../domain/rng";
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
  walkGuest,
  ReservationRefusalError,
  reserve,
} from "../bookings/bookingEngine";
import type { BookingChannel } from "../bookings/bookingTypes";
import {
  getRate,
  corporateRateMinor,
  isRoomCategory,
  setRate,
  ROOM_CATEGORIES,
  type RoomCategory,
} from "../revenue/rates";
import {
  activeContracts,
  negotiatedDiscountBasisPoints,
} from "../commercial/salesPipeline";
import {
  applyRatePlan,
  automaticRate,
  createRevenuePolicy,
  updateRevenuePolicy,
} from "../revenue/revenuePolicy";
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
  gopparMinor,
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
import {
  BREAKFAST_CLOSE_MINUTE,
  BREAKFAST_STAY_MINUTES,
} from "../fnb/breakfastService";
import {
  barRevenueMinor,
  BAR_CLOSE_MINUTE,
  BAR_OPEN_MINUTE,
  BAR_STAY_MINUTES,
  COVERS_PER_BARKEEPER,
} from "../fnb/barService";
import {
  deliveryMinutes,
  lateDeliveryComplaints,
  roomServiceOrders,
} from "../fnb/roomService";
import {
  BAR_SERVICE_MINUTE,
  BREAKFAST_START,
  RESTAURANT_SERVICE_MINUTE,
  ROOM_SERVICE_MINUTE,
} from "../fnb/schedule";
import { boardCommitment } from "../fnb/boardPlans";
import { runKitchenService } from "../fnb/kitchen";
import { seatService } from "../fnb/seating";
import type { FnbConstraintKey, FnbOutletState } from "../fnb/fnbState";
import { externalCovers } from "../fnb/externalDemand";
import {
  averageCoverMinor,
  menuItem,
  outletMenu,
  type Outlet,
} from "../content/1991/menu";
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
import {
  ELEVATOR_TRIP_MINUTES,
  elevatorTrips,
  elevatorWaitMinutes,
} from "../facilities/mobility";
import { meterUtilities } from "../facilities/utilities";
import {
  requiredSecurityStaff,
  securityGapAlert,
} from "../facilities/security";
import {
  changingRoomPressureBp,
  staffAreaCapacity,
} from "../facilities/staffAreas";
import {
  facilityRow,
  type FacilityConstraint,
} from "../facilities/facilityBoard";
import { utilizationBp } from "../facilities/capacity";
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
import {
  accrueMonthlyInterestMinor,
  drawLoan,
  repayLoan,
} from "../finance/loans";
import { debtSchedule } from "../finance/debt";
import { closeMonth, deriveMonthlyBriefing } from "../finance/monthlyClose";
import { taxChargeMinor } from "../finance/statements";
import {
  taxRateForJurisdiction,
  TAX_PAYMENT_LAG_MONTHS,
} from "../content/1991/company";
import {
  advanceRenovation,
  renovationBlockedRooms,
  RENOVATION_COST_MINOR,
  startRenovation,
} from "../building/renovations";
import { generateFloorPlan, positionMapForPlan } from "../building/floorPlan";
import {
  describeAgentLocations,
  describeLiftCars,
} from "../building/agentLocations";
import { describeOperationalSituations } from "../building/operationalSituations";
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
import { drainEvents, emitEvent } from "../domain/eventBuffer";
import type { DomainEvent, DomainEventPayload } from "../domain/events";
import type { LocalizedAlertCause } from "../domain/localization";
import {
  type AlertRecord,
  type EventRecord,
  type GameState,
  type ReservationRecord,
  type RoomRecord,
  type StayRecord,
} from "./initialState";
import { detectMilestones } from "../milestones/milestoneEngine";
import { appendChronicleEntry } from "../chronicle/chronicle";
import { compactLedgerHistory } from "../history/historyCompaction";
import {
  chooseEndlessContinuation,
  type RecoveryPath,
} from "../campaign/careerOutcome";
import { applyRecoveryPath, validateRecoveryPath } from "../campaign/recovery";
import {
  createCampaignConfig,
  adjustedStartingCapitalMinor,
  DIFFICULTY_IDS,
} from "../campaign/campaignConfig";
import {
  accuracyScaledForecastQuality,
  volatilityScaledCostMinor,
} from "../campaign/sandboxEffects";
import {
  refreshCareerOutcome,
  resolveNarrativeChoice,
  runNarrativeMonth,
  validateNarrativeChoice,
} from "../narrative/narrativeSystem";
import { WorldSimulation } from "../world/WorldSimulation";
import {
  adoptionCostMinor,
  advanceTechnologyProject,
  technologyProjectDurationMonths,
} from "../technology/adoption";
import {
  advanceBookingChannels,
  availableChannels,
  netChannelRevenueMinor,
} from "../distribution/channelEvolution";
import {
  applyReputationEvent,
  decayReputation,
} from "../reputation/dimensions";
import {
  burnPoints,
  earnPoints,
  memberFor,
  releaseBreakageMinor,
  tierBenefits,
  tierForNights,
} from "../commercial/loyalty";
import {
  appendCampaignAttribution,
  attributedEffectBasisPoints,
  campaignEffectBasisPoints,
  campaignReach,
  campaignUncertaintyBand,
  finishExpiredCampaigns,
  realisedEffectBasisPoints,
} from "../commercial/campaigns";
import { recordStay as recordCrmStay } from "../commercial/crm";
import {
  createContract as createEmploymentContract,
  employ,
  markSick,
  fallsSick,
  resign,
  returnToWork,
  startEmploymentMonth,
  willResign,
  workOvertime,
} from "../staff/employeeLifecycle";
import {
  createManagerAuthority,
  managerForHotel,
} from "../management/managerAuthority";
import { escalationReason } from "../management/escalation";
import {
  beginStay,
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
import {
  applyCommercialCommand,
  isCommercialCommand,
  validateCommercialCommand,
} from "../commercial/commercialCommands";
import { runCompanyMonth, syncTreasury } from "../company/companyMonth";
import {
  adjustedForecastQuality,
  assistedCostMinor,
  bufferedCrisisRiskBp,
  toleratedSatisfactionDelta,
} from "../campaign/difficultyEffects";
import {
  accountClass,
  balanceSheet,
  cashFlowStatement,
  capitaliseAsset,
  depreciationMinor,
  postDepreciation,
} from "../finance/statements";
import {
  cancelPolicy,
  fileClaim,
  monthlyPremiumMinor,
  settleClaim,
  takeOutPolicy,
  totalMonthlyPremiumMinor,
  varyPolicy,
} from "../risk/insurance";
import { weatherInsurancePayout } from "../world/climate";
import { createDistributionState } from "../distribution/distributionState";
import {
  applyDistributionCommand,
  isDistributionCommand,
  validateDistributionCommand,
} from "../distribution/distributionCommands";
import {
  channelMaySell,
  sharedAvailableRooms,
} from "../distribution/channelEvolution";
import {
  recogniseReceivable,
  settleReceivable,
  overdueReceivables,
} from "../finance/statements";
import { displacementCostMinor } from "../revenue/revenuePolicy";
import { explainCause } from "../explanations/causeExplanations";

const ASSET_INSURANCE_PERIL: Readonly<
  Record<string, "fire" | "businessInterruption">
> = {
  "asset.boiler": "fire",
  "asset.elevator": "businessInterruption",
  "asset.hvac": "businessInterruption",
};
import {
  UTILITY_KINDS,
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
const WELLNESS_OPEN_MINUTE = 600;
const LAUNDRY_MINUTE = 480;
/** Basis points of in-house guests who ask for a treatment on a given day. */
const WELLNESS_TAKE_UP_BP = 1500;
/** Basis points of in-house guests who use the bar in an evening. */
const BAR_TAKE_UP_BP = 6000;
/** Basis points of days on which a conference enquiry arrives. */
const EVENT_LEAD_CHANCE_BP = 1200;
const MAX_ALERTS = 20;
const FNB_SERVICE_STOCK_SKU = "breakfast-portion";
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
/** Planned over-production available to absorb late orders during a service. */
const FNB_PREPARATION_BUFFER_BP = 1000;
/** Only unused preparation can become waste; this is its service allowance. */
const FNB_WASTE_BP = 1000;

function plannedFnbPreparation(demand: number, kitchenThroughput: number) {
  return Math.min(
    kitchenThroughput,
    demand + Math.ceil((demand * FNB_PREPARATION_BUFFER_BP) / 10_000),
  );
}

function averageIngredientMinor(outlet: Outlet): number {
  const items = outletMenu(outlet);
  return items.length === 0
    ? 0
    : Math.round(
        items.reduce((sum, item) => sum + item.ingredientMinor, 0) /
          items.length,
      );
}

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
    state.commercial.campaignAttributionLog ??= [];
    state.commercial.loyalty.active ??= true;
    state.distribution ??= createDistributionState();
    state.revenuePolicy = updateRevenuePolicy(createRevenuePolicy(), {
      ...state.revenuePolicy,
      managerAttributes:
        state.revenuePolicy.managerAttributes ??
        createRevenuePolicy().managerAttributes,
    });
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
        case "ACKNOWLEDGE_ALERT":
          return s.alerts.some((alert) => alert.id === command.alertId)
            ? { ok: true }
            : { ok: false, reason: "unknown alert" };
        case "SET_RATE":
          setRate(
            s.rates,
            command.dateKey,
            command.category,
            command.rateMinor,
          );
          return { ok: true };
        case "SET_REVENUE_POLICY":
          updateRevenuePolicy(s.revenuePolicy, command.change);
          return { ok: true };
        case "SET_INSURANCE_POLICY": {
          if (!command.policyId) throw new Error("a policy id is required");
          if (command.operation === "takeOut") {
            if (!command.policy || command.policy.id !== command.policyId)
              throw new Error("takeOut requires the matching policy record");
            takeOutPolicy(s.insurance, command.policy);
          } else if (command.operation === "vary") {
            if (command.policy)
              throw new Error("vary accepts deductible and limit changes only");
            varyPolicy(s.insurance, command.policyId, {
              ...(command.deductibleMinor !== undefined
                ? { deductibleMinor: command.deductibleMinor }
                : {}),
              ...(command.limitMinor !== undefined
                ? { limitMinor: command.limitMinor }
                : {}),
            });
          } else if (command.operation === "cancel") {
            if (
              command.policy ||
              command.deductibleMinor !== undefined ||
              command.limitMinor !== undefined
            )
              throw new Error("cancel accepts a policy id only");
            cancelPolicy(s.insurance, command.policyId);
          } else throw new Error("unknown insurance operation");
          return { ok: true };
        }
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
          startRenovation(
            "module.free.1",
            s.finance.cashMinor,
            {},
            volatilityScaledCostMinor(
              RENOVATION_COST_MINOR,
              s.narrative.campaign.sandbox,
            ),
          );
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
          // The adjusted fee, not the list price: validating against one number
          // and spending another would accept a purchase the player cannot
          // afford and then book the shortfall as a payable.
          if (
            s.finance.cashMinor <
            assistedCostMinor(REPORT_COST_MINOR, s.narrative.campaign.inputs)
          )
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
        case "SET_CAMPAIGN_SANDBOX":
          if (s.elapsedMinutes > 0)
            return { ok: false, reason: "the career has already started" };
          if (
            Object.entries(command.sandbox).some(
              ([key, value]) =>
                value !== undefined &&
                (!Number.isSafeInteger(value) ||
                  value > 1_000_000 ||
                  (key === "technologySpeedBasisPoints"
                    ? value < 1
                    : value < 0)),
            )
          )
            return {
              ok: false,
              reason: "sandbox values must be whole basis points",
            };
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
          if (isCommercialCommand(command))
            return validateCommercialCommand(s, command);
          if (isDistributionCommand(command))
            return validateDistributionCommand(s, command);
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
      case "ACKNOWLEDGE_ALERT":
        s.alerts = s.alerts.map((alert) =>
          alert.id === command.alertId
            ? { ...alert, acknowledged: true }
            : alert,
        );
        this.emit({ type: "ALERT_ACKNOWLEDGED", alertId: command.alertId }, [
          command.alertId,
        ]);
        return;
      case "SET_RATE":
        s.rates = setRate(
          s.rates,
          command.dateKey,
          command.category,
          command.rateMinor,
        );
        return;
      case "SET_REVENUE_POLICY":
        s.revenuePolicy = updateRevenuePolicy(s.revenuePolicy, command.change);
        this.emit({ type: "REVENUE_POLICY_CHANGED", hotelId: s.hotel.id }, [
          s.hotel.id,
        ]);
        return;
      case "SET_INSURANCE_POLICY": {
        const verdict = this.validateCommand(command);
        if (!verdict.ok) throw new Error(verdict.reason);
        const prior = s.insurance.policies.find(
          (policy) => policy.id === command.policyId,
        );
        if (command.operation === "takeOut")
          s.insurance = takeOutPolicy(s.insurance, command.policy!);
        else if (command.operation === "vary")
          s.insurance = varyPolicy(s.insurance, command.policyId, {
            ...(command.deductibleMinor !== undefined
              ? { deductibleMinor: command.deductibleMinor }
              : {}),
            ...(command.limitMinor !== undefined
              ? { limitMinor: command.limitMinor }
              : {}),
          });
        else s.insurance = cancelPolicy(s.insurance, command.policyId);
        const policy =
          s.insurance.policies.find(
            (candidate) => candidate.id === command.policyId,
          ) ?? prior!;
        this.emit(
          {
            type: "INSURANCE_POLICY_CHANGED",
            policyId: command.policyId,
            peril: policy.peril,
            operation: command.operation,
            monthlyPremiumMinor:
              command.operation === "cancel" ? 0 : monthlyPremiumMinor(policy),
          },
          [command.policyId],
        );
        return;
      }
      case "ORDER_SUPPLIES": {
        const supplier = supplierForSku(command.sku);
        if (command.quantity < supplier.minimumQuantity)
          throw new Error(
            `minimum order is ${supplier.minimumQuantity} ${supplier.sku}`,
          );
        const costMinor = command.quantity * supplier.unitPriceMinor;
        const result = placeOrder(
          { cashMinor: costMinor, nowMinutes: s.elapsedMinutes },
          {
            supplierId: supplier.id,
            sku: supplier.sku,
            quantity: command.quantity,
            unitPriceMinor: supplier.unitPriceMinor,
            leadMinutes: supplier.leadMinutes,
          },
        );
        s.finance.month.operatingExpenseMinor += costMinor;
        s.statements.retainedEarningsMinor -= costMinor;
        s.finance.ledger = postEntry(s.finance.ledger, {
          day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
          account: "supplies",
          amountMinor: -costMinor,
          memo: `supplies accrued from ${supplier.id}`,
        });
        s.finance.ledger = postEntry(s.finance.ledger, {
          day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
          account: "supplierAccrual",
          amountMinor: costMinor,
          memo: `supplier payable from ${supplier.id}`,
        });
        s.finance.supplierInvoices.push({
          id: `supplier-invoice.${this.causingCommandId ?? command.type}.${s.calendar.dateKey}`,
          amountMinor: costMinor,
          dueDateKey: addDays(s.calendar.dateKey, supplier.paymentTermsDays),
        });
        s.pendingOrders.push(result.order);
        this.emit(
          {
            type: "SUPPLY_ORDERED",
            sku: command.sku,
            quantity: command.quantity,
            costMinor,
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
        const renovationCostMinor = volatilityScaledCostMinor(
          RENOVATION_COST_MINOR,
          s.narrative.campaign.sandbox,
        );
        const started = startRenovation(
          "module.free.1",
          s.finance.cashMinor,
          {},
          renovationCostMinor,
        );
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
        const reportCostMinor = assistedCostMinor(
          REPORT_COST_MINOR,
          s.narrative.campaign.inputs,
        );
        this.spend(reportCostMinor, "marketResearch", "city market report");
        s.cityMarket.informationQuality = qualityAfterReport(
          s.cityMarket.informationQuality,
        );
        s.cityMarket.forecast = forecastBand(
          totalRoomNights(s.cityMarket.demand),
          accuracyScaledForecastQuality(
            adjustedForecastQuality(
              s.cityMarket.informationQuality,
              s.narrative.campaign.inputs,
            ),
            s.narrative.campaign.sandbox,
          ),
        );
        this.emit(
          {
            type: "MARKET_RESEARCH_PURCHASED",
            informationQuality: s.cityMarket.informationQuality,
            costMinor: reportCostMinor,
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
          remainingMonths: technologyProjectDurationMonths(
            6,
            s.narrative.campaign.sandbox.technologySpeedBasisPoints,
          ),
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
        const previousOpening = adjustedStartingCapitalMinor(
          STARTER_HOTEL.startingCashMinor,
          s.narrative.campaign,
        );
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
        const delta = opening - previousOpening;
        if (delta !== 0) {
          s.finance.cashMinor += delta;
          s.statements.contributedCapitalMinor += delta;
          s.finance.ledger = postEntry(s.finance.ledger, {
            day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
            account: "capital",
            amountMinor: delta,
            memo: `opening capital at ${campaign.difficulty}`,
          });
        }
        if (s.loans && s.loans.length > 0) {
          s.loans[0] = {
            ...s.loans[0],
            annualRateBasisPoints: Math.trunc(
              (STARTER_HOTEL.startingLoan.annualRateBasisPoints *
                campaign.inputs.creditSpreadBasisPoints) /
                10_000,
            ),
          };
        } else if (s.loan) {
          s.loan = {
            ...s.loan,
            annualRateBasisPoints: Math.trunc(
              (STARTER_HOTEL.startingLoan.annualRateBasisPoints *
                campaign.inputs.creditSpreadBasisPoints) /
                10_000,
            ),
          };
        }
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
      case "SET_CAMPAIGN_SANDBOX": {
        const previousOpening = adjustedStartingCapitalMinor(
          STARTER_HOTEL.startingCashMinor,
          s.narrative.campaign,
        );
        const campaign = createCampaignConfig(s.narrative.campaign.difficulty, {
          ...s.narrative.campaign.sandbox,
          ...command.sandbox,
        });
        s.narrative.campaign = campaign;
        const opening = adjustedStartingCapitalMinor(
          STARTER_HOTEL.startingCashMinor,
          campaign,
        );
        const delta = opening - previousOpening;
        if (delta !== 0) {
          s.finance.cashMinor += delta;
          s.statements.contributedCapitalMinor += delta;
          s.finance.ledger = postEntry(s.finance.ledger, {
            day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
            account: "capital",
            amountMinor: delta,
            memo: "opening capital for sandbox",
          });
        }
        syncTreasury(s);
        refreshCareerOutcome(s);
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
        if (isCommercialCommand(command)) {
          applyCommercialCommand(s, command, {
            emit: (payload, entities) => this.emit(payload, entities),
            spend: (amountMinor, account, memo) =>
              this.spend(amountMinor, account, memo),
            earn: (amountMinor, account, memo) =>
              this.earn(amountMinor, account, memo),
          });
          return;
        }
        if (isDistributionCommand(command)) {
          applyDistributionCommand(s, command, {
            emit: (payload, entities) => this.emit(payload, entities),
            spend: (amount, account, memo) => this.spend(amount, account, memo),
            earn: (amount, account, memo) => this.earn(amount, account, memo),
          });
          return;
        }
        if (!isCompanyCommand(command))
          throw new Error(`unknown command ${(command as GameCommand).type}`);
        // The corporate layer writes through the same draft, so an
        // acquisition that fails halfway takes the whole command with it.
        applyCompanyCommand(s, command, {
          emit: (payload, entities) => this.emit(payload, entities),
          spend: (amountMinor, account, memo) =>
            this.spend(amountMinor, account, memo),
          earn: (amountMinor, account, memo) =>
            this.earn(amountMinor, account, memo),
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
        const matching = s.hotel.rooms.filter(
          (room) => room.category === booking.category,
        );
        const clean = matching.filter(
          (room) => room.state === "VacantClean",
        ).length;
        const dirty = matching.filter(
          (room) => room.state === "VacantDirty",
        ).length;
        if (
          clean < booking.roomsRequested &&
          clean + dirty >= booking.roomsRequested
        )
          s.finance.month.housekeepingLateRoomReleaseCount += 1;
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
          title: "alert.cleaning-stockout.title",
          cause: "alert.cleaning-stockout.cause",
          target: { entityId: "facility.housekeeping", kind: "facility" },
        });
        return;
      }
      const pieces = roomModule(dirty.moduleId).linenPieces;
      if (s.linen.clean < pieces) {
        this.clearAlerts(["alert.linen-short"]);
        this.pushAlert({
          id: "alert.linen-short",
          severity: "warning",
          title: "alert.linen-short.title",
          cause: "alert.linen-short.cause",
          target: { entityId: "facility.housekeeping", kind: "facility" },
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
      if (assigned.length < booking.roomsRequested) {
        const waited =
          s.receptionQueue.find((item) => item.bookingId === bookingId)
            ?.waitedMinutes ?? 0;
        if (waited >= 30) {
          const costMinor = displacementCostMinor(
            booking.roomsRequested,
            booking.rateMinor,
            2_000,
            5_000,
          );
          const walked = walkGuest(booking, s.elapsedMinutes);
          booking.status = walked.status;
          booking.history = walked.history;
          s.receptionQueue = s.receptionQueue.filter(
            (item) => item.bookingId !== bookingId,
          );
          this.spend(costMinor, "serviceRecovery", `walked ${booking.id}`);
          this.moveReputation("hotel", s.hotel.id, -8, "overbooking walk");
          this.openPartyStay(booking, "walked", waited);
          const stayIndex = s.guestRelations.stays.findIndex(
            (stay) => stay.bookingId === booking.id,
          );
          if (stayIndex >= 0)
            s.guestRelations.stays[stayIndex] = recordStayEvent(
              s.guestRelations.stays[stayIndex],
              { stage: "checkIn", cause: "overbookingWalk", delta: -25 },
            );
          this.emit(
            {
              type: "BOOKING_WALKED",
              bookingId: booking.id,
              costMinor,
              cause: "no physical room available",
            },
            [booking.id, s.hotel.id],
          );
        }
        continue;
      }

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
    this.runRestaurant();
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
          severity: "notice",
          title: "alert.space.title",
          cause: result.cause,
          causeValues: {
            ...result.causeValues,
            turnedAway: result.turnedAway,
          },
          target: { entityId: space.id, kind: "facility" },
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
        title: "alert.security.spaces.title",
        cause: security.cause,
        causeValues: security.causeValues,
        target: { entityId: "facility.security", kind: "facility" },
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
    const boardCovers = boardCommitment("bed-and-breakfast", {
      guests: s.stays.length,
      nights: 1,
    }).breakfast;
    const demand = boardCovers + this.eventBreakfastCovers();
    const seats = STARTER_HOTEL.breakfastSeats;
    const reservedSeats = 0;
    const seating = seatService({
      demand,
      seats,
      reservedSeats,
      walkIns: 0,
      serviceMinutes: BREAKFAST_CLOSE_MINUTE - BREAKFAST_START,
      averageStayMinutes: BREAKFAST_STAY_MINUTES,
      // The seating calculation owns seats and turns only. Kitchen capacity
      // remains a separate facility constraint below.
      kitchenCovers: seats * 8,
      isOpen: true,
    });
    const serviceThroughput =
      this.onDuty("kitchen") * STARTER_HOTEL.kitchenCovers;
    const kitchenThroughput = STARTER_HOTEL.kitchenCovers;
    const stock = s.stock[FNB_SERVICE_STOCK_SKU] ?? 0;
    const prepared = plannedFnbPreparation(demand, kitchenThroughput);
    const constraints: FacilityConstraint[] = [
      { label: "facility.cause.demand", value: demand },
      { label: "facility.cause.seating", value: seating.capacity },
      { label: "facility.cause.serviceStaff", value: serviceThroughput },
      { label: "facility.cause.kitchenLine", value: kitchenThroughput },
      { label: "facility.cause.stock", value: stock },
      { label: "facility.cause.miseEnPlace", value: prepared },
    ];
    const row = facilityRow({
      id: "fnb.breakfastRoom",
      name: "Breakfast room",
      demand,
      constraints,
    });
    const kitchen = runKitchenService({
      boardCovers: Math.min(seating.seated, row.capacity),
      aLaCarteCovers: 0,
      prepared,
      stock,
      allergyCovers: 0,
      substitutionStock: 0,
      ingredientMinor: supplierForSku(FNB_SERVICE_STOCK_SKU).unitPriceMinor,
      wasteBp: FNB_WASTE_BP,
    });
    const consumed = kitchen.served + kitchen.wasted;
    if (consumed > 0)
      s.stock = consume(s.stock, FNB_SERVICE_STOCK_SKU, consumed);
    if (kitchen.served > 0) {
      const revenue = kitchen.served * STARTER_HOTEL.breakfastPriceMinor;
      this.earn(revenue, "breakfastRevenue", "breakfast covers");
      s.finance.month.otherRevenueMinor += revenue;
    }
    this.recordFnbOutlet({
      id: "breakfastRoom",
      seats,
      reservedSeats,
      demand,
      capacity: row.capacity,
      served: kitchen.served,
      waitlisted: Math.max(0, demand - kitchen.served),
      serviceThroughput,
      kitchenThroughput,
      stockLeft: kitchen.stockLeft,
      wastedCovers: kitchen.wasted,
      ingredientExpenseMinor: kitchen.ingredientExpenseMinor,
      averageWaitMinutes: demand > kitchen.served ? BREAKFAST_STAY_MINUTES : 0,
      serviceUtilizationBp: utilizationBp(demand, serviceThroughput),
      kitchenUtilizationBp: utilizationBp(demand, kitchenThroughput),
      cause: row.cause as FnbConstraintKey,
    });
  }

  private runRestaurant(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== RESTAURANT_SERVICE_MINUTE) return;
    const houseDemand = Math.floor((s.stays.length * 6000) / 10000);
    const outside = externalCovers({
      baseCovers: STARTER_HOTEL.restaurantBaseExternalCovers,
      seasonalityBp: seasonalityBp(s.calendar.dateKey),
      priceIndexBp: STARTER_HOTEL.restaurantPriceIndexBp,
      reputationBp: STARTER_HOTEL.restaurantReputationBp,
    });
    const demand = houseDemand + outside;
    const seats = STARTER_HOTEL.restaurantSeats;
    const reservedSeats = 0;
    const seating = seatService({
      demand,
      seats,
      reservedSeats,
      walkIns: 0,
      serviceMinutes: 240,
      averageStayMinutes: 90,
      kitchenCovers: seats * 2,
      isOpen: true,
    });
    const serviceThroughput = this.onDuty("fnb") * COVERS_PER_BARKEEPER;
    const kitchenThroughput = STARTER_HOTEL.kitchenCovers;
    const stock = s.stock[FNB_SERVICE_STOCK_SKU] ?? 0;
    const prepared = plannedFnbPreparation(demand, kitchenThroughput);
    const row = facilityRow({
      id: "fnb.restaurant",
      name: "Restaurant",
      demand,
      constraints: [
        { label: "facility.cause.demand", value: demand },
        { label: "facility.cause.seating", value: seating.capacity },
        { label: "facility.cause.serviceStaff", value: serviceThroughput },
        { label: "facility.cause.kitchenLine", value: kitchenThroughput },
        { label: "facility.cause.stock", value: stock },
        { label: "facility.cause.miseEnPlace", value: prepared },
      ],
    });
    const kitchen = runKitchenService({
      boardCovers: 0,
      aLaCarteCovers: Math.min(seating.seated, row.capacity),
      prepared,
      stock,
      allergyCovers: 0,
      substitutionStock: 0,
      ingredientMinor: averageIngredientMinor("restaurant"),
      wasteBp: FNB_WASTE_BP,
    });
    const consumed = kitchen.served + kitchen.wasted;
    if (consumed > 0)
      s.stock = consume(s.stock, FNB_SERVICE_STOCK_SKU, consumed);
    if (kitchen.served > 0) {
      const revenue = kitchen.served * averageCoverMinor("restaurant");
      this.earn(
        revenue,
        "restaurantRevenue",
        `${kitchen.served} restaurant covers`,
      );
      s.finance.month.otherRevenueMinor += revenue;
    }
    this.recordFnbOutlet({
      id: "restaurant",
      seats,
      reservedSeats,
      demand,
      capacity: row.capacity,
      served: kitchen.served,
      waitlisted: Math.max(0, demand - kitchen.served),
      serviceThroughput,
      kitchenThroughput,
      stockLeft: kitchen.stockLeft,
      wastedCovers: kitchen.wasted,
      ingredientExpenseMinor: kitchen.ingredientExpenseMinor,
      averageWaitMinutes: demand > kitchen.served ? 45 : 0,
      serviceUtilizationBp: utilizationBp(demand, serviceThroughput),
      kitchenUtilizationBp: utilizationBp(demand, kitchenThroughput),
      cause: row.cause as FnbConstraintKey,
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
    const demand = houseDemand + outside;
    const seats = STARTER_HOTEL.barSeats;
    const reservedSeats = 0;
    const seating = seatService({
      demand,
      seats,
      reservedSeats,
      walkIns: 0,
      serviceMinutes: BAR_CLOSE_MINUTE - BAR_OPEN_MINUTE,
      averageStayMinutes: BAR_STAY_MINUTES,
      kitchenCovers: seats * 7,
      isOpen: true,
    });
    const serviceThroughput = this.onDuty("fnb") * COVERS_PER_BARKEEPER;
    const kitchenThroughput = STARTER_HOTEL.kitchenCovers;
    const stock = s.stock[FNB_SERVICE_STOCK_SKU] ?? 0;
    const prepared = plannedFnbPreparation(demand, kitchenThroughput);
    const row = facilityRow({
      id: "fnb.bar",
      name: "Bar and lounge",
      demand,
      constraints: [
        { label: "facility.cause.demand", value: demand },
        { label: "facility.cause.seating", value: seating.capacity },
        { label: "facility.cause.serviceStaff", value: serviceThroughput },
        { label: "facility.cause.kitchenLine", value: kitchenThroughput },
        { label: "facility.cause.stock", value: stock },
        { label: "facility.cause.miseEnPlace", value: prepared },
      ],
    });
    const kitchen = runKitchenService({
      boardCovers: 0,
      aLaCarteCovers: Math.min(seating.seated, row.capacity),
      prepared,
      stock,
      allergyCovers: 0,
      substitutionStock: 0,
      ingredientMinor: averageIngredientMinor("bar"),
      wasteBp: FNB_WASTE_BP,
    });
    const consumed = kitchen.served + kitchen.wasted;
    if (consumed > 0)
      s.stock = consume(s.stock, FNB_SERVICE_STOCK_SKU, consumed);
    if (kitchen.served > 0) {
      const revenue = barRevenueMinor(kitchen.served, averageCoverMinor("bar"));
      this.earn(revenue, "barRevenue", `${kitchen.served} bar covers`);
      s.finance.month.otherRevenueMinor += revenue;
    }
    this.recordFnbOutlet({
      id: "bar",
      seats,
      reservedSeats,
      demand,
      capacity: row.capacity,
      served: kitchen.served,
      waitlisted: Math.max(0, demand - kitchen.served),
      serviceThroughput,
      kitchenThroughput,
      stockLeft: kitchen.stockLeft,
      wastedCovers: kitchen.wasted,
      ingredientExpenseMinor: kitchen.ingredientExpenseMinor,
      averageWaitMinutes: demand > kitchen.served ? BAR_STAY_MINUTES : 0,
      serviceUtilizationBp: utilizationBp(demand, serviceThroughput),
      kitchenUtilizationBp: utilizationBp(demand, kitchenThroughput),
      cause: row.cause as FnbConstraintKey,
    });
  }

  private runRoomService(): void {
    const s = this.state;
    if (s.calendar.minuteOfDay !== ROOM_SERVICE_MINUTE) return;
    const orders = roomServiceOrders({
      occupiedRooms: s.stays.length,
      minuteOfDay: s.calendar.minuteOfDay,
    });
    const item = menuItem("menu.roomservice.club");
    const minutes = deliveryMinutes({
      kitchen: item.prepMinutes,
      elevator: elevatorWaitMinutes(s.elevatorTrips, this.workingLifts()),
      service: 6,
    });
    const serviceThroughput = this.onDuty("fnb") * COVERS_PER_BARKEEPER;
    const kitchenThroughput = STARTER_HOTEL.kitchenCovers;
    const transportThroughput = serviceThroughput;
    const elevatorThroughput =
      this.workingLifts() * STARTER_HOTEL.kitchenCovers;
    const stock = s.stock[FNB_SERVICE_STOCK_SKU] ?? 0;
    const prepared = plannedFnbPreparation(orders, kitchenThroughput);
    const row = facilityRow({
      id: "fnb.roomService",
      name: "Room service",
      demand: orders,
      constraints: [
        { label: "facility.cause.demand", value: orders },
        { label: "facility.cause.kitchenLine", value: kitchenThroughput },
        { label: "facility.cause.serviceStaff", value: serviceThroughput },
        { label: "facility.cause.transport", value: transportThroughput },
        { label: "facility.cause.elevator", value: elevatorThroughput },
        { label: "facility.cause.stock", value: stock },
        { label: "facility.cause.miseEnPlace", value: prepared },
      ],
    });
    const kitchen = runKitchenService({
      boardCovers: 0,
      aLaCarteCovers: row.capacity,
      prepared,
      stock,
      allergyCovers: 0,
      substitutionStock: 0,
      ingredientMinor: item.ingredientMinor,
      wasteBp: FNB_WASTE_BP,
    });
    const consumed = kitchen.served + kitchen.wasted;
    if (consumed > 0)
      s.stock = consume(s.stock, FNB_SERVICE_STOCK_SKU, consumed);
    if (kitchen.served > 0) {
      s.elevatorTrips += elevatorTrips({
        arrivals: 0,
        departures: 0,
        serviceRuns: kitchen.served,
      });
      const revenue = kitchen.served * item.priceMinor;
      this.earn(
        revenue,
        "roomServiceRevenue",
        `${kitchen.served} room-service orders`,
      );
      s.finance.month.otherRevenueMinor += revenue;
    }
    const waitlisted = Math.max(0, orders - kitchen.served);
    this.recordFnbOutlet({
      id: "roomService",
      seats: 0,
      reservedSeats: 0,
      demand: orders,
      capacity: row.capacity,
      served: kitchen.served,
      waitlisted,
      serviceThroughput,
      kitchenThroughput,
      stockLeft: kitchen.stockLeft,
      wastedCovers: kitchen.wasted,
      ingredientExpenseMinor: kitchen.ingredientExpenseMinor,
      averageWaitMinutes: orders > 0 ? minutes : 0,
      serviceUtilizationBp: utilizationBp(orders, serviceThroughput),
      kitchenUtilizationBp: utilizationBp(orders, kitchenThroughput),
      cause: row.cause as FnbConstraintKey,
    });
  }

  private recordFnbOutlet(next: FnbOutletState): void {
    const index = this.state.fnb.outlets.findIndex(
      (outlet) => outlet.id === next.id,
    );
    if (index < 0) throw new Error(`unknown F&B outlet ${next.id}`);
    const previousCause = this.state.fnb.outlets[index].cause;
    this.state.fnb.outlets[index] = next;
    if (previousCause !== next.cause)
      this.emit(
        {
          type: "FACILITY_CONSTRAINT_CHANGED",
          facilityId: `fnb.${next.id}`,
          cause: next.cause,
        },
        [`fnb.${next.id}`],
      );

    const delayed =
      next.waitlisted > 0 ||
      (next.id === "roomService" &&
        lateDeliveryComplaints(next.served, next.averageWaitMinutes) > 0);
    const waitAlertId = `alert.fnb-wait.${next.id}`;
    if (delayed)
      this.pushAlert({
        id: waitAlertId,
        severity: "warning",
        title: "alert.fnb-wait.title",
        cause: "alert.fnb-wait.cause",
        causeValues: {
          outletId: next.id,
          demand: next.demand,
          capacity: next.capacity,
          waitlisted: next.waitlisted,
          averageWaitMinutes: next.averageWaitMinutes,
        },
        target: {
          entityId:
            next.id === "breakfastRoom"
              ? "facility.breakfast_room"
              : next.id === "bar"
                ? "facility.bar"
                : next.id === "restaurant"
                  ? "facility.restaurant"
                  : "facility.kitchen",
          kind: "facility",
        },
      });
    else this.clearAlerts([waitAlertId]);

    if (next.id === "breakfastRoom")
      this.clearAlerts(["alert.breakfast-queue"]);
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
          title: "alert.spa-unstaffed.title",
          cause: "alert.spa-unstaffed.cause",
          causeValues: { demand, sold, therapists: s.wellness.therapists },
          target: { entityId: "facility.wellness", kind: "facility" },
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
          const peril = ASSET_INSURANCE_PERIL[degraded.id];
          const policy = peril
            ? s.insurance.policies.find(
                (candidate) => candidate.peril === peril,
              )
            : undefined;
          if (policy) {
            const claimId = `claim.${s.elapsedMinutes}.${degraded.id}`;
            s.insurance = fileClaim(
              s.insurance,
              {
                id: claimId,
                policyId: policy.id,
                perilId: peril!,
                lossMinor: degraded.replacementMinor,
                filedAtMinutes: s.elapsedMinutes,
                cause: `failure:${degraded.id}`,
              },
              this.streams.failures,
            );
            this.emit(
              {
                type: "INSURANCE_CLAIM_FILED",
                claimId,
                policyId: policy.id,
                lossMinor: degraded.replacementMinor,
              },
              [claimId, policy.id],
            );
          }
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
          title: "alert.security-short.title",
          cause: gap.cause,
          causeValues: gap.causeValues,
          target: { entityId: "facility.security", kind: "facility" },
        });

      const pressureBp = changingRoomPressureBp(
        s.staff.filter((m) => !m.absent).length,
        staffAreaCapacity({ areaSqm: STARTER_HOTEL.staffAreaSqm }),
      );
      if (pressureBp > 0)
        this.pushAlert({
          id: "alert.staff-areas-crowded",
          severity: "warning",
          title: "alert.staff-areas-crowded.title",
          cause: "alert.staff-areas-crowded.cause",
          target: { entityId: "facility.staff_area", kind: "facility" },
        });

      const noiseBp = s.renovation
        ? noisePenaltyBp(s.renovation.project, s.stays.length)
        : 0;
      if (noiseBp > 0)
        this.pushAlert({
          id: "alert.construction-noise",
          severity: "warning",
          title: "alert.construction-noise.title",
          cause: "alert.construction-noise.cause",
          causeValues: { guests: s.stays.length },
          target: { entityId: "facility.maintenance", kind: "facility" },
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
        title: "alert.long-check-in.title",
        cause: "alert.long-check-in.cause",
        causeValues: {
          bookingId: waiting.bookingId,
          waitedMinutes: waiting.waitedMinutes,
        },
        target: {
          entityId: "navigation.reception.queue",
          kind: "navigation",
        },
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
        title: "alert.complaint-unanswered.title",
        cause: verdict.cause,
        causeValues: verdict.causeValues,
        target: {
          entityId: "navigation.reception.queue",
          kind: "navigation",
        },
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
        cause: "receptionWait",
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
        title: "alert.recovery-escalated.title",
        cause: "alert.recovery-escalated.cause",
        causeValues: { bookingId, expenseMinor: outcome.expenseMinor },
        target: {
          entityId: "navigation.reception.queue",
          kind: "navigation",
        },
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
      cause: waitedMinutes > 0 ? "receptionWait" : "noReceptionWait",
      ...(waitedMinutes > 0 ? { values: { waitedMinutes } } : {}),
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
    // How hard a failure lands is what the guests are like, and that is a
    // disclosed difficulty input. Goodwill earned is never scaled.
    const applied = toleratedSatisfactionDelta(
      delta,
      s.narrative.campaign.inputs,
    );
    const score = Math.max(
      0,
      Math.min(100, s.guestSatisfaction.score + applied),
    );
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
    const loyalty = s.commercial.loyalty.active
      ? earnPoints(s.commercial.loyalty, {
          guestId,
          roomRevenueMinor: stay.rateMinor,
          nights: 1,
        })
      : s.commercial.loyalty;
    s.commercial = {
      ...s.commercial,
      crm: recordCrmStay(s.commercial.crm, {
        guestId,
        stayId: stay.bookingId,
      }),
      loyalty,
    };
    const member = memberFor(loyalty, guestId);
    const benefit = member
      ? tierBenefits(tierForNights(member.qualifyingNights))[0]
      : undefined;
    const redemptionPoints = member ? Math.min(member.points, 100) : 0;
    if (benefit && redemptionPoints >= 100) {
      const burned = burnPoints(s.commercial.loyalty, {
        guestId,
        points: redemptionPoints,
      });
      s.commercial.loyalty = burned.state;
      if (burned.costMinor > 0)
        this.spend(
          burned.costMinor,
          "loyaltyBenefit",
          `${benefit} for ${guestId}`,
        );
      this.emit(
        {
          type: "LOYALTY_BENEFIT_APPLIED",
          guestId,
          benefit,
          costMinor: burned.costMinor,
        },
        [guestId],
      );
    }
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
      if (
        booking &&
        ["corporate", "group", "travelAgency", "ota", "allotment"].includes(
          booking.channel,
        )
      ) {
        const contract =
          booking.channel === "corporate"
            ? activeContracts(s.commercial.sales, booking.arrivalDateKey).find(
                (item) => item.segmentId === booking.segmentId,
              )
            : undefined;
        const paymentTermsDays =
          contract?.paymentTermsDays ??
          s.distribution.groupBlocks.find(
            (block) => block.id === booking.segmentId,
          )?.paymentTermsDays ??
          0;
        const id = `receivable.${booking.id}.${s.calendar.dateKey}`;
        if (!s.statements.receivables.some((item) => item.id === id))
          this.recogniseRevenueOnTerms(
            recognized,
            "roomRevenue",
            stay.roomId,
            addDays(s.calendar.dateKey, paymentTermsDays || 14),
            id,
          );
      } else {
        this.earn(recognized, "roomRevenue", stay.roomId);
        s.finance.month.roomRevenueMinor += recognized;
      }
      this.recordCommercialStay(stay);
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
      const activeLoans = s.loans ?? (s.loan ? [s.loan] : []);
      const year = Number(s.calendar.dateKey.slice(0, 4));
      const month = Number(s.calendar.dateKey.slice(5, 7));
      const currentMonthIndex = (year - 1991) * 12 + (month - 1);
      const remainingActiveLoans: typeof activeLoans = [];

      for (const loan of activeLoans) {
        let activeLoan = loan;
        const elapsedMonths = Math.max(
          0,
          currentMonthIndex - activeLoan.startMonthIndex,
        );
        const remainingTerm = Math.max(
          1,
          activeLoan.termMonths - elapsedMonths,
        );

        if (activeLoan.rateType === "variable") {
          const newRate = Math.max(
            0,
            s.world.macro.interestBp + activeLoan.spreadBasisPoints,
          );
          activeLoan = drawLoan(
            activeLoan.principalMinor,
            newRate,
            remainingTerm,
            {
              id: activeLoan.id,
              amortisation: activeLoan.amortisation,
              rateType: activeLoan.rateType,
              spreadBasisPoints: activeLoan.spreadBasisPoints,
              startMonthIndex: currentMonthIndex,
              collateralValueMinor: activeLoan.collateralValueMinor,
            },
          );
        }

        const schedule = debtSchedule({
          ...activeLoan,
          termMonths: remainingTerm,
        });
        const instalment = schedule[0] ?? {
          interestMinor: accrueMonthlyInterestMinor(activeLoan),
          principalMinor: 0,
        };

        const interest = instalment.interestMinor;
        const scheduledPrincipal = instalment.principalMinor;
        const totalDue = interest + scheduledPrincipal;

        if (s.finance.cashMinor >= totalDue) {
          s.finance.paymentHistory.onTimePayments += 1;
          s.finance.paymentHistory.consecutiveMissedPayments = 0;
        } else {
          s.finance.paymentHistory.missedPayments += 1;
          s.finance.paymentHistory.consecutiveMissedPayments += 1;
        }

        this.spend(interest, "interest", `loan interest ${activeLoan.id}`);
        s.finance.month.interestMinor += interest;

        if (scheduledPrincipal > 0) {
          const cashAvailableForPrincipal = Math.max(0, s.finance.cashMinor);
          const principalPaid = Math.min(
            scheduledPrincipal,
            cashAvailableForPrincipal,
          );
          this.spend(
            scheduledPrincipal,
            "loanPrincipal",
            `scheduled loan principal ${activeLoan.id}`,
          );
          if (principalPaid > 0) {
            activeLoan = repayLoan(activeLoan, principalPaid);
          }
        }

        if (activeLoan.principalMinor > 0) {
          remainingActiveLoans.push(activeLoan);
        }
      }

      s.loans = remainingActiveLoans;
      if (s.loan) {
        s.loan =
          remainingActiveLoans[0] ?? repayLoan(s.loan, s.loan.principalMinor);
      }
    }

    this.settlePayables();
    this.settleSupplierInvoicesDue(s.calendar.dateKey);
    this.settleInsuranceClaims();
    this.runContractCalendar();
    this.settleReceivablesDue(s.calendar.dateKey);
    if (this.monthRolled) {
      this.closeMonth();
      s.finance.ledger = compactLedgerHistory(
        s.finance.ledger,
        Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      );
      s.finance.month.openingLedgerIndex = s.finance.ledger.length;
    }
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
    this.generateContractDemand();

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
      let rateMinor = getRate(
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
      }).filter(
        (candidate) =>
          candidate.commissionBp <=
            s.revenuePolicy.channelCostLimitBasisPoints &&
          channelMaySell(
            candidate,
            s.distribution.channelInventory,
            category,
            "flexible",
          ),
      );
      if (channels.length === 0) continue;
      const advanceChannels = advanceBookingChannels(channels);
      const channelDefinition =
        leadDays === 0
          ? channels.find((candidate) => candidate.id === "walkIn")!
          : advanceChannels[
              this.streams.guests.nextUint32() % advanceChannels.length
            ];
      const channel = channelDefinition.id as BookingChannel;
      const plan =
        s.revenuePolicy.ratePlans.find(
          (candidate) => candidate.id === "flexible",
        ) ?? s.revenuePolicy.ratePlans[0];
      if (!plan) continue;
      const totalRooms = s.hotel.rooms.filter(
        (room) => room.category === category,
      ).length;
      const occupied =
        totalRooms - this.availableRooms(arrivalDateKey, category);
      const decision = automaticRate(
        rateMinor,
        {
          occupancy: totalRooms
            ? Math.trunc((occupied * 10_000) / totalRooms)
            : 0,
          leadTime: leadDays,
          forecast: s.cityMarket.forecast.base,
        },
        s.revenuePolicy,
      );
      rateMinor = Math.max(
        s.revenuePolicy.rateFloorMinor,
        Math.min(s.revenuePolicy.rateCeilingMinor, decision.rateMinor),
      );
      try {
        rateMinor = applyRatePlan(rateMinor, plan, segment.averageNights, {
          leadDays,
          channelId: channel,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "rate plan restrictions reject stay"
        ) {
          this.pushAlert({
            id: `alert.booking-refused.booking.${s.elapsedMinutes}.${i}`,
            severity: "info",
            title: "alert.booking-refused.title",
            cause: "alert.booking-refused.cause.price",
            causeValues: { bookingId: `booking.${s.elapsedMinutes}.${i}` },
          });
          continue;
        }
        throw error;
      }
      const contract = activeContracts(s.commercial.sales, arrivalDateKey).find(
        (candidate) => candidate.segmentId === segment.id,
      );
      if (contract)
        rateMinor = corporateRateMinor(
          rateMinor,
          negotiatedDiscountBasisPoints(contract, rateMinor),
        );
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
            ...(decision.rateMinor !==
            getRate(
              s.rates,
              arrivalDateKey,
              category,
              STARTER_HOTEL.defaultRateMinor[category],
            )
              ? {
                  rateExplanation: explainCause(
                    "rateChanged",
                    decision.causes.map((factor, index) => ({
                      factor,
                      weight: decision.causes.length - index,
                    })),
                  ),
                }
              : {}),
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
            ratePlanId: contract ? "corporate" : plan.id,
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
        if (!(error instanceof ReservationRefusalError)) throw error;
        const refusal: LocalizedAlertCause | null =
          error.code === "price-rejected"
            ? {
                cause: "alert.booking-refused.cause.price" as const,
                causeValues: { bookingId },
              }
            : error.code === "no-inventory"
              ? {
                  cause: "alert.booking-refused.cause.inventory" as const,
                  causeValues: {
                    bookingId,
                    dateKey: error.dateKey,
                  },
                }
              : null;
        if (refusal) {
          this.pushAlert({
            id: `alert.booking-refused.${bookingId}`,
            severity: "info",
            title: "alert.booking-refused.title",
            ...refusal,
          });
          continue;
        }
        throw error;
      }
    }
  }

  private generateContractDemand(): void {
    const s = this.state;
    const arrivalDateKey = addDays(s.calendar.dateKey, 1);
    const addReservation = (
      request: Parameters<typeof reserve>[1],
      releasedHoldRooms = 0,
    ) => {
      if (s.reservations.some((booking) => booking.id === request.id)) return;
      try {
        const booking = reserve(
          {
            availableRoomsOn: (date) =>
              this.availableRooms(date, request.category) + releasedHoldRooms,
          },
          request,
        );
        s.reservations.push(booking);
        this.emit(
          {
            type: "BOOKING_CONFIRMED",
            bookingId: booking.id,
            arrivalDateKey: booking.arrivalDateKey,
            nights: booking.nights,
            category: booking.category,
            roomsRequested: booking.roomsRequested,
            rateMinor: booking.rateMinor,
            segmentId: booking.segmentId,
          },
          [booking.id],
        );
      } catch (error) {
        if (!(error instanceof ReservationRefusalError)) throw error;
      }
    };
    for (const contract of activeContracts(
      s.commercial.sales,
      arrivalDateKey,
    )) {
      const rooms = Math.max(1, Math.trunc(contract.expectedRoomNights / 365));
      addReservation({
        id: `corporate.${contract.id}.${arrivalDateKey}`,
        guestId: `account.${contract.id}`,
        roomsRequested: rooms,
        rateMinor: contract.negotiatedRateMinor,
        willingnessMinor: contract.negotiatedRateMinor,
        channel: "corporate",
        partySize: rooms,
        segmentId: contract.segmentId,
        category: "single",
        arrivalDateKey,
        nights: 1,
        terms: {
          guaranteed: true,
          freeCancellationDays: contract.cancellationDaysBeforeArrival,
          lateChargeBp: contract.cancellationFeeBasisPoints,
        },
        atMinutes: s.elapsedMinutes,
        bookingDateKey: s.calendar.dateKey,
        ratePlanId: "corporate",
        commissionBp: 500,
        depositMinor: 0,
        specialRequirements: contract.concessions,
      });
    }
    for (const block of s.distribution.groupBlocks.filter(
      (item) => item.status === "confirmed",
    )) {
      const rooms = block.roomsByDate[arrivalDateKey] ?? 0;
      if (!rooms) continue;
      addReservation(
        {
          id: `group.${block.id}.${arrivalDateKey}`,
          guestId: `group.${block.id}`,
          roomsRequested: rooms,
          rateMinor: block.groupRateMinor,
          willingnessMinor: block.groupRateMinor,
          channel: "group",
          partySize: rooms,
          segmentId: block.id,
          category: block.category as RoomCategory,
          arrivalDateKey,
          nights: 1,
          terms: {
            guaranteed: true,
            freeCancellationDays: block.cancellationDaysBeforeArrival,
            lateChargeBp: block.cancellationFeeBasisPoints,
          },
          atMinutes: s.elapsedMinutes,
          bookingDateKey: s.calendar.dateKey,
          ratePlanId: "group",
          commissionBp: 600,
          depositMinor: block.depositMinor,
          specialRequirements: [],
        },
        rooms,
      );
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
    const existingHousekeepingAlert = s.alerts.find(
      (alert) => alert.id === "alert.housekeeping-backlog",
    );
    s.alerts = s.alerts.filter((a) => a.id !== "alert.housekeeping-backlog");
    if (dirty > 5) {
      this.pushAlert({
        id: "alert.housekeeping-backlog",
        severity: "warning",
        title: "alert.housekeeping-backlog.title",
        cause: "alert.housekeeping-backlog.cause",
        causeValues: { rooms: dirty },
        target: { entityId: "facility.housekeeping", kind: "facility" },
      });
      if (existingHousekeepingAlert?.acknowledged)
        s.alerts = s.alerts.map((alert) =>
          alert.id === "alert.housekeeping-backlog"
            ? { ...alert, acknowledged: true }
            : alert,
        );
    }
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
    this.refreshRenderDescriptors();
    this.refreshClassification();
    // Group cash is one number wherever it moved this quantum; the treasury
    // only records where inside the group it sits.
    syncTreasury(this.state);
    this.refreshLobby();
    const m = this.state.finance.month;
    this.state.metrics = {
      adrMinor: adrMinor(m.roomRevenueMinor, m.soldRoomNights),
      revParMinor: revParMinor(m.roomRevenueMinor, m.availableRoomNights),
      gopparMinor: gopparMinor(
        m.roomRevenueMinor + m.otherRevenueMinor - m.operatingExpenseMinor,
        m.availableRoomNights,
      ),
      occupancyBasisPoints: occupancyBasisPoints(
        m.soldRoomNights,
        m.availableRoomNights,
      ),
    };
  }

  /** Joins authoritative entities into stable, renderer-ready references. */
  private refreshRenderDescriptors(): void {
    const s = this.state;
    const plannedRoomIds = Object.keys(
      s.renderDescriptors.floorPlan.rooms,
    ).sort(compareIds);
    const currentRoomIds = s.hotel.rooms
      .map((room) => room.id)
      .sort(compareIds);
    const geometryIsCurrent =
      plannedRoomIds.length === currentRoomIds.length &&
      plannedRoomIds.every((roomId, index) => roomId === currentRoomIds[index]);
    if (!geometryIsCurrent) {
      const floorPlan = generateFloorPlan(s.hotel.rooms);
      s.renderDescriptors.floorPlan = floorPlan;
      s.renderDescriptors.floorByRoomId = Object.fromEntries(
        Object.values(floorPlan.rooms).map((room) => [room.id, room.floor]),
      );
      s.renderDescriptors.positionByEntityId = positionMapForPlan(floorPlan);
    }
    const renovationPhaseByRoomId: GameState["renderDescriptors"]["renovationPhaseByRoomId"] =
      {};
    if (s.renovation)
      for (const roomId of [...s.renovation.project.affected].sort(compareIds))
        renovationPhaseByRoomId[roomId] = s.renovation.project.phase;

    const reservationById = new Map(
      s.reservations.map((reservation) => [reservation.id, reservation]),
    );
    const occupantByRoomId: GameState["renderDescriptors"]["occupantByRoomId"] =
      {};
    for (const stay of [...s.stays].sort((a, b) =>
      compareIds(a.roomId, b.roomId),
    )) {
      const reservation = reservationById.get(stay.bookingId);
      occupantByRoomId[stay.roomId] = {
        guestId: reservation?.guestId ?? `guest.${stay.bookingId}`,
        bookingId: stay.bookingId,
        rateMinor: stay.rateMinor,
        departureDateKey: stay.departureDateKey,
      };
    }

    s.renderDescriptors.renovationPhaseByRoomId = renovationPhaseByRoomId;
    s.renderDescriptors.occupantByRoomId = occupantByRoomId;
    s.renderDescriptors.agents = describeAgentLocations({
      minuteOfDay: s.calendar.minuteOfDay,
      elapsedMinutes: s.elapsedMinutes,
      reservations: s.reservations,
      stays: s.stays,
      receptionQueue: s.receptionQueue,
      staff: s.staff,
      floorByRoomId: s.renderDescriptors.floorByRoomId,
    });
    const lift = s.assets.find((asset) => asset.id === "asset.lift");
    const waitingGuestIds = s.renderDescriptors.agents
      .filter(
        (agent) =>
          agent.kind === "guest" && agent.locationId.endsWith(".elevator"),
      )
      .map((agent) => agent.id);
    const failed = lift?.status !== "operational";
    const heldFloorByCar = s.renderDescriptors.elevator.cars.map(
      (car) => car.currentFloor,
    );
    const heldPositionFloorBasisPointsByCar =
      s.renderDescriptors.elevator.cars.map(
        (car) => car.positionFloorBasisPoints,
      );
    s.renderDescriptors.elevator = {
      id: "asset.lift",
      capacity: STARTER_HOTEL.elevatorCars * 6,
      queue: waitingGuestIds.length,
      travelMinutes: ELEVATOR_TRIP_MINUTES,
      failed,
      cars: describeLiftCars({
        liftId: "asset.lift",
        cars: STARTER_HOTEL.elevatorCars,
        topFloor: Math.max(
          0,
          ...Object.values(s.renderDescriptors.floorByRoomId),
        ),
        elapsedMinutes: s.elapsedMinutes,
        trips: s.elevatorTrips,
        failed,
        waitingGuestIds,
        heldFloorByCar,
        heldPositionFloorBasisPointsByCar,
      }),
    };
    const queuedGuestIds = s.renderDescriptors.agents
      .filter((agent) => agent.queuedFor === "facility.reception")
      .map((agent) => agent.id);
    s.renderDescriptors.situations = describeOperationalSituations({
      elapsedMinutes: s.elapsedMinutes,
      rooms: s.hotel.rooms,
      floorByRoomId: s.renderDescriptors.floorByRoomId,
      agents: s.renderDescriptors.agents,
      receptionQueueGuestIds: queuedGuestIds,
      receptionDeskCount: s.staff.filter(
        (member) => member.role === "reception",
      ).length,
      assets: s.assets,
      renovationRoomIds: Object.keys(renovationPhaseByRoomId),
      facilities: s.facilities,
      fnb: s.fnb,
    });
    const round = s.renderDescriptors.situations.housekeeping.round;
    if (round) {
      const index = s.renderDescriptors.agents.findIndex(
        (agent) => agent.id === round.agentId,
      );
      if (index >= 0)
        s.renderDescriptors.agents[index] = {
          ...s.renderDescriptors.agents[index],
          locationId: round.locationId,
          routeIds: round.routeIds,
        };
    }
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
      appealBp:
        9000 +
        s.classification.stars * 400 +
        this.campaignVisibilityBasisPoints(),
      conferenceSeats: Math.floor(
        s.investedArea.conferenceSqm / STARTER_HOTEL.conferenceSqmPerSeat,
      ),
    };
  }

  private campaignVisibilityBasisPoints(): number {
    const running = new Set(
      this.state.commercial.campaigns
        .filter((campaign) => campaign.status === "running")
        .map((campaign) => campaign.id),
    );
    const latest = new Map<string, number>();
    for (const entry of this.state.commercial.campaignAttributionLog)
      if (running.has(entry.campaignId))
        latest.set(entry.campaignId, entry.realisedBasisPoints);
    return [...latest.values()].reduce((sum, value) => sum + value, 0);
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
        difficulty: s.narrative.campaign.inputs,
        sandbox: s.narrative.campaign.sandbox,
      },
    );
    s.world = new WorldSimulation(
      this.streams,
      s.narrative.campaign.inputs.crisisBufferBasisPoints,
      s.narrative.campaign.sandbox.economicVolatilityBasisPoints,
      s.narrative.campaign.sandbox.crisisFrequencyBasisPoints,
    ).stepMonth(s.world);
    const stormPolicy = s.insurance.policies.find(
      (policy) => policy.peril === "storm",
    );
    if (stormPolicy && s.world.weather.insurable) {
      const rebuildValueMinor = this.rebuildValueMinor();
      const exposureMinor = Math.min(
        stormPolicy.insuredValueMinor,
        rebuildValueMinor,
      );
      const weatherLossMinor = Math.trunc(
        (exposureMinor * s.world.weather.severityBp) / 10_000,
      );
      const insurableLossMinor = weatherInsurancePayout(
        weatherLossMinor,
        s.world.weather,
        10_000,
        stormPolicy.deductibleMinor,
      );
      if (insurableLossMinor > 0) {
        const claimId = `claim.${s.elapsedMinutes}.storm`;
        s.insurance = fileClaim(
          s.insurance,
          {
            id: claimId,
            policyId: stormPolicy.id,
            perilId: "storm",
            lossMinor: insurableLossMinor,
            filedAtMinutes: s.elapsedMinutes,
            cause: s.world.weather.kind,
          },
          this.streams.failures,
        );
        this.emit(
          {
            type: "INSURANCE_CLAIM_FILED",
            claimId,
            policyId: stormPolicy.id,
            lossMinor: insurableLossMinor,
          },
          [claimId, stormPolicy.id],
        );
      }
    }
    s.technologyProjects = s.technologyProjects.map((project) =>
      advanceTechnologyProject(project),
    );
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
        this.recogniseRevenueOnTerms(
          event.valueMinor,
          "eventRevenue",
          `conference ${event.id}`,
          addDays(s.calendar.dateKey, 30),
          `receivable.${event.id}.${s.calendar.dateKey}`,
        );
        s.finance.month.eventRevenueMinor += event.valueMinor;
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
      title: "alert.conference-booked.title",
      cause: "alert.conference-booked.cause",
      causeValues: { guests, nights, roomsBlocked },
      target: { entityId: "facility.conference", kind: "facility" },
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
    const restaurant = s.fnb.outlets.find(
      (outlet) => outlet.id === "restaurant",
    );

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
        id: "facility.restaurant",
        name: "Restaurant",
        demand: restaurant?.demand ?? 0,
        constraints: [
          {
            label: restaurant?.cause ?? "facility.cause.closed",
            value: restaurant?.capacity ?? 0,
          },
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
      if (blocked.has(room.id) && room.state !== "Occupied") {
        room.state = "OutOfOrder";
        room.faultReasonCode = "room.fault.renovation";
      }
      // Reopening is a cleaning job, not an instant sale: a handed-over room
      // still has to pass housekeeping.
      else if (
        before.has(room.id) &&
        !blocked.has(room.id) &&
        room.state === "OutOfOrder"
      ) {
        room.state = "VacantDirty";
        room.faultReasonCode = undefined;
      }
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
      recogniseRevenueOnTerms: (amountMinor, account, memo, dueDateKey, id) =>
        this.recogniseRevenueOnTerms(
          amountMinor,
          account,
          memo,
          dueDateKey,
          id,
        ),
    });

    const paymentLag = TAX_PAYMENT_LAG_MONTHS;
    const monthNum = parseInt(periodKey.slice(5, 7), 10);
    const paymentMonthNum = ((11 + paymentLag) % 12) + 1;

    if (monthNum === paymentMonthNum && s.finance.taxPayableMinor > 0) {
      const amount = s.finance.taxPayableMinor;
      this.spend(amount, "tax" as any, "Corporate tax settlement");
      s.finance.taxPayableMinor = 0;
      this.emit(
        {
          type: "TAX_PAID",
          periodKey: periodKey.slice(0, 4),
          amountMinor: amount,
        } as any,
        [this.state.hotel.id],
      );
    }

    let taxChargeThisMonth = 0;
    if (monthNum === 12) {
      const taxRate = taxRateForJurisdiction("DE");
      const annual = s.narrative.annualProfit;
      const base = annual.operatingProfitMinor - annual.interestMinor;
      taxChargeThisMonth = taxChargeMinor(base, taxRate);
      if (taxChargeThisMonth > 0) {
        s.finance.taxPayableMinor += taxChargeThisMonth;
        s.statements.retainedEarningsMinor -= taxChargeThisMonth;
        this.emit(
          {
            type: "TAX_ACCRUED",
            periodKey: periodKey.slice(0, 4),
            amountMinor: taxChargeThisMonth,
          } as any,
          [this.state.hotel.id],
        );
      }
    }

    const m = s.finance.month;
    const report = closeMonth({
      periodKey,
      taxChargeMinor: taxChargeThisMonth,
      openingCashMinor: m.openingCashMinor,
      closingCashMinor: s.finance.cashMinor,
      roomRevenueMinor: m.roomRevenueMinor,
      otherRevenueMinor: m.otherRevenueMinor,
      operatingExpenseMinor: m.operatingExpenseMinor,
      soldRoomNights: m.soldRoomNights,
      availableRoomNights: m.availableRoomNights,
    });
    const baseline = s.monthlyCloseBaseline;
    const briefing = deriveMonthlyBriefing({
      report,
      previous: baseline.previousReport,
      highWaterMarks: baseline.highWaterMarks,
      eventRevenueMinor: m.eventRevenueMinor,
      previousEventRevenueMinor: baseline.previousEventRevenueMinor,
      lateRoomReleaseCount: m.housekeepingLateRoomReleaseCount,
      previousLateRoomReleaseCount: baseline.previousLateRoomReleaseCount,
      signals: {
        dateKey: s.calendar.dateKey,
        supplierContracts: s.procurement.contracts,
        competitors: s.competitors,
      },
    });
    const monthLedger = s.finance.ledger.slice(m.openingLedgerIndex);
    const supplierPayablesMinor = s.finance.supplierInvoices.reduce(
      (sum, invoice) => sum + invoice.amountMinor,
      0,
    );
    s.lastMonthlyClose = {
      ...report,
      ...briefing,
      cashFlowStatement: cashFlowStatement(monthLedger, {
        openingCashMinor: m.openingCashMinor,
      }),
      balanceSheet: balanceSheet({
        cashMinor: s.finance.cashMinor,
        receivablesMinor: s.statements.receivablesMinor,
        fixedAssetsMinor: s.statements.fixedAssetsMinor,
        accumulatedDepreciationMinor: s.statements.accumulatedDepreciationMinor,
        payablesMinor: s.finance.payableMinor + supplierPayablesMinor,
        taxPayableMinor: s.finance.taxPayableMinor,
        debtMinor: (s.loans ?? (s.loan ? [s.loan] : [])).reduce(
          (sum, l) => sum + l.principalMinor,
          0,
        ),
        contributedCapitalMinor: s.statements.contributedCapitalMinor,
        retainedEarningsMinor: s.statements.retainedEarningsMinor,
      }),
    };
    s.monthlyCloseBaseline = {
      previousReport: s.lastMonthlyClose,
      previousEventRevenueMinor: m.eventRevenueMinor,
      previousLateRoomReleaseCount: m.housekeepingLateRoomReleaseCount,
      highWaterMarks: {
        revenueMinor: Math.max(
          baseline.highWaterMarks.revenueMinor,
          report.revenueMinor,
        ),
        operatingProfitMinor: Math.max(
          baseline.highWaterMarks.operatingProfitMinor,
          report.operatingProfitMinor,
        ),
        eventRevenueMinor: Math.max(
          baseline.highWaterMarks.eventRevenueMinor,
          m.eventRevenueMinor,
        ),
      },
    };
    // The flagship's own result is what `publishFlagshipResult` already read
    // off the month accumulator, and it is deliberately not restated from this
    // report. The report is the group's: by the time it is drawn up it also
    // carries every managed house's trading, the brand programmes, the
    // ownership costs and headquarters. Copying it onto Frankfurt would charge
    // one house for the whole company, and every escalation, valuation and
    // portfolio table that reads `hotelResults` would inherit the error.
    // The period that just closed, not the day the close is being posted on:
    // December's close happens on 1 January and belongs to December's year.
    const closedYear = Number(periodKey.slice(0, 4));
    const annual = s.narrative.annualProfit;
    if (annual.year !== closedYear) {
      annual.year = closedYear;
      annual.operatingProfitMinor = 0;
      annual.interestMinor = 0;
    }
    annual.operatingProfitMinor += s.lastMonthlyClose.operatingProfitMinor;
    annual.interestMinor += m.interestMinor;
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
      openingLedgerIndex: s.finance.ledger.length,
      roomRevenueMinor: 0,
      otherRevenueMinor: 0,
      eventRevenueMinor: 0,
      housekeepingLateRoomReleaseCount: 0,
      operatingExpenseMinor: 0,
      interestMinor: 0,
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
      s.statements.retainedEarningsMinor -= amountMinor;
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

    const elapsedDays = daysInMonth(addDays(s.calendar.dateKey, -1));
    for (const campaign of [...s.commercial.campaigns]
      .filter((candidate) => candidate.status === "running")
      .sort((a, b) => compareIds(a.id, b.id))) {
      const age =
        (s.commercial.campaignAgeDays[campaign.id] ?? 0) + elapsedDays;
      s.commercial.campaignAgeDays = {
        ...s.commercial.campaignAgeDays,
        [campaign.id]: age,
      };
      const audience = totalRoomNights(s.cityMarket.demand);
      campaignReach(campaign, audience);
      const attributed = attributedEffectBasisPoints(campaign, audience, age);
      const band = campaignUncertaintyBand(
        Math.min(attributed, campaignEffectBasisPoints(campaign, audience)),
        2500,
      );
      const realised = realisedEffectBasisPoints(band, this.streams.economy);
      s.commercial.campaignAttributionLog = appendCampaignAttribution(
        s.commercial.campaignAttributionLog,
        {
          campaignId: campaign.id,
          ...band,
          realisedBasisPoints: realised,
          atDateKey: s.calendar.dateKey,
        },
      );
      this.emit(
        {
          type: "CAMPAIGN_ATTRIBUTION_RECORDED",
          campaignId: campaign.id,
          realised,
        },
        [campaign.id],
      );
    }
    s.commercial.campaigns = finishExpiredCampaigns(
      s.commercial.campaigns,
      s.commercial.campaignAgeDays,
    );

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
    const distributed = [
      ...s.distribution.allotments,
      ...s.distribution.groupBlocks,
    ]
      .filter(
        (item) =>
          item.category === category &&
          !("status" in item && item.status === "released"),
      )
      .reduce((sum, item) => sum + (item.roomsByDate[dateKey] ?? 0), 0);
    return Math.max(
      0,
      sharedAvailableRooms(
        total,
        {
          [dateKey]:
            held + distributed + this.eventRoomsBlocked(dateKey, category),
        },
        [dateKey],
        s.revenuePolicy.overbookingLimitRooms,
      ),
    );
  }

  private runContractCalendar(): void {
    const s = this.state;
    for (const allotment of s.distribution.allotments.filter(
      (item) => item.releaseDateKey <= s.calendar.dateKey,
    )) {
      const rooms = Object.values(allotment.roomsByDate).reduce(
        (sum, value) => sum + value,
        0,
      );
      this.emit(
        {
          type: "ALLOTMENT_RELEASED",
          allotmentId: allotment.id,
          rooms,
          category: allotment.category,
        },
        [allotment.id],
      );
    }
    s.distribution.allotments = s.distribution.allotments.filter(
      (item) => item.releaseDateKey > s.calendar.dateKey,
    );
    s.distribution.groupBlocks = s.distribution.groupBlocks.map((block) =>
      block.releaseDateKey <= s.calendar.dateKey && block.status === "confirmed"
        ? { ...block, status: "released" as const }
        : block,
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
    if (accountClass(account) === "revenue")
      s.statements.retainedEarningsMinor += amountMinor;
    else if (accountClass(account) === "equity")
      s.statements.contributedCapitalMinor += amountMinor;
    else if (account === "groupDeposit")
      s.finance.payableMinor += amountMinor;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account,
      amountMinor,
      memo,
    });
  }

  private recogniseRevenueOnTerms(
    amountMinor: number,
    account: string,
    memo: string,
    dueDateKey: string,
    id = `receivable.${account}.${this.state.calendar.dateKey}`,
  ): void {
    if (amountMinor <= 0) return;
    const s = this.state;
    s.statements = recogniseReceivable(s.statements, {
      id,
      amountMinor,
      dueDateKey,
    });
    s.statements.retainedEarningsMinor += amountMinor;
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account,
      amountMinor,
      memo,
    });
    s.finance.ledger = postEntry(s.finance.ledger, {
      day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
      account: "receivableAccrual",
      amountMinor: -amountMinor,
      memo: `receivable for ${memo}`,
    });
    if (account === "roomRevenue")
      s.finance.month.roomRevenueMinor += amountMinor;
    else {
      s.finance.month.otherRevenueMinor += amountMinor;
    }
  }

  private settleReceivablesDue(dateKey: string): void {
    for (const receivable of overdueReceivables(
      this.state.statements,
      dateKey,
    )) {
      this.earn(receivable.amountMinor, "receivableCollection", receivable.id);
      this.state.statements = settleReceivable(
        this.state.statements,
        receivable.id,
      );
    }
  }

  private settleSupplierInvoicesDue(dateKey: string): void {
    const s = this.state;
    const due = s.finance.supplierInvoices.filter(
      (invoice) => invoice.dueDateKey <= dateKey,
    );
    for (const invoice of due) {
      if (invoice.amountMinor <= 0) continue;
      const paid = Math.min(invoice.amountMinor, s.finance.cashMinor);
      if (paid > 0) {
        s.finance.cashMinor -= paid;
        invoice.amountMinor -= paid;
        s.finance.ledger = postEntry(s.finance.ledger, {
          day: Math.floor(s.elapsedMinutes / MINUTES_PER_DAY),
          account: "supplierSettlement",
          amountMinor: -paid,
          memo: `supplier invoice ${invoice.id}`,
        });
      }
      if (invoice.amountMinor > 0) {
        this.pushAlert({
          id: "alert.insolvent",
          severity: "critical",
          title: "alert.insolvent.title",
          cause: "alert.insolvent.cause",
          causeValues: { expense: "expense.operating" },
        });
      }
    }
    s.finance.supplierInvoices = s.finance.supplierInvoices.filter(
      (invoice) => invoice.amountMinor > 0,
    );
  }

  private spend(amountMinor: number, account: string, memo: string): void {
    if (amountMinor <= 0) return;
    const s = this.state;
    const paid = Math.min(amountMinor, s.finance.cashMinor);
    const unpaid = amountMinor - paid;
    s.finance.cashMinor -= paid;

    const cls = accountClass(account);
    if (cls === "operating" || cls === "financing")
      s.statements.retainedEarningsMinor -= amountMinor;
    else if (cls === "revenue")
      s.statements.retainedEarningsMinor -= amountMinor; // Contra-revenue in spend

    // What the account is decides this, not what it is called: capex buys an
    // asset and an investment buys a stake, and neither is a cost of running
    // the hotel this month. The expense is recognised in full even when cash
    // cannot cover it.
    // Trading costs only. Interest is a financing cost, and `profitAndLoss`
    // reports it as one; counting it here as well would make the close's
    // operating profit disagree with the statement's for the same period, and
    // every result read off `hotelResults` would inherit the lower figure.
    if (cls === "operating")
      s.finance.month.operatingExpenseMinor += amountMinor;
    // Capital spend buys something: the balance sheet has to know it exists.
    if (account === "capex" || account === "investment")
      s.statements = capitaliseAsset(s.statements, amountMinor);
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
        title: "alert.insolvent.title",
        cause: "alert.insolvent.cause",
        causeValues: { expense: `expense.${accountClass(account)}` },
      });
    }
  }

  private rebuildValueMinor(): number {
    return this.state.assets.reduce(
      (sum, asset) => sum + asset.replacementMinor,
      0,
    );
  }

  private settleInsuranceClaims(): void {
    const s = this.state;
    for (const claim of [...s.insurance.claims].sort((a, b) =>
      compareIds(a.id, b.id),
    )) {
      if (
        claim.status !== "filed" ||
        claim.filedAtMinutes + claim.assessmentMinutes > s.elapsedMinutes
      )
        continue;
      s.insurance = settleClaim(s.insurance, claim.id, {
        atMinutes: s.elapsedMinutes,
        rebuildValueMinor: this.rebuildValueMinor(),
      });
      const settled = s.insurance.claims.find(
        (candidate) => candidate.id === claim.id,
      )!;
      if (settled.settlementMinor > 0)
        this.earn(
          settled.settlementMinor,
          "insuranceSettlement",
          `insurance settlement ${settled.id}`,
        );
      this.emit(
        {
          type: "INSURANCE_CLAIM_SETTLED",
          claimId: settled.id,
          policyId: settled.policyId,
          settlementMinor: settled.settlementMinor,
          status: settled.status as "settled" | "declined",
        },
        [settled.id, settled.policyId],
      );
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
  private pushAlert(
    alert: Omit<
      AlertRecord,
      | "category"
      | "groupId"
      | "source"
      | "gameTime"
      | "actionEntityId"
      | "delegate"
      | "acknowledged"
    >,
  ): boolean {
    if (this.state.alerts.some((a) => a.id === alert.id)) return false;
    const s = this.state;
    const category = alert.id.split(".")[1] || "operations";
    const hotelId = s.hotel.id;
    const manager = managerForHotel(s.company.managers, hotelId);
    const canDelegate =
      manager !== null &&
      alert.severity !== "critical" &&
      escalationReason(manager.authority, {
        kind: "repair",
        amountMinor: 0,
      }) === null;
    s.alerts.push({
      ...alert,
      category,
      groupId: `${hotelId}:${category}`,
      source: {
        companyId: s.company.companyId,
        hotelId,
        ...(s.company.portfolio.hotelRegion[hotelId] === undefined
          ? {}
          : { regionId: s.company.portfolio.hotelRegion[hotelId] }),
      },
      gameTime: `${s.calendar.dateKey}:${s.calendar.minuteOfDay}`,
      actionEntityId: alert.id,
      ...(canDelegate ? { delegate: manager.name } : {}),
      acknowledged: false,
    });
    return true;
  }
}

export const SIMULATION_CITY = CITY;
