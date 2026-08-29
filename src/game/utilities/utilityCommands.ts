import type { GameState } from "../simulation/initialState";
import type { GameCommand } from "../commands/commandEnvelope";
import type { DomainEventPayload } from "../domain/events";
import {
  efficiencyInvestmentCostMinor,
  MAX_EFFICIENCY_BP,
  signUtilityContract,
  type EfficiencyProject,
  UTILITY_KINDS,
} from "./consumption";

const UTILITY_COMMAND_TYPES = [
  "SIGN_UTILITY_CONTRACT",
  "INVEST_IN_EFFICIENCY",
] as const;

export type UtilityCommand = Extract<
  GameCommand,
  { type: (typeof UTILITY_COMMAND_TYPES)[number] }
>;

export function isUtilityCommand(
  command: GameCommand,
): command is UtilityCommand {
  return (UTILITY_COMMAND_TYPES as readonly string[]).includes(command.type);
}

export type Verdict = { ok: true } | { ok: false; reason: string };

export interface UtilityCommandContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(
    amountMinor: number,
    category: "capex" | "operating" | "payroll" | "tax" | "financing",
    memo: string,
  ): void;
  energyPriceIndexBp(): number;
}

const ok: Verdict = { ok: true };
const no = (reason: string): Verdict => ({ ok: false, reason });

export function validateUtilityCommand(
  state: GameState,
  command: UtilityCommand,
): Verdict {
  switch (command.type) {
    case "SIGN_UTILITY_CONTRACT": {
      if (!(UTILITY_KINDS as readonly string[]).includes(command.kind))
        return no("unknown utility kind");
      if (!command.supplierId || typeof command.supplierId !== "string")
        return no("supplier id is required");
      if (command.priceLock !== "fixed" && command.priceLock !== "floating")
        return no("invalid price lock type");
      if (
        !Number.isSafeInteger(command.standingChargeMinor) ||
        command.standingChargeMinor < 0
      )
        return no("standing charge must be a whole non-negative amount");
      if (
        !Number.isSafeInteger(command.unitPriceMinor) ||
        command.unitPriceMinor < 0
      )
        return no("unit price must be a whole non-negative amount");
      if (command.validToDateKey <= command.validFromDateKey)
        return no("a contract must end after it starts");

      const existing = state.utilityContracts[command.kind];
      const dateKey = state.calendar.dateKey;
      const isMunicipalDefault =
        existing &&
        existing.supplierId === `supplier.utility.municipal.${command.kind}`;

      if (
        existing &&
        !isMunicipalDefault &&
        existing.validFromDateKey <= dateKey &&
        dateKey < existing.validToDateKey &&
        command.validFromDateKey < existing.validToDateKey &&
        existing.validFromDateKey < command.validToDateKey
      )
        return no("contract overlaps an active contract for this utility");

      return ok;
    }
    case "INVEST_IN_EFFICIENCY": {
      if (!(UTILITY_KINDS as readonly string[]).includes(command.kind))
        return no("unknown utility kind");
      if (
        !Number.isSafeInteger(command.savingBasisPoints) ||
        command.savingBasisPoints <= 0 ||
        command.savingBasisPoints > MAX_EFFICIENCY_BP
      )
        return no("invalid efficiency saving basis points");

      if (
        state.efficiencyProjects.some(
          (p) => p.kind === command.kind && p.status !== "complete",
        )
      )
        return no("an efficiency project is already in progress for this utility");

      const cost = efficiencyInvestmentCostMinor(command.savingBasisPoints);
      if (state.finance.cashMinor < cost) return no("insufficient cash");

      return ok;
    }
  }
}

export function applyUtilityCommand(
  state: GameState,
  command: UtilityCommand,
  ctx: UtilityCommandContext,
): void {
  const verdict = validateUtilityCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);

  switch (command.type) {
    case "SIGN_UTILITY_CONTRACT": {
      state.utilityContracts = signUtilityContract(state.utilityContracts, {
        kind: command.kind,
        supplierId: command.supplierId,
        standingChargeMinor: command.standingChargeMinor,
        unitPriceMinor: command.unitPriceMinor,
        validFromDateKey: command.validFromDateKey,
        validToDateKey: command.validToDateKey,
        priceLock: command.priceLock,
      });

      ctx.emit(
        {
          type: "UTILITY_CONTRACT_SIGNED",
          kind: command.kind,
          supplierId: command.supplierId,
          standingChargeMinor: command.standingChargeMinor,
          unitPriceMinor: command.unitPriceMinor,
          priceLock: command.priceLock,
        },
        [`utility-contract.${command.kind}`, command.supplierId],
      );
      return;
    }
    case "INVEST_IN_EFFICIENCY": {
      const cost = efficiencyInvestmentCostMinor(command.savingBasisPoints);
      ctx.spend(cost, "capex", `efficiency project for ${command.kind}`);

      const project: EfficiencyProject = {
        id: `project.efficiency.${command.kind}.${state.elapsedMinutes}`,
        kind: command.kind,
        savingBasisPoints: command.savingBasisPoints,
        status: "planned",
        remainingMonths: 3,
        costMinor: cost,
      };

      state.efficiencyProjects.push(project);

      ctx.emit(
        {
          type: "EFFICIENCY_INVESTMENT_STARTED",
          projectId: project.id,
          kind: command.kind,
          savingBasisPoints: command.savingBasisPoints,
          costMinor: cost,
        },
        [`utility-contract.${command.kind}`, project.id],
      );
      return;
    }
  }
}
