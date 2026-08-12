import { PROTOCOL_VERSION } from "../domain/protocol";
import { BASIS_POINTS } from "../domain/money";
import type { GameState } from "../simulation/initialState";
import {
  isValidAnnualProfit,
  isValidCampaign,
  isValidCareer,
  isValidChronicle,
  isValidKeyPerson,
  isValidMedia,
  isValidPrestige,
} from "../narrative/narrativeSchema";
import {
  CONTENT_VERSION,
  RNG_STREAM_NAMES,
  SAVE_VERSION,
  type RngStreamName,
  type SaveEnvelope,
} from "./saveVersions";
import { isValidPlayerPreferences } from "../settings/playerPreferences";
import { isFnbState } from "../fnb/fnbState";

export {
  CONTENT_VERSION,
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

function isValidAlert(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const alert = value as Record<string, unknown>;
  if (
    typeof alert.id !== "string" ||
    !alert.id ||
    !["info", "warning", "critical"].includes(String(alert.severity)) ||
    typeof alert.title !== "string" ||
    !alert.title.startsWith("alert.") ||
    typeof alert.cause !== "string" ||
    !alert.cause.startsWith("alert.")
  )
    return false;
  if (alert.target !== undefined) {
    if (!alert.target || typeof alert.target !== "object") return false;
    const target = alert.target as Record<string, unknown>;
    if (
      typeof target.entityId !== "string" ||
      !target.entityId ||
      !["room", "facility", "navigation"].includes(String(target.kind))
    )
      return false;
  }
  if (alert.causeValues === undefined) return true;
  if (
    !alert.causeValues ||
    typeof alert.causeValues !== "object" ||
    Array.isArray(alert.causeValues)
  )
    return false;
  return Object.values(alert.causeValues).every(
    (entry) => typeof entry === "string" || Number.isSafeInteger(entry),
  );
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
  if (!isValidPlayerPreferences(envelope.preferences))
    problems.push("the save has malformed player presentation preferences");
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
    problems.push("the state has no complete world");
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
  if (!isFnbState(state.fnb)) problems.push("the state has no complete fnb");
  const topFloor = Math.max(
    0,
    ...Object.values(state.renderDescriptors?.floorByRoomId ?? {}).filter(
      Number.isSafeInteger,
    ),
  );
  const maximumPositionBasisPoints =
    topFloor <= Math.floor(Number.MAX_SAFE_INTEGER / BASIS_POINTS)
      ? topFloor * BASIS_POINTS
      : null;
  if (
    !state.renderDescriptors ||
    typeof state.renderDescriptors !== "object" ||
    !state.renderDescriptors.floorPlan ||
    typeof state.renderDescriptors.floorPlan !== "object" ||
    !state.renderDescriptors.floorPlan.rooms ||
    typeof state.renderDescriptors.floorPlan.rooms !== "object" ||
    !state.renderDescriptors.floorByRoomId ||
    typeof state.renderDescriptors.floorByRoomId !== "object" ||
    !state.renderDescriptors.positionByEntityId ||
    typeof state.renderDescriptors.positionByEntityId !== "object" ||
    !Array.isArray(state.renderDescriptors.agents) ||
    !state.renderDescriptors.elevator ||
    typeof state.renderDescriptors.elevator !== "object" ||
    !Array.isArray(state.renderDescriptors.elevator.cars) ||
    maximumPositionBasisPoints === null ||
    !state.renderDescriptors.elevator.cars.every((car: any) => {
      return (
        car &&
        typeof car === "object" &&
        typeof car.id === "string" &&
        Number.isSafeInteger(car.currentFloor) &&
        car.currentFloor >= 0 &&
        car.currentFloor <= topFloor &&
        Number.isSafeInteger(car.targetFloor) &&
        car.targetFloor >= 0 &&
        car.targetFloor <= topFloor &&
        Number.isSafeInteger(car.positionFloorBasisPoints) &&
        car.positionFloorBasisPoints >= 0 &&
        maximumPositionBasisPoints !== null &&
        car.positionFloorBasisPoints <= maximumPositionBasisPoints
      );
    })
  )
    problems.push("the state has no complete render descriptors");
  if (!Array.isArray(state.alerts) || !state.alerts.every(isValidAlert))
    problems.push("the state has malformed alerts");
  const narrative = state.narrative;
  if (
    !narrative ||
    !Array.isArray(narrative.activeEvents) ||
    !Array.isArray(narrative.achievedMilestones) ||
    !Array.isArray(narrative.rivals) ||
    !Array.isArray(narrative.opportunities) ||
    !narrative.lastFiredByDefinition ||
    !isValidChronicle(narrative.chronicle) ||
    !Array.isArray(narrative.keyPeople) ||
    !narrative.keyPeople.every(isValidKeyPerson) ||
    !isValidAnnualProfit(narrative.annualProfit) ||
    !isValidMedia(narrative.media) ||
    !isValidPrestige(narrative.prestige) ||
    !isValidCampaign(narrative.campaign) ||
    !isValidCareer(narrative.career)
  )
    problems.push("the state has no complete narrative");
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
    !Number.isSafeInteger(company.treasury.hqMinor) ||
    !company.treasury.hotelCashMinor ||
    typeof company.treasury.hotelCashMinor !== "object" ||
    Object.values(company.treasury.hotelCashMinor).some(
      (balance) => !Number.isSafeInteger(balance),
    )
  )
    problems.push("the state has no complete company");
  else if (
    !company.portfolio.hotelLegalEntity ||
    typeof company.portfolio.hotelLegalEntity !== "object" ||
    // A list of entities is not a map from hotel to entity.
    Array.isArray(company.portfolio.hotelLegalEntity) ||
    company.portfolio.hotelIds.some((id) => typeof id !== "string")
  )
    // Reported rather than thrown: a malformed save must be refused with a
    // reason the player can read, not crash the validator that refuses it.
    problems.push("the company portfolio is malformed");
  else {
    if (!company.portfolio.hotelIds.includes(state.hotel?.id as string))
      problems.push("the company portfolio does not hold this save's hotel");
    // An own-property check against a named string: a hotel called `toString`
    // would otherwise resolve an inherited function and pass for an entity.
    for (const hotelId of company.portfolio.hotelIds)
      if (
        typeof hotelId !== "string" ||
        !hotelId ||
        !Object.hasOwn(company.portfolio.hotelLegalEntity, hotelId) ||
        typeof company.portfolio.hotelLegalEntity[hotelId] !== "string" ||
        !company.portfolio.hotelLegalEntity[hotelId]
      )
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
