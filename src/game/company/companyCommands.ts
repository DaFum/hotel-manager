import type { GameState } from "../simulation/initialState";
import { assistedCostMinor } from "../campaign/difficultyEffects";
import { volatilityScaledUncertaintyBp } from "../campaign/sandboxEffects";
import type { GameCommand } from "../commands/commandEnvelope";
import type { DomainEventPayload } from "../domain/events";
import { addDays } from "../domain/calendar";
import {
  assignBrand,
  findBrand,
  removeBrandAssignment,
} from "../brands/brandTypes";
import { createOperatingContract } from "../ownership/models";
import { createHotelBudget } from "./budgets";
import {
  setAuthorityLimit,
  managerForHotel,
  createDepartmentHeadAuthority,
} from "../management/managerAuthority";
import { resolveEscalation } from "../management/escalation";
import { fundHotel, sweepToHeadquarters } from "../treasury/internalFunding";
import { openHotelAccount } from "../treasury/treasury";
import { calculateFeasibility } from "../development/feasibility";
import {
  createPreOpening,
  markPreOpeningTask,
  openHotel,
  OPENING_CHECKLIST,
} from "../development/preOpening";
import { runDueDiligence, adjustedValuation } from "../ma/dueDiligence";
import { valueHotel } from "../ma/valuation";
import {
  acquisitionCostMinor,
  executeAcquisition,
  markTargetStatus,
} from "../ma/acquisition";
import { addHotelToPortfolio } from "./portfolio";
import { createManagedHotel, registerManagedHotel } from "./managedHotels";
import { findDevelopment } from "./companyState";
import {
  DEVELOPMENT_HURDLE_BP,
  FEASIBILITY_UNCERTAINTY_BP,
  FLAGSHIP_CITY_ID,
  MARKET_GOP_MULTIPLE_BP,
  STARTER_LEGAL_ENTITY,
  STARTER_REGION,
  UNDERWRITING_GOP_MARGIN_BP,
} from "../content/1991/company";
import { calculateCreditStanding } from "../finance/creditStanding";
import { drawLoan, repayLoan } from "../finance/loans";
import { MAX_LOAN_TERM_MONTHS } from "../finance/debt";
import { reputationFor } from "../reputation/dimensions";

/** Command types this module owns; everything else belongs to the hotel. */
const COMPANY_COMMAND_TYPES = [
  "ASSIGN_BRAND",
  "REMOVE_BRAND",
  "SET_OPERATING_MODEL",
  "SET_HOTEL_BUDGET",
  "SET_GROUP_TARGETS",
  "SET_MANAGER_AUTHORITY",
  "RESOLVE_ESCALATION",
  "TRANSFER_INTERNAL_FUNDING",
  "START_DEVELOPMENT",
  "COMPLETE_PRE_OPENING_TASK",
  "OPEN_DEVELOPMENT",
  "RUN_DUE_DILIGENCE",
  "ACQUIRE_HOTEL",
  "TAKE_LOAN",
  "REPAY_LOAN",
] as const;

export type CompanyCommand = Extract<
  GameCommand,
  { type: (typeof COMPANY_COMMAND_TYPES)[number] }
>;

/**
 * What the advisers actually charge. A disclosed difficulty input: an easier
 * game buys the same advice cheaper, and the findings are unchanged because
 * assistance is a discount on help rather than better information.
 *
 * Read by validation and by the posting, so the two can never disagree about
 * what the group is being asked to pay.
 */
function advisoryFeeMinor(state: GameState, listPriceMinor: number): number {
  return assistedCostMinor(listPriceMinor, state.narrative.campaign.inputs);
}

export function isCompanyCommand(
  command: GameCommand,
): command is CompanyCommand {
  return (COMPANY_COMMAND_TYPES as readonly string[]).includes(command.type);
}

export type Verdict = { ok: true } | { ok: false; reason: string };

/** What a company command needs from the simulation to do its work. */
export interface CompanyCommandContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(amountMinor: number, account: string, memo: string): void;
  earn(amountMinor: number, account: string, memo: string): void;
}

const ok: Verdict = { ok: true };
const no = (reason: string): Verdict => ({ ok: false, reason });

