import type { GameCommand } from "../commands/commandEnvelope";
import type { GameState } from "../simulation/initialState";
import type { DomainEventPayload } from "../domain/events";
import { isRoomCategory } from "../revenue/rates";
import { acceptAllotment, CHANNELS } from "./channelEvolution";
import type { DistributionState } from "./distributionState";

const TYPES = [
  "ACCEPT_GROUP_CONTRACT",
  "DECLINE_GROUP_CONTRACT",
  "ACCEPT_ALLOTMENT",
  "SET_CHANNEL_INVENTORY",
  "CLOSE_CHANNEL",
] as const;
export type DistributionCommand = Extract<
  GameCommand,
  { type: (typeof TYPES)[number] }
>;
export function isDistributionCommand(
  command: GameCommand,
): command is DistributionCommand {
  return (TYPES as readonly string[]).includes(command.type);
}
type Verdict = { ok: true } | { ok: false; reason: string };
export interface DistributionCommandContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(amountMinor: number, account: string, memo: string): void;
  earn(amountMinor: number, account: string, memo: string): void;
}

function validateRooms(
  state: GameState,
  roomsByDate: Record<string, number>,
  category: string,
): void {
  const total = state.hotel.rooms.filter(
    (room) => room.category === category,
  ).length;
  for (const [date, rooms] of Object.entries(roomsByDate)) {
    if (!date || !Number.isSafeInteger(rooms) || rooms <= 0)
      throw new Error("held rooms must be positive whole rooms");
    const held = [
      ...state.distribution.allotments,
      ...state.distribution.groupBlocks,
    ].reduce(
      (sum, item) =>
        sum + (item.category === category ? (item.roomsByDate[date] ?? 0) : 0),
      0,
    );
    if (!acceptAllotment(total, held, rooms))
      throw new Error(`allotment exceeds capacity on ${date}`);
  }
}
export function validateDistributionCommand(
  state: GameState,
  command: DistributionCommand,
): Verdict {
  try {
    switch (command.type) {
      case "ACCEPT_GROUP_CONTRACT":
        validateRooms(state, command.roomsByDate, command.category);
        if (
          !Number.isSafeInteger(command.groupRateMinor) ||
          command.groupRateMinor < 0
        )
          throw new Error("group rate must be non-negative");
        if (
          !Number.isSafeInteger(command.depositMinor) ||
          command.depositMinor < 0
        )
          throw new Error("deposit must be non-negative");
        if (
          !Number.isSafeInteger(command.cancellationDaysBeforeArrival) ||
          command.cancellationDaysBeforeArrival < 0
        )
          throw new Error("cancellation days must be non-negative");
        if (
          !Number.isSafeInteger(command.cancellationFeeBasisPoints) ||
          command.cancellationFeeBasisPoints < 0 ||
          command.cancellationFeeBasisPoints > 10_000
        )
          throw new Error("cancellation fee must be 0-10000 basis points");
        if (
          !Number.isSafeInteger(command.paymentTermsDays) ||
          command.paymentTermsDays < 0
        )
          throw new Error("payment terms must be non-negative");
        if (
          state.distribution.groupBlocks.some((b) => b.id === command.blockId)
        )
          throw new Error("group block already exists");
        break;
      case "DECLINE_GROUP_CONTRACT":
        if (
          state.distribution.groupBlocks.some((b) => b.id === command.blockId)
        )
          throw new Error("group block already decided");
        break;
      case "ACCEPT_ALLOTMENT":
        validateRooms(state, command.roomsByDate, command.category);
        if (
          state.distribution.allotments.some(
            (a) => a.id === command.allotmentId,
          )
        )
          throw new Error("allotment already exists");
        break;
      case "SET_CHANNEL_INVENTORY":
        if (!CHANNELS.some((c) => c.id === command.channelId))
          throw new Error("unknown channel");
        if (
          !command.allowedCategories.length ||
          !command.allowedRatePlanIds.length
        )
          throw new Error("channel inventory needs categories and rate plans");
        if (!command.allowedCategories.every(isRoomCategory))
          throw new Error("channel inventory must use valid room categories");
        if (
          !command.allowedRatePlanIds.every(
            (id) => typeof id === "string" && id.length > 0,
          )
        )
          throw new Error("channel inventory must use valid rate plan ids");
        break;
      case "CLOSE_CHANNEL":
        if (!CHANNELS.some((c) => c.id === command.channelId))
          throw new Error("unknown channel");
        break;
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}
export function applyDistributionCommand(
  state: GameState,
  command: DistributionCommand,
  ctx: DistributionCommandContext,
): void {
  const verdict = validateDistributionCommand(state, command);
  if (!verdict.ok) throw new Error(verdict.reason);
  const d: DistributionState = state.distribution;
  switch (command.type) {
    case "ACCEPT_GROUP_CONTRACT":
      d.groupBlocks = [
        ...d.groupBlocks,
        {
          id: command.blockId,
          category: command.category,
          roomsByDate: { ...command.roomsByDate },
          groupRateMinor: command.groupRateMinor,
          releaseDateKey: command.releaseDateKey,
          depositMinor: command.depositMinor,
          cancellationDaysBeforeArrival: command.cancellationDaysBeforeArrival,
          cancellationFeeBasisPoints: command.cancellationFeeBasisPoints,
          paymentTermsDays: command.paymentTermsDays,
          status: "confirmed" as const,
        },
      ].sort((a, b) => (a.id < b.id ? -1 : 1));
      ctx.earn(command.depositMinor, "groupDeposit", command.blockId);
      ctx.emit({ type: "GROUP_CONTRACT_ACCEPTED", blockId: command.blockId }, [
        command.blockId,
      ]);
      return;
    case "DECLINE_GROUP_CONTRACT":
      d.groupBlocks = [
        ...d.groupBlocks,
        {
          id: command.blockId,
          category: "single",
          roomsByDate: {},
          groupRateMinor: 0,
          releaseDateKey: state.calendar.dateKey,
          depositMinor: 0,
          cancellationDaysBeforeArrival: 0,
          cancellationFeeBasisPoints: 0,
          paymentTermsDays: 0,
          status: "declined",
        },
      ];
      ctx.emit({ type: "GROUP_CONTRACT_DECLINED", blockId: command.blockId }, [
        command.blockId,
      ]);
      return;
    case "ACCEPT_ALLOTMENT":
      d.allotments = [
        ...d.allotments,
        {
          id: command.allotmentId,
          partner: command.partner,
          category: command.category,
          roomsByDate: { ...command.roomsByDate },
          releaseDateKey: command.releaseDateKey,
        },
      ].sort((a, b) => (a.id < b.id ? -1 : 1));
      ctx.emit(
        { type: "ALLOTMENT_ACCEPTED", allotmentId: command.allotmentId },
        [command.allotmentId],
      );
      return;
    case "SET_CHANNEL_INVENTORY":
      d.channelInventory = [
        ...d.channelInventory.filter((r) => r.channelId !== command.channelId),
        {
          channelId: command.channelId,
          allowedCategories: [...command.allowedCategories].sort(),
          allowedRatePlanIds: [...command.allowedRatePlanIds].sort(),
          closed: false,
        },
      ];
      ctx.emit(
        {
          type: "CHANNEL_INVENTORY_CHANGED",
          channelId: command.channelId,
          closed: false,
        },
        [command.channelId],
      );
      return;
    case "CLOSE_CHANNEL": {
      const current = d.channelInventory.find(
        (r) => r.channelId === command.channelId,
      );
      d.channelInventory = [
        ...d.channelInventory.filter((r) => r.channelId !== command.channelId),
        {
          channelId: command.channelId,
          allowedCategories: current?.allowedCategories ?? [
            "single",
            "double",
            "suite",
          ],
          allowedRatePlanIds: current?.allowedRatePlanIds ?? [
            "flexible",
            "corporate",
            "group",
          ],
          closed: command.closed,
        },
      ];
      ctx.emit(
        {
          type: "CHANNEL_INVENTORY_CHANGED",
          channelId: command.channelId,
          closed: command.closed,
        },
        [command.channelId],
      );
      return;
    }
  }
}
