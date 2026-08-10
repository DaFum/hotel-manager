import { migrateEnvelope, validateEnvelope } from "./saveSchema";
import { recoverySlot } from "./savePolicy";
import type { SaveEnvelope } from "./saveVersions";

/**
 * How many rotating generations the safety net keeps. Two is the minimum the
 * remediation plan asks for; three means a corrupt write and a corrupt
 * predecessor still leave something to go back to.
 */
export const RECOVERY_GENERATIONS = 3;

/** The store the recovery lifecycle drives; IndexedDB is one implementation. */
export interface SaveStore {
  save(slot: string, envelope: SaveEnvelope): Promise<void>;
  load(slot: string): Promise<SaveEnvelope | null>;
  listSlots(): Promise<string[]>;
  deleteSlot(slot: string): Promise<void>;
}

/**
 * Writes the newest recovery generation and retires the oldest.
 *
 * Generation 0 is always the newest. Rotating downwards before writing means
 * a failure part-way through loses at most one generation rather than
 * scrambling the order of the rest.
 */
/**
 * One rotation at a time, per store.
 *
 * A rotation is a read-modify-write across several transactions. The store has
 * no lock of its own, and the caller does not queue: a calendar autosave can
 * fire while a pre-action save is still rotating. Interleaved, the two can
 * copy one envelope into two generations or drop one, leaving fewer distinct
 * generations than RECOVERY_GENERATIONS promises.
 */
const rotations = new WeakMap<SaveStore, Promise<void>>();

export function rotateRecovery(
  store: SaveStore,
  envelope: SaveEnvelope,
): Promise<void> {
  const queued = (rotations.get(store) ?? Promise.resolve())
    // A failed rotation must not block every rotation after it.
    .catch(() => undefined)
    .then(() => rotateNow(store, envelope));
  rotations.set(
    store,
    queued.catch(() => undefined),
  );
  return queued;
}

async function rotateNow(
  store: SaveStore,
  envelope: SaveEnvelope,
): Promise<void> {
  for (
    let generation = RECOVERY_GENERATIONS - 1;
    generation > 0;
    generation--
  ) {
    const older = await store
      .load(recoverySlot(generation - 1))
      .catch(() => null);
    if (older) await store.save(recoverySlot(generation), older);
  }
  await store.save(recoverySlot(0), envelope);
}

export interface RecoveryOutcome {
  envelope: SaveEnvelope;
  /** The slot it actually came from, which may not be the one asked for. */
  slot: string;
  /** Slots that were tried and refused, newest first, with the reason. */
  rejected: RecoveryRejection[];
}

export interface RecoveryRejection {
  slot: string;
  stage: "read" | "missing" | "migration" | "validation";
  reason: string;
}

/**
 * Loads a slot, falling back through the recovery generations when it cannot
 * be trusted. Every candidate is migrated and validated before it is offered:
 * a save that would corrupt the running game is not a save.
 */
export async function loadWithRecovery(
  store: SaveStore,
  slot: string,
): Promise<RecoveryOutcome | { rejected: RecoveryRejection[] }> {
  const rejected: RecoveryRejection[] = [];
  const candidates = [
    slot,
    ...Array.from({ length: RECOVERY_GENERATIONS }, (_, i) => recoverySlot(i)),
  ];

  for (const candidate of candidates) {
    let stored: SaveEnvelope | null = null;
    try {
      stored = await store.load(candidate);
    } catch (error) {
      rejected.push({
        slot: candidate,
        stage: "read",
        reason: (error as Error).message,
      });
      continue;
    }
    if (!stored) {
      rejected.push({
        slot: candidate,
        stage: "missing",
        reason: "no save in slot",
      });
      continue;
    }
    let migrated: SaveEnvelope;
    try {
      migrated = migrateEnvelope(stored);
    } catch (error) {
      rejected.push({
        slot: candidate,
        stage: "migration",
        reason: (error as Error).message,
      });
      continue;
    }
    const problems = validateEnvelope(migrated);
    if (problems.length > 0) {
      rejected.push({
        slot: candidate,
        stage: "validation",
        reason: problems.join("; "),
      });
      continue;
    }
    return { envelope: migrated, slot: candidate, rejected };
  }
  return { rejected };
}

export function isRecovered(
  outcome: Awaited<ReturnType<typeof loadWithRecovery>>,
): outcome is RecoveryOutcome {
  return "envelope" in outcome;
}
