import { PROTOCOL_VERSION } from "../domain/protocol";
import type { GameState } from "../simulation/initialState";
import { migrateV1ToV2 } from "./migrations/v1-to-v2";
import { migrateV2ToV3 } from "./migrations/v2-to-v3";
import { migrateV3ToV4 } from "./migrations/v3-to-v4";
import { migrateV4ToV5 } from "./migrations/v4-to-v5";
import {
  CONTENT_VERSION,
  MIGRATABLE_SAVE_VERSIONS,
  RNG_STREAM_NAMES,
  SAVE_VERSION,
  type RngStreamName,
  type SaveEnvelope,
} from "./saveVersions";

export {
  CONTENT_VERSION,
  MIGRATABLE_SAVE_VERSIONS,
  RNG_STREAM_NAMES,
  SAVE_VERSION,
  type RngStreamName,
  type SaveEnvelope,
} from "./saveVersions";

/** Every stream must be present and whole, or a replay silently diverges. */
export function isCompleteRngState(
  value: unknown,
): value is Record<RngStreamName, number> {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return RNG_STREAM_NAMES.every((name) => Number.isSafeInteger(state[name]));
}

/**
 * Everything wrong with a stored envelope, named. A boolean is enough to
 * refuse a save but not enough to tell the player why, and "why" is the
 * difference between a recoverable mistake and a lost hotel.
 */
export function validateEnvelope(envelope: SaveEnvelope): string[] {
  const problems: string[] = [];
  if (!envelope || typeof envelope !== "object") return ["not a save envelope"];
  if (envelope.saveVersion !== SAVE_VERSION)
    problems.push(
      `save version ${envelope.saveVersion} is not ${SAVE_VERSION}`,
    );
  if (envelope.contentVersion !== CONTENT_VERSION)
    problems.push(`content version ${envelope.contentVersion} is foreign`);
  if (envelope.protocolVersion !== PROTOCOL_VERSION)
    problems.push(
      `protocol version ${envelope.protocolVersion} is not ${PROTOCOL_VERSION}`,
    );
  if (!isCompleteRngState(envelope.rngState))
    problems.push("one or more rng streams are missing or not whole numbers");
  if (!envelope.state || typeof envelope.state !== "object")
    return [...problems, "the envelope carries no state"];

  const state = envelope.state as Partial<GameState>;
  // The state carries the streams the simulation is actually restored from.
  // Checking only the header would let through a save whose state has none,
  // and restoring that would throw outside the validation path.
  if (!isCompleteRngState(state.rngState))
    problems.push("the state is missing one or more rng streams");
  else if (isCompleteRngState(envelope.rngState))
    // Header and state are the same streams; a save where they disagree would
    // replay differently depending on which one was believed.
    for (const name of RNG_STREAM_NAMES)
      if (state.rngState[name] !== envelope.rngState[name])
        problems.push(`rng stream ${name} disagrees with the envelope header`);

  if (!state.calendar || typeof state.calendar.dateKey !== "string")
    problems.push("the state has no calendar");
  if (!state.hotel || !Array.isArray(state.hotel.rooms))
    problems.push("the state has no hotel");
  if (!state.finance || !Number.isSafeInteger(state.finance.cashMinor))
    problems.push("cash is not whole Pfennig");
  if (state.finance && !Array.isArray(state.finance.ledger))
    problems.push("the state has no ledger");
  if (
    !state.world ||
    !Array.isArray(state.world.technologies) ||
    !state.world.macro ||
    !Array.isArray(state.world.trends) ||
    !Array.isArray(state.world.activeShocks) ||
    !state.world.weather ||
    !state.world.commonCurrency
  )
    problems.push("the state has no complete Plan 04 world");
  if (
    !state.revenuePolicy ||
    !Array.isArray(state.revenuePolicy.ratePlans) ||
    !Array.isArray(state.revenuePolicy.rules)
  )
    problems.push("the state has no revenue policy");
  if (!Array.isArray(state.technologyProjects))
    problems.push("the state has no technology projects");
  if (!Array.isArray(state.technologyImplementations))
    problems.push("the state has no technology implementations");
  const company = state.company;
  if (
    !company ||
    !company.portfolio ||
    !Array.isArray(company.portfolio.hotelIds) ||
    !Array.isArray(company.legalEntities) ||
    !Array.isArray(company.brands) ||
    !Array.isArray(company.managedHotels) ||
    !Array.isArray(company.managers) ||
    !company.treasury ||
    !Number.isSafeInteger(company.treasury.hqMinor)
  )
    problems.push("the state has no complete Plan 05 company");
  else if (
    !company.portfolio.hotelLegalEntity ||
    typeof company.portfolio.hotelLegalEntity !== "object" ||
    company.portfolio.hotelIds.some((id) => typeof id !== "string")
  )
    // Reported rather than thrown: a malformed save must be refused with a
    // reason the player can read, not crash the validator that refuses it.
    problems.push("the company portfolio is malformed");
  else {
    if (!company.portfolio.hotelIds.includes(state.hotel?.id as string))
      problems.push("the company portfolio does not hold this save's hotel");
    for (const hotelId of company.portfolio.hotelIds)
      if (!company.portfolio.hotelLegalEntity[hotelId])
        problems.push(`hotel ${hotelId} is held by no legal entity`);
  }

  // Every stay must point at a room that exists, or the hotel restores with
  // guests in rooms it does not have.
  const roomIds = new Set(
    Array.isArray(state.hotel?.rooms) ? state.hotel.rooms.map((r) => r.id) : [],
  );
  if (!Array.isArray(state.stays)) problems.push("the state has no stays");
  else
    for (const stay of state.stays)
      if (!stay || typeof stay !== "object")
        problems.push("the state has a malformed stay");
      else if (!roomIds.has(stay.roomId))
        problems.push(
          `stay ${stay.bookingId} refers to missing room ${stay.roomId}`,
        );

  return problems;
}

/** A save is replayable only when all three versions match this build. */
export function isCompatible(envelope: SaveEnvelope): boolean {
  return validateEnvelope(envelope).length === 0;
}

export function assertCompatible(envelope: SaveEnvelope): void {
  const problems = validateEnvelope(envelope);
  if (problems.length > 0)
    throw new Error(`incompatible save: ${problems.join("; ")}`);
}

/**
 * Brings a stored envelope forward to this build. Migration is explicit and
 * ordered: a save is never silently reinterpreted, it is rewritten.
 */
export function migrateEnvelope(envelope: SaveEnvelope): SaveEnvelope {
  if (!envelope) return envelope;
  // One step per declared version, so adding a version to the list without a
  // step is a visible gap rather than a silent no-op.
  const steps: Record<number, (e: SaveEnvelope) => SaveEnvelope> = {
    1: migrateV1ToV2,
    2: migrateV2ToV3,
    3: migrateV3ToV4,
    4: migrateV4ToV5,
  };
  let current = envelope;
  if (current.saveVersion === 4 && current.contentVersion === "plans-01-03-v4")
    current = migrateV3ToV4(current);
  while (
    (MIGRATABLE_SAVE_VERSIONS as readonly number[]).includes(
      current.saveVersion,
    )
  ) {
    const step = steps[current.saveVersion];
    if (!step) break;
    current = step(current);
  }
  return current;
}
