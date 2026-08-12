import type { SaveEnvelope } from "../saveVersions";

function categoryFromAlertId(id: string): string {
  return id.split(".")[1] || "operations";
}

/** The sole pre-release compatibility step requested for notification metadata. */
export function migrateV11ToV12(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion !== 11) return save;
  const state = structuredClone(save.state) as any;
  if (state === null || typeof state !== "object" || Array.isArray(state))
    throw new Error("save state must be an object");
  if (!Array.isArray(state.alerts))
    throw new Error("save alerts must be an array");
  const hotelId = state.hotel?.id;
  const regionId = state.company?.portfolio?.hotelRegion?.[hotelId];
  const companyId = state.company?.companyId;
  const gameTime = `${state.calendar?.dateKey}:${state.calendar?.minuteOfDay}`;
  state.alerts = state.alerts.map((alert: any) => {
    if (alert === null || typeof alert !== "object" || Array.isArray(alert))
      throw new Error("save alert must be an object");
    const category = categoryFromAlertId(String(alert.id ?? ""));
    return {
      ...alert,
      category,
      groupId: `${hotelId}:${category}`,
      source: {
        companyId,
        ...(hotelId ? { hotelId } : {}),
        ...(regionId ? { regionId } : {}),
      },
      gameTime,
      acknowledged: false,
    };
  });
  if (
    state.company?.hotelResults &&
    typeof state.company.hotelResults === "object" &&
    !Array.isArray(state.company.hotelResults)
  )
    for (const result of Object.values(state.company.hotelResults) as any[])
      if (
        result !== null &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        result.eventRevenueMinor === undefined
      )
        result.eventRevenueMinor = 0;
  return { ...save, saveVersion: 12, protocolVersion: 6, state };
}