/**
 * The rules half. It reads the state it is given and never writes to it, so
 * asking whether a corporate decision is allowed can never be answered by
 * having half-taken it.
 */
export function validateCompanyCommand(
  state: GameState,
  command: CompanyCommand,
): Verdict {
  const c = state.company;
  switch (command.type) {
    case "ASSIGN_BRAND":
      if (!c.portfolio.hotelIds.includes(command.hotelId))
        return no("hotel is not in the portfolio");
      if (!findBrand(c.brands, command.brandId)) return no("unknown brand");
      return ok;
    case "REMOVE_BRAND":
      if (!c.brandAssignments.some((a) => a.hotelId === command.hotelId))
        return no("hotel carries no brand");
      return ok;
    case "SET_OPERATING_MODEL":
      if (!c.portfolio.hotelIds.includes(command.hotelId))
        return no("hotel is not in the portfolio");
      try {
        createOperatingContract(command.model);
      } catch (error) {
        return no((error as Error).message);
      }
      return ok;
    case "SET_HOTEL_BUDGET":
      if (!c.portfolio.hotelIds.includes(command.hotelId))
        return no("hotel is not in the portfolio");
      if (
        !Number.isSafeInteger(command.capexBudgetMinor) ||
        command.capexBudgetMinor < 0 ||
        !Number.isSafeInteger(command.operatingBudgetMinor) ||
        command.operatingBudgetMinor < 0
      )
        return no("a budget must be whole non-negative Pfennig");
      return ok;
    case "SET_GROUP_TARGETS": {
      const { targets } = command;
      if (
        typeof targets.gopparMinor !== "number" ||
        typeof targets.guestSatisfaction !== "number" ||
        typeof targets.staffTurnoverBasisPoints !== "number" ||
        typeof targets.marketShareBasisPoints !== "number" ||
        typeof targets.brandStandard !== "number"
      )
        return no("group targets is missing required fields");
      if (
        Object.values(targets).some(
          (value) => !Number.isSafeInteger(value) || value < 0,
        )
      )
        return no("group targets must be whole non-negative values");
      if (
        targets.staffTurnoverBasisPoints > 10_000 ||
        targets.marketShareBasisPoints > 10_000 ||
        targets.guestSatisfaction > 100 ||
        targets.brandStandard > 100
      )
        return no("group target is out of range");
      return ok;
    }
    case "SET_MANAGER_AUTHORITY":
      if (!managerForHotel(c.managers, command.hotelId))
        return no("no manager runs that hotel");
      return ok;
    case "RESOLVE_ESCALATION": {
      const escalation = c.escalations.find(
        (e) => e.id === command.escalationId,
      );
      if (!escalation) return no("unknown escalation");
      if (escalation.status !== "open")
        return no(`escalation is already ${escalation.status}`);
      return ok;
    }
    case "TRANSFER_INTERNAL_FUNDING": {
      if (c.treasury.hotelCashMinor[command.hotelId] === undefined)
        return no("hotel has no treasury account");
      if (!Number.isSafeInteger(command.amountMinor) || command.amountMinor < 0)
        return no("a transfer must be whole non-negative Pfennig");
      const available =
        command.direction === "fund"
          ? c.treasury.hqMinor
          : c.treasury.hotelCashMinor[command.hotelId];
      if (command.amountMinor > available)
        return no("insufficient allocated cash for the transfer");
      return ok;
    }
    case "START_DEVELOPMENT": {
      if (findDevelopment(c, command.developmentId))
        return no("development already started");
      // The hotel id is derived from the development id, so two schemes with
      // different ids can still collide on the house they would become — and a
      // scheme still under construction has not reached the portfolio yet.
      const plannedHotelId = developmentHotelId(command.developmentId);
      if (
        c.portfolio.hotelIds.includes(plannedHotelId) ||
        c.developments.some((d) => d.hotelId === plannedHotelId)
      )
        return no("the group already holds that hotel");
      if (!Number.isSafeInteger(command.rooms) || command.rooms <= 0)
        return no("a development needs whole rooms");
      let feasibility;
      try {
        feasibility = studyFor(state, command);
      } catch (error) {
        return no((error as Error).message);
      }
      if (
        feasibility.returnOnCostBasisPoints === null ||
        feasibility.returnOnCostBasisPoints < DEVELOPMENT_HURDLE_BP
      )
        return no("the scheme does not clear the group's hurdle rate");
      if (state.finance.cashMinor < command.investmentMinor)
        return no("insufficient cash");
      return ok;
    }
    case "COMPLETE_PRE_OPENING_TASK": {
      const development = findDevelopment(c, command.developmentId);
      if (!development) return no("unknown development");
      if (development.openedDateKey) return no("development is already open");
      if (!OPENING_CHECKLIST.includes(command.item))
        return no("unknown pre-opening checklist item");
      return ok;
    }
    case "OPEN_DEVELOPMENT": {
      const development = findDevelopment(c, command.developmentId);
      if (!development) return no("unknown development");
      try {
        openHotel(development.preOpening, state.calendar.dateKey);
      } catch (error) {
        return no((error as Error).message);
      }
      return ok;
    }
    case "RUN_DUE_DILIGENCE": {
      const target = c.acquisitionTargets.find(
        (t) => t.id === command.targetId,
      );
      if (!target) return no("unknown acquisition target");
      if (target.status !== "available")
        return no(`target is already ${target.status}`);
      if (command.areas.length === 0) return no("no diligence areas requested");
      let report;
      try {
        report = runDueDiligence({ areas: command.areas, findings: [] });
      } catch (error) {
        return no((error as Error).message);
      }
      // The assisted fee, the same one the apply path spends: validating
      // against the list price would accept a diligence the group cannot pay
      // for and then book the shortfall as a payable.
      if (state.finance.cashMinor < advisoryFeeMinor(state, report.costMinor))
        return no("insufficient cash");
      return ok;
    }
    case "ACQUIRE_HOTEL": {
      const target = c.acquisitionTargets.find(
        (t) => t.id === command.targetId,
      );
      if (!target) return no("unknown acquisition target");
      if (target.status !== "available")
        return no(`target is already ${target.status}`);
      if (!Number.isSafeInteger(command.priceMinor) || command.priceMinor < 0)
        return no("an offer must be whole non-negative Pfennig");
      // The seller will not take materially less than the house is worth once
      // the buyer's own findings are priced in.
      const floor = acquisitionFloorMinor(state, command.targetId);
      if (command.priceMinor < floor)
        return no("the offer is below what the seller will accept");
      if (state.finance.cashMinor < command.priceMinor)
        return no("insufficient cash");
      return ok;
    }
    case "TAKE_LOAN": {
      if (
        !Number.isSafeInteger(command.principalMinor) ||
        command.principalMinor <= 0
      )
        return no("requested principal must be a positive safe integer");
      if (
        !Number.isSafeInteger(command.termMonths) ||
        command.termMonths <= 0 ||
        command.termMonths > MAX_LOAN_TERM_MONTHS
      )
        return no(
          `term months must be a positive safe integer up to ${MAX_LOAN_TERM_MONTHS}`,
        );
      if (!["annuity", "linear", "bullet"].includes(command.amortisation))
        return no("invalid amortisation profile");
      if (!["fixed", "variable"].includes(command.rateType))
        return no("invalid rate type");
      if (
        command.collateralValueMinor !== undefined &&
        (!Number.isSafeInteger(command.collateralValueMinor) ||
          command.collateralValueMinor < 0)
      )
        return no("collateral value must be a non-negative safe integer");

      const existingLoans = state.loans ?? (state.loan ? [state.loan] : []);
      const totalOutstanding = existingLoans.reduce(
        (sum, l) => sum + l.principalMinor,
        0,
      );
      const fixedAssetsMinor =
        state.statements?.fixedAssetsMinor ??
        state.assets.reduce((sum, a) => sum + a.replacementMinor, 0);
      const totalPledgedCollateral = existingLoans.reduce(
        (sum, l) => sum + l.collateralValueMinor,
        0,
      );
      const unencumberedCollateralMinor = Math.max(
        0,
        fixedAssetsMinor - totalPledgedCollateral,
      );
      if ((command.collateralValueMinor ?? 0) > unencumberedCollateralMinor)
        return no("declared collateral exceeds unencumbered asset value");

      const totalCollateral =
        totalPledgedCollateral + (command.collateralValueMinor ?? 0);

      const standing = calculateCreditStanding({
        operatingCashFlowMinor:
          state.finance.month.roomRevenueMinor +
          state.finance.month.otherRevenueMinor -
          state.finance.month.operatingExpenseMinor,
        totalOutstandingMinor: totalOutstanding,
        cashMinor: state.finance.cashMinor,
        equityMinor:
          (state.statements?.contributedCapitalMinor ?? 0) +
          (state.statements?.retainedEarningsMinor ?? 0),
        hotelCount: state.company.portfolio.hotelIds.length || 1,
        reputationScore: reputationFor(
          state.reputation,
          "group",
          state.company.companyId,
        ).score,
        totalCollateralValueMinor: totalCollateral,
        paymentHistory: state.finance.paymentHistory,
        macroInterestBp: state.world.macro.interestBp,
        creditSpreadMultiplierBp:
          state.narrative?.campaign?.inputs?.creditSpreadBasisPoints ?? 10_000,
      });

      if (
        totalOutstanding + command.principalMinor >
        standing.borrowingLimitMinor
      )
        return no("requested loan exceeds company borrowing limit");

      return ok;
    }
    case "REPAY_LOAN": {
      const existingLoans = state.loans ?? (state.loan ? [state.loan] : []);
      const targetLoan = existingLoans.find((l) => l.id === command.loanId);
      if (!targetLoan) return no("unknown loan id");
      if (
        !Number.isSafeInteger(command.amountMinor) ||
        command.amountMinor <= 0
      )
        return no("repayment amount must be a positive safe integer");
      if (command.amountMinor > targetLoan.principalMinor)
        return no("repayment amount exceeds loan outstanding principal");
      if (state.finance.cashMinor < command.amountMinor)
        return no("insufficient cash for loan repayment");
      return ok;
    }
  }
}

