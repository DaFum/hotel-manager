import { assertNonNegativeMinor } from "../domain/units";
/**
 * A conference is sold as four separate lines. Keeping them apart is what lets
 * the player see whether an event earned its money on rooms or on catering.
 */
export interface ContractLines {
  rental: number;
  rooms: number;
  catering: number;
  technology: number;
}

export function contractValueMinor(i: ContractLines): number {
  // Each line is checked before the sum: a negative line offset by another
  // would otherwise pass a safe-integer check on the total alone.
  for (const [line, value] of Object.entries(i))
    assertNonNegativeMinor(value, `contract ${line}`);
  const total = i.rental + i.rooms + i.catering + i.technology;
  if (!Number.isSafeInteger(total)) throw new Error("invalid contract value");
  return total;
}

export interface EventContract {
  id: string;
  guests: number;
  nights: number;
  /** Sleeping rooms held out of general sale for the delegation. */
  roomsBlocked: number;
  startDateKey: string;
}

/** Room-nights the contract takes out of the general inventory. */
export function roomBlockNights(c: EventContract): number {
  return Math.max(0, c.roomsBlocked) * Math.max(0, c.nights);
}

/** Housekeeping minutes a blocked room costs per night of the event. */
const EVENT_ROOM_CLEAN_MINUTES = 30;
/** Turning a conference room between sessions. */
const HALL_TURNAROUND_MINUTES = 60;

export interface ExecutionLoad {
  cateringCovers: number;
  breakfastCovers: number;
  housekeepingMinutes: number;
  securityGuests: number;
}

/**
 * What running the event actually costs the rest of the house. This is the
 * causal link the player is meant to feel: a signed conference shows up as
 * breakfast covers, housekeeping minutes, and security headcount.
 */
export function executionLoad(c: EventContract): ExecutionLoad {
  const roomNights = roomBlockNights(c);
  return {
    cateringCovers: Math.max(0, c.guests),
    // Only delegates who sleep in the house eat breakfast in it.
    breakfastCovers: Math.max(0, c.roomsBlocked),
    housekeepingMinutes:
      roomNights * EVENT_ROOM_CLEAN_MINUTES +
      Math.max(0, c.nights) * HALL_TURNAROUND_MINUTES,
    securityGuests: Math.max(0, c.guests),
  };
}

export type ContractStatus =
  "offered" | "negotiating" | "confirmed" | "cancelled" | "complete";
export interface ConferenceContract extends EventContract {
  status: ContractStatus;
  offerMinor: number;
  depositMinor: number;
}

export function advanceContract(
  contract: ConferenceContract,
  action: "negotiate" | "confirm" | "cancel" | "complete",
): ConferenceContract & { releasedRoomNights: number } {
  const allowed: Record<typeof action, readonly ContractStatus[]> = {
    negotiate: ["offered"],
    confirm: ["negotiating"],
    cancel: ["offered", "negotiating", "confirmed"],
    complete: ["confirmed"],
  };
  if (!allowed[action].includes(contract.status))
    throw new Error(`cannot ${action} a ${contract.status} contract`);
  const status: ContractStatus =
    action === "negotiate"
      ? "negotiating"
      : action === "confirm"
        ? "confirmed"
        : action === "cancel"
          ? "cancelled"
          : "complete";
  return {
    ...contract,
    status,
    releasedRoomNights: action === "cancel" ? roomBlockNights(contract) : 0,
  };
}
