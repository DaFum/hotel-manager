import type { SaveEnvelope } from "../saveVersions";

export function migrateV18ToV19(save: SaveEnvelope): SaveEnvelope {
  if (!save.state || typeof save.state !== "object" || Array.isArray(save.state)) {
    return {
      ...save,
      saveVersion: 19,
    };
  }
  const oldState = save.state as Record<string, any>;
  const oldHotel = oldState.hotel && typeof oldState.hotel === "object" ? oldState.hotel : {};
  const migratedHotel = {
    ...oldHotel,
    jurisdictionId: oldHotel.jurisdictionId ?? "de.he.frankfurt",
  };

  const migratedCompliance = oldState.compliance ?? {
    rules: {},
    activeRestrictions: {},
    activeClosures: {},
  };

  const newState = {
    ...oldState,
    hotel: migratedHotel,
    compliance: migratedCompliance,
  };

  return {
    ...save,
    saveVersion: 19,
    state: newState,
  };
}