/**
 * What the seller will take. It is derived from the same valuation the buyer
 * can compute, so a player who did the work can negotiate and one who did not
 * pays the asking price.
 */
export function acquisitionFloorMinor(
  state: GameState,
  targetId: string,
): number {
  const target = state.company.acquisitionTargets.find(
    (t) => t.id === targetId,
  );
  if (!target) throw new Error(`unknown acquisition target ${targetId}`);
  const report = state.company.dueDiligence[targetId];
  const base = valueHotel({
    annualGopMinor: target.annualGopMinor,
    multipleBasisPoints: MARKET_GOP_MULTIPLE_BP,
    renovationNeedMinor: target.renovationNeedMinor,
    debtAssumedMinor: target.debtAssumedMinor,
  });
  // Findings the buyer paid to discover are a lever in the negotiation;
  // findings nobody looked for are not, and travel with the deal instead.
  const adjusted = report ? adjustedValuation(base, report) : base;
  return Math.max(0, adjusted.equityValueMinor);
}

/** The hotel a scheme becomes; derived once, so nothing can disagree on it. */
export function developmentHotelId(developmentId: string): string {
  return `hotel.${developmentId.split(".").slice(1).join(".")}`;
}

function studyFor(
  state: GameState,
  command: Extract<GameCommand, { type: "START_DEVELOPMENT" }>,
) {
  return calculateFeasibility({
    expectedAdrMinor: command.expectedAdrMinor,
    rooms: command.rooms,
    occupancyBasisPoints: command.occupancyBasisPoints,
    uncertaintyBasisPoints: volatilityScaledUncertaintyBp(
      FEASIBILITY_UNCERTAINTY_BP,
      state.narrative.campaign.sandbox,
    ),
    investmentMinor: command.investmentMinor,
    gopMarginBasisPoints: UNDERWRITING_GOP_MARGIN_BP,
  });
}

