import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../saveVersions";
import { createCityMarket, createCompetitors } from "../../city/cityMarket";

/**
 * v2 saves are of a hotel that had no city around it. The migration gives the
 * campaign the market as content defines it on the day the save is loaded —
 * the same starting city a new game gets — rather than inventing a history
 * the save never had or reinterpreting any v2 field.
 */
export function migrateV2ToV3(s: SaveEnvelope): SaveEnvelope {
  const state = (s.state ?? {}) as Record<string, unknown>;
  const calendar = (state.calendar ?? {}) as { dateKey?: string };
  const dateKey =
    typeof calendar.dateKey === "string" ? calendar.dateKey : "1991-01-01";

  return {
    ...s,
    saveVersion: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    state: {
      ...state,
      cityMarket: state.cityMarket ?? createCityMarket(dateKey),
      competitors: Array.isArray(state.competitors)
        ? state.competitors
        : createCompetitors(),
    },
  };
}
