import type { GameState } from "../../game/simulation/initialState";
import {
  buildCostMinor,
  NEUTRAL_LAND_PRICE_MINOR,
} from "../../game/property/market";
import { MIN_PRESSURE_BP, MAX_PRESSURE_BP } from "../../game/labor/market";
import {
  connectivityIndex,
  TRANSPORT_MODES,
} from "../../game/transport/network";
import { ACTOR_KINDS, scaleByKind } from "../../game/actors/evolution";

export function cityEconomyView(state: GameState) {
  const landPriceMinor = state.cityMarket.landPriceMinor;
  return {
    landPriceMinor,
    landTrend:
      landPriceMinor > NEUTRAL_LAND_PRICE_MINOR
        ? ("above" as const)
        : landPriceMinor < NEUTRAL_LAND_PRICE_MINOR
          ? ("below" as const)
          : ("flat" as const),
    buildCostPerRoomMinor: buildCostMinor({ rooms: 1, landPriceMinor }),
    wagePressureBp: state.cityMarket.wagePressureBp,
    wagePressureMinBp: MIN_PRESSURE_BP,
    wagePressureMaxBp: MAX_PRESSURE_BP,
    connectivity: connectivityIndex(state.cityMarket.transport),
    transport: TRANSPORT_MODES.map((mode) => ({
      mode,
      rating: state.cityMarket.transport[mode],
    })),
  };
}

export function cityActivityView(state: GameState) {
  const scales = scaleByKind(state.cityMarket.actors);
  return {
    actors: ACTOR_KINDS.map((kind) => ({ kind, scale: scales[kind] })),
    soldRoomNights: state.cityMarket.soldRoomNights,
    eventUpliftBp: state.cityMarket.eventUpliftBp,
    entrantCount: state.cityMarket.entrantCount,
    events: state.events.map((event) => ({
      id: event.id,
      guests: event.guests,
      roomsBlocked: event.roomsBlocked,
      startDateKey: event.startDateKey,
      status: event.status,
    })),
  };
}

export function worldConditionsView(state: GameState) {
  return {
    macro: { ...state.world.macro },
    trends: state.world.trends.map((trend) => ({
      ...trend,
      name: `trend.${trend.id}.name`,
    })),
    shocks: state.world.activeShocks.map((shock) => ({ ...shock })),
    weather: { ...state.world.weather },
    commonCurrency: { ...state.world.commonCurrency },
    regulationPressureBp: state.world.regulationPressureBp,
  };
}
