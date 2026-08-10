import type { CommandType } from "../commands/commandEnvelope";

/**
 * What a stored save is for. The three kinds are kept apart on purpose: an
 * autosave must never quietly overwrite the slot a player chose, and a
 * recovery generation must never be mistaken for either.
 */
export type SaveSlotKind = "manual" | "autosave" | "recovery";

/** Why the game saved itself. */
export type AutosaveReason = "month" | "year" | "major-action";

export interface SlotDescriptor {
  id: string;
  kind: SaveSlotKind;
  /** The manual name, the autosave reason, or the recovery generation. */
  label: string;
}

const MANUAL_PREFIX = "manual:";
const AUTOSAVE_PREFIX = "auto:";
const RECOVERY_PREFIX = "recovery:";

/** The manual slot used by the one-click save and file-transfer surfaces. */
export const DEFAULT_MANUAL_SLOT = `${MANUAL_PREFIX}quick save`;

export function manualSlot(name: string): string {
  if (!name.trim()) throw new Error("a manual slot needs a name");
  return `${MANUAL_PREFIX}${name}`;
}

export function autosaveSlot(reason: AutosaveReason): string {
  return `${AUTOSAVE_PREFIX}${reason}`;
}

export function recoverySlot(generation: number): string {
  if (!Number.isSafeInteger(generation) || generation < 0)
    throw new Error("a recovery generation is a whole non-negative number");
  return `${RECOVERY_PREFIX}${generation}`;
}

export function describeSlot(id: string): SlotDescriptor {
  if (id.startsWith(MANUAL_PREFIX))
    return { id, kind: "manual", label: id.slice(MANUAL_PREFIX.length) };
  if (id.startsWith(AUTOSAVE_PREFIX))
    return { id, kind: "autosave", label: id.slice(AUTOSAVE_PREFIX.length) };
  if (id.startsWith(RECOVERY_PREFIX))
    return { id, kind: "recovery", label: id.slice(RECOVERY_PREFIX.length) };
  throw new Error(`unrecognised save slot: ${id}`);
}

const KIND_ORDER: Record<SaveSlotKind, number> = {
  manual: 0,
  autosave: 1,
  recovery: 2,
};

/**
 * A stable listing order: the player's own saves first, then the game's, then
 * the safety net. Within a kind, by id. No wall clock is involved, so two
 * machines list the same slots in the same order.
 */
export function orderSlots(ids: readonly string[]): SlotDescriptor[] {
  return ids
    .flatMap((id) => {
      try {
        return [describeSlot(id)];
      } catch {
        return [];
      }
    })
    .sort(
      (a, b) =>
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}

/** The calendar position a save policy decision is taken against. */
export interface SavePoint {
  dateKey: string;
  minuteOfDay: number;
}

/**
 * Whether the game should save itself between these two points. Month and year
 * are decided from the calendar rather than from elapsed minutes, so a loaded
 * game and an uninterrupted one autosave on exactly the same days.
 */
export function autosaveReason(
  before: SavePoint,
  after: SavePoint,
): AutosaveReason | null {
  if (before.dateKey === after.dateKey) return null;
  if (before.dateKey.slice(0, 4) !== after.dateKey.slice(0, 4)) return "year";
  if (before.dateKey.slice(0, 7) !== after.dateKey.slice(0, 7)) return "month";
  return null;
}

/**
 * Actions worth a save before they happen: the ones that spend a lot, take a
 * long time, or cannot be undone by issuing the opposite command.
 */
const MAJOR_ACTIONS: readonly CommandType[] = [
  "START_RENOVATION",
  "EXPAND_FACILITY",
];

export function isMajorAction(type: CommandType): boolean {
  return MAJOR_ACTIONS.includes(type);
}
