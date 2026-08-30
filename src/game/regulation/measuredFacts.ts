import type { GameState } from "../simulation/initialState";
import type { RegulationArea } from "./compliance";
import { toEngineeringAsset } from "../maintenance/maintenance";
import { CORE_CONTENT_REGISTRY } from "../content/corePack";

export function getMeasuredFact(
  state: GameState,
  area: RegulationArea,
): number {
  let value: number;

  switch (area) {
    case "safety": {
      const assetConditions = state.assets.map(
        (asset) => toEngineeringAsset(asset, asset.rated).condition,
      );
      value = assetConditions.length > 0 ? Math.min(...assetConditions) : 100;
      break;
    }
    case "labor": {
      const wages = state.staff.map((s) => s.monthlyWageMinor);
      value = wages.length > 0 ? Math.min(...wages) : 0;
      break;
    }
    case "accessibility": {
      const rooms = state.hotel.rooms;
      if (rooms.length === 0) {
        value = 0;
      } else {
        const totalBp = rooms.reduce((sum, room) => {
          const entry = CORE_CONTENT_REGISTRY.get(room.moduleId);
          const bp =
            entry && "accessibilityBasisPoints" in entry
              ? (entry.accessibilityBasisPoints as number)
              : 0;
          return sum + bp;
        }, 0);
        value = Math.round(totalBp / rooms.length / 100);
      }
      break;
    }
    case "environment":
      value = 100;
      break;
    case "foodHygiene":
      value = 100;
      break;
    case "privacy":
      value = 100;
      break;
    case "construction":
      value = 100;
      break;
    case "tax":
      value = 100;
      break;
    default: {
      const _exhaustiveCheck: never = area;
      throw new Error(`unhandled regulation area: ${_exhaustiveCheck}`);
    }
  }

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`measured value for ${area} must be a non-negative safe integer`);
  }

  return value;
}

export function getMeasuredFacts(
  state: GameState,
): Record<RegulationArea, number> {
  const areas: RegulationArea[] = [
    "safety",
    "labor",
    "accessibility",
    "environment",
    "foodHygiene",
    "privacy",
    "construction",
    "tax",
  ];

  const result = {} as Record<RegulationArea, number>;
  for (const area of areas) {
    result[area] = getMeasuredFact(state, area);
  }
  return result;
}
