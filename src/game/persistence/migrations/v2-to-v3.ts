import { PROTOCOL_VERSION } from "../../domain/protocol";
import type { SaveEnvelope } from "../saveVersions";
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
    saveVersion: 3,
    contentVersion: "city-market-1991-v3",
    // A migrated save is rewritten by this build, so it speaks this build's
    // protocol; leaving the old number would make it fail validation for a
    // reason that is no longer true of it.
    protocolVersion: PROTOCOL_VERSION,
    state: {
      ...state,
      cityMarket: state.cityMarket ?? createCityMarket(dateKey),
      competitors: Array.isArray(state.competitors)
        ? state.competitors
        : createCompetitors(),
    },
  };
}
