import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../game/simulation/initialState";
import {
  cityActivityView,
  cityEconomyView,
  worldConditionsView,
} from "./marketViewModel";
describe("market view model", () => {
  it("projects existing city and world state", () => {
    const s = createInitialGameState(1);
    const economy = cityEconomyView(s);
    expect(economy.landPriceMinor).toBe(s.cityMarket.landPriceMinor);
    expect(economy.transport).toHaveLength(4);
    expect(cityActivityView(s)).toMatchObject({
      soldRoomNights: 0,
      entrantCount: 0,
    });
    expect(worldConditionsView(s).macro).toEqual(s.world.macro);
  });
});