/**
 * The write half. It runs against the command handler's private draft, so
 * throwing anywhere in here discards every change the command had made — which
 * is what makes an acquisition atomic rather than merely careful.
 */
export function applyCompanyCommand(
  state: GameState,
  command: CompanyCommand,
  ctx: CompanyCommandContext,
): void {
  const verdict = validateCompanyCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);
  const c = state.company;

  switch (command.type) {
    case "ASSIGN_BRAND": {
      c.brandAssignments = assignBrand(c.brandAssignments, {
        hotelId: command.hotelId,
        brandId: command.brandId,
        sinceDateKey: state.calendar.dateKey,
      });
      ctx.emit(
        {
          type: "HOTEL_REBRANDED",
          hotelId: command.hotelId,
          brandId: command.brandId,
        },
        [command.hotelId, command.brandId],
      );
      return;
    }
    case "REMOVE_BRAND": {
      c.brandAssignments = removeBrandAssignment(
        c.brandAssignments,
        command.hotelId,
      );
      ctx.emit(
        { type: "HOTEL_REBRANDED", hotelId: command.hotelId, brandId: null },
        [command.hotelId],
      );
      return;
    }
    case "SET_OPERATING_MODEL": {
      c.operatingModels[command.hotelId] = createOperatingContract(
        command.model,
      );
      ctx.emit(
        {
          type: "OPERATING_MODEL_CHANGED",
          hotelId: command.hotelId,
          model: command.model.kind,
        },
        [command.hotelId],
      );
      return;
    }
    case "SET_HOTEL_BUDGET": {
      const periodKey = state.calendar.dateKey.slice(0, 7);
      const budget = createHotelBudget({
        hotelId: command.hotelId,
        periodKey,
        capexBudgetMinor: command.capexBudgetMinor,
        operatingBudgetMinor: command.operatingBudgetMinor,
      });
      c.budgets = [
        ...c.budgets.filter((b) => b.hotelId !== command.hotelId),
        budget,
      ];
      ctx.emit(
        {
          type: "HOTEL_BUDGET_SET",
          hotelId: command.hotelId,
          periodKey,
          capexBudgetMinor: command.capexBudgetMinor,
        },
        [command.hotelId],
      );
      return;
    }
    case "SET_GROUP_TARGETS":
      c.groupTargets = { ...command.targets };
      ctx.emit({ type: "GROUP_TARGETS_SET", companyId: c.companyId }, [
        c.companyId,
      ]);
      return;
    case "SET_MANAGER_AUTHORITY": {
      const manager = managerForHotel(c.managers, command.hotelId)!;
      const updated = setAuthorityLimit(manager, command.authority);
      c.managers = c.managers.map((m) => (m.id === manager.id ? updated : m));
      ctx.emit(
        {
          type: "MANAGER_AUTHORITY_CHANGED",
          hotelId: command.hotelId,
          managerId: manager.id,
        },
        [command.hotelId, manager.id],
      );
      return;
    }
    case "RESOLVE_ESCALATION": {
      const escalation = c.escalations.find(
        (e) => e.id === command.escalationId,
      )!;
      c.escalations = resolveEscalation(
        c.escalations,
        command.escalationId,
        command.approve ? "approved" : "rejected",
        state.elapsedMinutes,
      );
      // An approved spend is money the group has now agreed to; a rejected one
      // costs nothing, which is the whole point of the limit.
      if (command.approve && "amountMinor" in escalation.decision)
        ctx.spend(
          escalation.decision.amountMinor,
          escalation.decision.kind === "capex" ? "capex" : "maintenance",
          `approved ${escalation.decision.kind} at ${escalation.hotelId}`,
        );
      if (command.approve) {
        const d = escalation.decision;
        if ("departmentId" in d) {
          const deptId = d.departmentId;
          const currentAuth = state.departmentHeadAuthorities?.[deptId] ?? createDepartmentHeadAuthority();
          if (d.kind === "overtime-cap") {
            state.departmentHeadAuthorities[deptId] = createDepartmentHeadAuthority({
              ...currentAuth,
              overtimeCapHours: d.overtimeHours + 10,
            });
          } else if (d.kind === "staffing-reserve") {
            state.departmentHeadAuthorities[deptId] = createDepartmentHeadAuthority({
              ...currentAuth,
              staffingReserveCount: d.availableCount,
            });
          } else if (d.kind === "staffing-budget") {
            state.departmentHeadAuthorities[deptId] = createDepartmentHeadAuthority({
              ...currentAuth,
              staffingBudgetMinor: d.actualMinor + 10_000_00,
            });
          } else if (d.kind === "service-level") {
            state.departmentHeadAuthorities[deptId] = createDepartmentHeadAuthority({
              ...currentAuth,
              minServiceLevelBasisPoints: d.actualBp,
            });
          }
        }
      }
      ctx.emit(
        {
          type: "ESCALATION_RESOLVED",
          escalationId: command.escalationId,
          hotelId: escalation.hotelId,
          approved: command.approve,
        },
        [escalation.hotelId, command.escalationId],
      );
      return;
    }
    case "TRANSFER_INTERNAL_FUNDING": {
      c.treasury =
        command.direction === "fund"
          ? fundHotel(c.treasury, command.hotelId, command.amountMinor)
          : sweepToHeadquarters(
              c.treasury,
              command.hotelId,
              command.amountMinor,
            );
      ctx.emit(
        {
          type: "INTERNAL_FUNDING_TRANSFERRED",
          hotelId: command.hotelId,
          amountMinor: command.amountMinor,
          direction: command.direction,
        },
        [command.hotelId],
      );
      return;
    }
    case "START_DEVELOPMENT": {
      const hotelId = developmentHotelId(command.developmentId);
      ctx.spend(command.investmentMinor, "capex", command.name);
      c.developments = [
        ...c.developments,
        {
          id: command.developmentId,
          hotelId,
          name: command.name,
          cityId: command.cityId,
          rooms: command.rooms,
          occupancyBasisPoints: command.occupancyBasisPoints,
          investmentMinor: command.investmentMinor,
          feasibility: studyFor(state, command),
          preOpening: createPreOpening(
            command.developmentId,
            command.targetOpenDateKey,
          ),
          openedDateKey: null,
        },
      ];
      ctx.emit(
        {
          type: "DEVELOPMENT_STARTED",
          developmentId: command.developmentId,
          rooms: command.rooms,
          investmentMinor: command.investmentMinor,
        },
        [command.developmentId, hotelId],
      );
      return;
    }
    case "COMPLETE_PRE_OPENING_TASK": {
      c.developments = c.developments.map((development) =>
        development.id === command.developmentId
          ? {
              ...development,
              preOpening: markPreOpeningTask(
                development.preOpening,
                command.item,
              ),
            }
          : development,
      );
      ctx.emit(
        {
          type: "PRE_OPENING_TASK_COMPLETED",
          developmentId: command.developmentId,
          item: command.item,
        },
        [command.developmentId],
      );
      return;
    }
    case "OPEN_DEVELOPMENT": {
      const development = findDevelopment(c, command.developmentId)!;
      const preOpening = openHotel(
        development.preOpening,
        state.calendar.dateKey,
      );
      c.developments = c.developments.map((d) =>
        d.id === command.developmentId
          ? { ...d, preOpening, openedDateKey: state.calendar.dateKey }
          : d,
      );
      admitHotel(state, ctx, {
        hotelId: development.hotelId,
        name: development.name,
        cityId: development.cityId,
        rooms: development.rooms,
        // A new house is underwritten at the rate and occupancy its own
        // feasibility study assumed, and then has to earn its ramp-up.
        adrMinor: Math.trunc(
          development.feasibility.baseAnnualRoomRevenueMinor /
            Math.max(1, development.rooms * 365),
        ),
        occupancyBasisPoints: development.occupancyBasisPoints,
        gopMarginBasisPoints: UNDERWRITING_GOP_MARGIN_BP,
        openedDateKey: state.calendar.dateKey,
      });
      ctx.emit(
        {
          type: "HOTEL_OPENED",
          developmentId: command.developmentId,
          hotelId: development.hotelId,
          rooms: development.rooms,
        },
        [command.developmentId, development.hotelId],
      );
      return;
    }
    case "RUN_DUE_DILIGENCE": {
      const target = c.acquisitionTargets.find(
        (t) => t.id === command.targetId,
      )!;
      const report = runDueDiligence({
        areas: command.areas,
        findings: target.hiddenFindings,
      });
      const feeMinor = advisoryFeeMinor(state, report.costMinor);
      ctx.spend(feeMinor, "advisory", `diligence on ${target.name}`);
      c.dueDiligence = { ...c.dueDiligence, [command.targetId]: report };
      ctx.emit(
        {
          type: "DUE_DILIGENCE_COMPLETED",
          targetId: command.targetId,
          areas: report.areas,
          costMinor: feeMinor,
        },
        [command.targetId],
      );
      return;
    }
    case "ACQUIRE_HOTEL": {
      const target = c.acquisitionTargets.find(
        (t) => t.id === command.targetId,
      )!;
      // One transaction: cash and ownership move together, and any throw from
      // here on discards the whole draft the command was writing into.
      const moved = executeAcquisition(
        {
          cashMinor: state.finance.cashMinor,
          hotelIds: [...c.portfolio.hotelIds],
        },
        { hotelId: target.hotelId, priceMinor: command.priceMinor },
      );
      ctx.spend(
        acquisitionCostMinor({
          priceMinor: command.priceMinor,
          debtRepaidMinor: 0,
          diligenceCostMinor: 0,
        }),
        "capex",
        `acquisition of ${target.name}`,
      );
      c.acquisitionTargets = markTargetStatus(
        c.acquisitionTargets,
        command.targetId,
        "acquired",
      );
      admitHotel(state, ctx, {
        hotelId: target.hotelId,
        name: target.name,
        cityId: FLAGSHIP_CITY_ID,
        rooms: target.rooms,
        adrMinor: Math.max(
          1,
          Math.trunc(target.annualGopMinor / Math.max(1, target.rooms * 200)),
        ),
        occupancyBasisPoints: 6500,
        gopMarginBasisPoints: UNDERWRITING_GOP_MARGIN_BP,
        // A trading house joins mature: it already has its market, which is
        // most of what the buyer is paying for.
        openedDateKey: addDays(state.calendar.dateKey, -365 * 4),
      });
      // The transaction's own arithmetic is the authority on what is owned.
      if (!moved.hotelIds.includes(target.hotelId))
        throw new Error("acquisition did not complete");
      ctx.emit(
        {
          type: "HOTEL_ACQUIRED",
          targetId: command.targetId,
          hotelId: target.hotelId,
          priceMinor: command.priceMinor,
        },
        [command.targetId, target.hotelId],
      );
      return;
    }
    case "TAKE_LOAN": {
      const existingLoans = state.loans ?? (state.loan ? [state.loan] : []);
      const totalOutstanding = existingLoans.reduce(
        (sum, l) => sum + l.principalMinor,
        0,
      );
      const totalCollateral =
        existingLoans.reduce((sum, l) => sum + l.collateralValueMinor, 0) +
        (command.collateralValueMinor ?? 0);

      const standing = calculateCreditStanding({
        operatingCashFlowMinor:
          state.finance.month.roomRevenueMinor +
          state.finance.month.otherRevenueMinor -
          state.finance.month.operatingExpenseMinor,
        totalOutstandingMinor: totalOutstanding,
        cashMinor: state.finance.cashMinor,
        equityMinor:
          (state.statements?.contributedCapitalMinor ?? 0) +
          (state.statements?.retainedEarningsMinor ?? 0),
        hotelCount: state.company.portfolio.hotelIds.length || 1,
        reputationScore: reputationFor(
          state.reputation,
          "group",
          state.company.companyId,
        ).score,
        totalCollateralValueMinor: totalCollateral,
        paymentHistory: state.finance.paymentHistory,
        macroInterestBp: state.world.macro.interestBp,
        creditSpreadMultiplierBp:
          state.narrative?.campaign?.inputs?.creditSpreadBasisPoints ?? 10_000,
      });

      const offeredRate = standing.offeredRateBp;
      const spreadBasisPoints = standing.spreadBp;
      const loanId = `loan.${state.commandSequence}.${existingLoans.length + 1}`;

      const newLoan = drawLoan(
        command.principalMinor,
        offeredRate,
        command.termMonths,
        {
          id: loanId,
          amortisation: command.amortisation,
          rateType: command.rateType,
          spreadBasisPoints:
            command.rateType === "variable" ? spreadBasisPoints : 0,
          startMonthIndex:
            (Number(state.calendar.dateKey.slice(0, 4)) - 1991) * 12 +
            (Number(state.calendar.dateKey.slice(5, 7)) - 1),
          collateralValueMinor: command.collateralValueMinor ?? 0,
        },
      );

      if (state.loans) {
        state.loans.push(newLoan);
      } else {
        state.loan = newLoan;
      }

      ctx.earn(command.principalMinor, "loan", `drawn loan ${loanId}`);
      ctx.emit(
        {
          type: "LOAN_TAKEN",
          loanId,
          principalMinor: command.principalMinor,
          annualRateBasisPoints: offeredRate,
          amortisation: command.amortisation,
          rateType: command.rateType,
        },
        [loanId],
      );
      return;
    }
    case "REPAY_LOAN": {
      const existingLoans = state.loans ?? (state.loan ? [state.loan] : []);
      const targetLoan = existingLoans.find((l) => l.id === command.loanId);
      if (!targetLoan) throw new Error("unknown loan id");

      const updatedLoan = repayLoan(targetLoan, command.amountMinor);
      if (state.loans) {
        if (updatedLoan.principalMinor === 0) {
          state.loans = state.loans.filter((l) => l.id !== command.loanId);
        } else {
          state.loans = state.loans.map((l) =>
            l.id === command.loanId ? updatedLoan : l,
          );
        }
      } else {
        state.loan = updatedLoan;
      }

      ctx.spend(command.amountMinor, "loan", `repaid loan ${command.loanId}`);
      ctx.emit(
        {
          type: "LOAN_REPAID",
          loanId: command.loanId,
          amountMinor: command.amountMinor,
          remainingPrincipalMinor: updatedLoan.principalMinor,
        },
        [command.loanId],
      );
      return;
    }
  }
}

