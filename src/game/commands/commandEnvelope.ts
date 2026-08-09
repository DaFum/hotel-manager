import type { ExpandableArea } from "../classification/specialization";
import type { RoomCategory } from "../revenue/rates";
import type { StaffRole } from "../domain/staffRoles";
import type { Shift } from "../staff/staffing";
import type { OperatingModel } from "../ownership/models";
import type { DueDiligenceArea } from "../ma/dueDiligence";
import type { OpeningChecklistItem } from "../development/preOpening";
import type { ManagerAuthority } from "../management/managerAuthority";
import type { DifficultyId } from "../campaign/campaignConfig";
import type { RecoveryPath } from "../campaign/careerOutcome";

/**
 * The payload half of a command: what the player wants done, with no identity
 * of its own. Identity, causation and concurrency live on the envelope.
 */
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
  | { type: "SET_SPECIALIZATION"; specializationId: string | null }
  | { type: "EXPAND_FACILITY"; area: ExpandableArea }
  | { type: "BUY_MARKET_RESEARCH" }
  | { type: "ADOPT_TECHNOLOGY"; technologyId: string }
  // --- the company above the hotels --------------------------------------
  | { type: "ASSIGN_BRAND"; hotelId: string; brandId: string }
  | { type: "REMOVE_BRAND"; hotelId: string }
  | { type: "SET_OPERATING_MODEL"; hotelId: string; model: OperatingModel }
  | {
      type: "SET_HOTEL_BUDGET";
      hotelId: string;
      capexBudgetMinor: number;
      operatingBudgetMinor: number;
    }
  | {
      type: "SET_MANAGER_AUTHORITY";
      hotelId: string;
      authority: Partial<ManagerAuthority>;
    }
  | { type: "RESOLVE_ESCALATION"; escalationId: string; approve: boolean }
  | {
      type: "TRANSFER_INTERNAL_FUNDING";
      hotelId: string;
      amountMinor: number;
      /** `fund` moves cash down to the hotel, `sweep` draws it back up. */
      direction: "fund" | "sweep";
    }
  | {
      type: "START_DEVELOPMENT";
      developmentId: string;
      name: string;
      cityId: string;
      rooms: number;
      investmentMinor: number;
      expectedAdrMinor: number;
      occupancyBasisPoints: number;
      targetOpenDateKey: string;
    }
  | {
      type: "COMPLETE_PRE_OPENING_TASK";
      developmentId: string;
      item: OpeningChecklistItem;
    }
  | { type: "OPEN_DEVELOPMENT"; developmentId: string }
  | { type: "RUN_DUE_DILIGENCE"; targetId: string; areas: DueDiligenceArea[] }
  | { type: "ACQUIRE_HOTEL"; targetId: string; priceMinor: number }
  | { type: "SET_CAMPAIGN_DIFFICULTY"; difficulty: DifficultyId }
  | { type: "RESOLVE_NARRATIVE_EVENT"; eventId: string; choiceId: string }
  | { type: "TAKE_RECOVERY_MEASURE"; path: RecoveryPath }
  | { type: "CONTINUE_ENDLESS_CAREER" };

export type CommandType = GameCommand["type"];

/**
 * Who issued a command. The hotel's own standing orders are an actor too, so
 * an automatic reorder is as auditable as a decision the player typed.
 */
export type CommandActor = "player" | "automation";

export interface CommandEnvelope {
  /** Authoritative identity; decided once and never reused. */
  commandId: string;
  /** Simulated minutes since the start of the game when it was issued. */
  issuedAtMinutes: number;
  actor: CommandActor;
  payload: GameCommand;
  /**
   * The state version the issuer believed it was acting on. When present, a
   * command that arrives after the world has moved on is rejected instead of
   * being applied to a state its author never saw.
   */
  expectedStateVersion?: number;
}

export type CommandStatus = "accepted" | "rejected";

/** One decided command, as it is written into the persisted log. */
export interface CommandLogEntry {
  commandId: string;
  issuedAtMinutes: number;
  actor: CommandActor;
  type: CommandType;
  status: CommandStatus;
  /** Present only on a rejection. */
  reason?: string;
  /** The state version after the decision; unchanged for a rejection. */
  stateVersion: number;
}

export interface CommandResult {
  commandId: string;
  status: CommandStatus;
  reason?: string;
  /** The state version the caller may now assume. */
  stateVersion: number;
}

/**
 * Builds a well-formed envelope. Deliberately strict: an unidentified or
 * time-less command cannot be logged, replayed or de-duplicated, so it must
 * not be constructible in the first place.
 */
export function commandEnvelope(input: {
  commandId: string;
  issuedAtMinutes: number;
  actor: CommandActor;
  payload: GameCommand;
  expectedStateVersion?: number;
}): CommandEnvelope {
  if (!input.commandId) throw new Error("a command id is required");
  if (!Number.isSafeInteger(input.issuedAtMinutes) || input.issuedAtMinutes < 0)
    throw new Error("issued game time must be whole non-negative minutes");
  if (input.actor !== "player" && input.actor !== "automation")
    throw new Error(`unknown command actor: ${String(input.actor)}`);
  if (!input.payload || typeof input.payload.type !== "string")
    throw new Error("a command payload with a type is required");
  if (
    input.expectedStateVersion !== undefined &&
    (!Number.isSafeInteger(input.expectedStateVersion) ||
      input.expectedStateVersion < 0)
  )
    throw new Error("expected state version must be a whole version number");

  // The key is always present so the envelope has one stable shape, and a
  // transport correlation id has nowhere to hide inside it.
  return {
    commandId: input.commandId,
    issuedAtMinutes: input.issuedAtMinutes,
    actor: input.actor,
    payload: input.payload,
    expectedStateVersion: input.expectedStateVersion,
  };
}

/**
 * A structural check for envelopes crossing the worker boundary, where the
 * value is `unknown` until proven otherwise.
 */
export function isCommandEnvelope(value: unknown): value is CommandEnvelope {
  const e = value as CommandEnvelope | null;
  return Boolean(
    e &&
    typeof e === "object" &&
    typeof e.commandId === "string" &&
    e.commandId.length > 0 &&
    // The same lower bounds the factory applies: this guard is the only
    // barrier for an envelope that did not come from it, and a negative
    // issued time would be written verbatim into the command journal.
    Number.isSafeInteger(e.issuedAtMinutes) &&
    e.issuedAtMinutes >= 0 &&
    (e.actor === "player" || e.actor === "automation") &&
    e.payload &&
    typeof e.payload.type === "string" &&
    (e.expectedStateVersion === undefined ||
      (Number.isSafeInteger(e.expectedStateVersion) &&
        e.expectedStateVersion >= 0)),
  );
}
