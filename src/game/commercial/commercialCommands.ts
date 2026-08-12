import type { GameCommand } from "../commands/commandEnvelope";
import type { DomainEventPayload } from "../domain/events";
import type { GameState } from "../simulation/initialState";
import {
  channelAvailable,
  createCampaign,
  registerCampaign,
} from "./campaigns";
import {
  addLead,
  advanceLead,
  setRenewalIntent,
  signContract,
} from "./salesPipeline";

export const COMMERCIAL_COMMAND_TYPES = [
  "LAUNCH_CAMPAIGN",
  "ADD_LEAD",
  "ADVANCE_LEAD",
  "SIGN_ACCOUNT",
  "SET_RENEWAL_INTENT",
  "CONFIGURE_LOYALTY",
  "OFFER_CORPORATE_ACCOUNT",
  "ACCEPT_CORPORATE_ACCOUNT",
  "RENEW_CORPORATE_ACCOUNT",
] as const;

export type CommercialCommand = Extract<
  GameCommand,
  { type: (typeof COMMERCIAL_COMMAND_TYPES)[number] }
>;

export function isCommercialCommand(
  command: GameCommand,
): command is CommercialCommand {
  return (COMMERCIAL_COMMAND_TYPES as readonly string[]).includes(command.type);
}

export interface CommercialCommandContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(amountMinor: number, account: string, memo: string): void;
  earn(amountMinor: number, account: string, memo: string): void;
}

function campaignFor(
  state: GameState,
  command: Extract<CommercialCommand, { type: "LAUNCH_CAMPAIGN" }>,
) {
  return createCampaign({
    id: `campaign.${state.commandSequence}`,
    objective: command.objective,
    targetSegmentId: command.targetSegmentId,
    region: command.region,
    channel: command.channel,
    startDateKey: state.calendar.dateKey,
    durationDays: command.durationDays,
    budgetMinor: command.budgetMinor,
    message: command.message,
    creativeQuality: command.creativeQuality,
  });
}