/**
 * Brings a house into the group: portfolio, entity, treasury account, manager
 * and operating model, all in the same step. A hotel that exists in one of
 * those lists and not the others is a bug waiting to be found by the player.
 */
function admitHotel(
  state: GameState,
  ctx: CompanyCommandContext,
  hotel: {
    hotelId: string;
    name: string;
    cityId: string;
    rooms: number;
    adrMinor: number;
    occupancyBasisPoints: number;
    gopMarginBasisPoints: number;
    openedDateKey: string;
  },
): void {
  const c = state.company;
  c.portfolio = addHotelToPortfolio(c.portfolio, {
    hotelId: hotel.hotelId,
    legalEntityId: STARTER_LEGAL_ENTITY.id,
    regionId: STARTER_REGION,
  });
  c.managedHotels = registerManagedHotel(
    c.managedHotels,
    createManagedHotel({
      hotelId: hotel.hotelId,
      name: hotel.name,
      cityId: hotel.cityId,
      rooms: hotel.rooms,
      adrMinor: hotel.adrMinor,
      occupancyBasisPoints: hotel.occupancyBasisPoints,
      gopMarginBasisPoints: hotel.gopMarginBasisPoints,
      openedDateKey: hotel.openedDateKey,
    }),
  );
  c.operatingModels[hotel.hotelId] = { kind: "owned" };
  c.treasury = openHotelAccount(c.treasury, hotel.hotelId, 0);
  c.sequence += 1;
  c.managers = [
    ...c.managers,
    {
      id: `manager.${hotel.hotelId}`,
      name: `Manager, ${hotel.name}`,
      hotelId: hotel.hotelId,
      competence: 55,
      authority: {
        repairLimitMinor: 500_000,
        capexLimitMinor: 0,
        recoveryLimitMinor: 20_000,
        mayHire: false,
        mayReprice: true,
      },
    },
  ];
  ctx.emit(
    {
      type: "HOTEL_ADDED_TO_PORTFOLIO",
      hotelId: hotel.hotelId,
      legalEntityId: STARTER_LEGAL_ENTITY.id,
    },
    [hotel.hotelId, STARTER_LEGAL_ENTITY.id],
  );
}
