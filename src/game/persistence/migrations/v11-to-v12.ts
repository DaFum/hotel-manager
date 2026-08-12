import type { SaveEnvelope } from "../saveVersions";

function categoryFromAlertId(id: string): string {
  return id.split(".")[1] || "operations";
}

/** The sole pre-release compatibility step requested for notification metadata. */
export function migrateV11ToV12(save: SaveEnvelope): SaveEnvelope {
  if (save.saveVersion !== 11) return save;
  const state = structuredClone(save.state) as any;
  const hotelId = state.hotel?.id;
  const regionId = state.company?.portfolio?.hotelRegion?.[hotelId];
  const companyId = state.company?.companyId;
  const gameTime = `${state.calendar?.dateKey}:${state.calendar?.minuteOfDay}`;
  state.alerts = (state.alerts ?? []).map((alert: any) => {
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
  return { ...save, saveVersion: 12, protocolVersion: 6, state };
}