export function validateCommercialCommand(
  state: GameState,
  command: CommercialCommand,
): { ok: true } | { ok: false; reason: string } {
  try {
    switch (command.type) {
      case "LAUNCH_CAMPAIGN": {
        const campaign = campaignFor(state, command);
        const adoption = Object.fromEntries(
          state.world.technologies.map((technology) => [
            technology.id,
            technology.adoptionBp,
          ]),
        );
        if (!channelAvailable(campaign.channel, adoption))
          throw new Error("campaign channel is not available");
        registerCampaign(state.commercial.campaigns, campaign);
        break;
      }
      case "ADD_LEAD":
        addLead(state.commercial.sales, {
          id: command.leadId,
          accountName: command.accountName,
          segmentId: command.segmentId,
          expectedRoomNights: command.expectedRoomNights,
          stage: "lead",
        });
        break;
      case "ADVANCE_LEAD":
        advanceLead(state.commercial.sales, command.leadId, command.stage);
        break;
      case "SIGN_ACCOUNT": {
        const lead = state.commercial.sales.leads.find(
          (candidate) => candidate.id === command.leadId,
        );
        if (!lead) throw new Error(`unknown lead ${command.leadId}`);
        signContract(state.commercial.sales, {
          id: `contract.${command.leadId}`,
          accountName: lead.accountName,
          segmentId: lead.segmentId,
          negotiatedRateMinor: command.negotiatedRateMinor,
          expectedRoomNights: command.expectedRoomNights,
          concessions: [...command.concessions],
          validFromDateKey: command.validFromDateKey,
          validToDateKey: command.validToDateKey,
          renewalIntent: "unknown",
        });
        break;
      }
      case "SET_RENEWAL_INTENT":
        if (!["unknown", "renewing", "leaving"].includes(command.intent))
          throw new Error("invalid renewal intent");
        setRenewalIntent(
          state.commercial.sales,
          command.contractId,
          command.intent,
        );
        break;
      case "CONFIGURE_LOYALTY":
        if (typeof command.active !== "boolean")
          throw new Error("loyalty active must be boolean");
        if (state.commercial.loyalty.active === command.active)
          throw new Error("loyalty scheme is already configured that way");
        break;
      case "OFFER_CORPORATE_ACCOUNT":
        addLead(state.commercial.sales, {
          id: command.leadId,
          accountName: command.accountName,
          segmentId: command.segmentId,
          expectedRoomNights: command.expectedRoomNights,
          stage: "lead",
        });
        break;
      case "RENEW_CORPORATE_ACCOUNT":
        advanceLead(state.commercial.sales, command.leadId, command.stage);
        break;
      case "ACCEPT_CORPORATE_ACCOUNT": {
        const lead = state.commercial.sales.leads.find(
          (item) => item.id === command.leadId,
        );
        if (!lead) throw new Error(`unknown lead ${command.leadId}`);
        signContract(state.commercial.sales, {
          id: command.contractId,
          accountName: lead.accountName,
          segmentId: lead.segmentId,
          negotiatedRateMinor: command.negotiatedRateMinor,
          expectedRoomNights: command.expectedRoomNights,
          concessions: command.concessions,
          validFromDateKey: command.validFromDateKey,
          validToDateKey: command.validToDateKey,
          blackoutDateKeys: command.blackoutDateKeys,
          paymentTermsDays: command.paymentTermsDays,
          cancellationDaysBeforeArrival: command.cancellationDaysBeforeArrival,
          cancellationFeeBasisPoints: command.cancellationFeeBasisPoints,
          renewalIntent: "unknown",
        });
        break;
      }
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}

export function applyCommercialCommand(
  state: GameState,
  command: CommercialCommand,
  ctx: CommercialCommandContext,
): void {
  const verdict = validateCommercialCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);
  switch (command.type) {
    case "LAUNCH_CAMPAIGN": {
      const campaign = campaignFor(state, command);
      ctx.spend(campaign.budgetMinor, "campaignSpend", campaign.id);
      state.commercial.campaigns = registerCampaign(
        state.commercial.campaigns,
        campaign,
      );
      state.commercial.campaignAgeDays = {
        ...state.commercial.campaignAgeDays,
        [campaign.id]: 0,
      };
      ctx.emit(
        {
          type: "CAMPAIGN_LAUNCHED",
          campaignId: campaign.id,
          budgetMinor: campaign.budgetMinor,
        },
        [campaign.id],
      );
      return;
    }
    case "ADD_LEAD":
      state.commercial.sales = addLead(state.commercial.sales, {
        id: command.leadId,
        accountName: command.accountName,
        segmentId: command.segmentId,
        expectedRoomNights: command.expectedRoomNights,
        stage: "lead",
      });
      ctx.emit({ type: "SALES_LEAD_ADDED", leadId: command.leadId }, [
        command.leadId,
      ]);
      return;
    case "ADVANCE_LEAD":
      state.commercial.sales = advanceLead(
        state.commercial.sales,
        command.leadId,
        command.stage,
      );
      ctx.emit(
        {
          type: "SALES_LEAD_ADVANCED",
          leadId: command.leadId,
          stage: command.stage,
        },
        [command.leadId],
      );
      return;
    case "SIGN_ACCOUNT": {
      const lead = state.commercial.sales.leads.find(
        (candidate) => candidate.id === command.leadId,
      )!;
      const contractId = `contract.${command.leadId}`;
      state.commercial.sales = signContract(state.commercial.sales, {
        id: contractId,
        accountName: lead.accountName,
        segmentId: lead.segmentId,
        negotiatedRateMinor: command.negotiatedRateMinor,
        expectedRoomNights: command.expectedRoomNights,
        concessions: [...command.concessions],
        validFromDateKey: command.validFromDateKey,
        validToDateKey: command.validToDateKey,
        renewalIntent: "unknown",
      });
      state.commercial.sales = advanceLead(
        state.commercial.sales,
        command.leadId,
        "won",
      );
      ctx.emit(
        { type: "CONTRACT_SIGNED", contractId, leadId: command.leadId },
        [contractId, command.leadId],
      );
      return;
    }
    case "SET_RENEWAL_INTENT":
      state.commercial.sales = setRenewalIntent(
        state.commercial.sales,
        command.contractId,
        command.intent,
      );
      ctx.emit(
        {
          type: "CONTRACT_RENEWAL_SET",
          contractId: command.contractId,
          intent: command.intent,
        },
        [command.contractId],
      );
      return;
    case "CONFIGURE_LOYALTY":
      state.commercial.loyalty = {
        ...state.commercial.loyalty,
        active: command.active,
      };
      ctx.emit({ type: "LOYALTY_CONFIGURED", active: command.active }, [
        state.hotel.id,
      ]);
      return;
    case "OFFER_CORPORATE_ACCOUNT":
      state.commercial.sales = addLead(state.commercial.sales, {
        id: command.leadId,
        accountName: command.accountName,
        segmentId: command.segmentId,
        expectedRoomNights: command.expectedRoomNights,
        stage: "lead",
      });
      ctx.emit({ type: "CORPORATE_ACCOUNT_OFFERED", leadId: command.leadId }, [
        command.leadId,
      ]);
      return;
    case "RENEW_CORPORATE_ACCOUNT":
      state.commercial.sales = advanceLead(
        state.commercial.sales,
        command.leadId,
        command.stage,
      );
      ctx.emit({ type: "CORPORATE_ACCOUNT_RENEWED", leadId: command.leadId }, [
        command.leadId,
      ]);
      return;
    case "ACCEPT_CORPORATE_ACCOUNT": {
      const lead = state.commercial.sales.leads.find(
        (item) => item.id === command.leadId,
      )!;
      state.commercial.sales = signContract(state.commercial.sales, {
        id: command.contractId,
        accountName: lead.accountName,
        segmentId: lead.segmentId,
        negotiatedRateMinor: command.negotiatedRateMinor,
        expectedRoomNights: command.expectedRoomNights,
        concessions: command.concessions,
        validFromDateKey: command.validFromDateKey,
        validToDateKey: command.validToDateKey,
        blackoutDateKeys: command.blackoutDateKeys,
        paymentTermsDays: command.paymentTermsDays,
        cancellationDaysBeforeArrival: command.cancellationDaysBeforeArrival,
        cancellationFeeBasisPoints: command.cancellationFeeBasisPoints,
        renewalIntent: "unknown",
      });
      ctx.emit(
        { type: "CORPORATE_ACCOUNT_SIGNED", contractId: command.contractId },
        [command.contractId, command.leadId],
      );
      return;
    }
  }
}
