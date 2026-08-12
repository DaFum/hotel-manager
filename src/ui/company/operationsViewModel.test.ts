import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../game/simulation/initialState";
import {
  audienceReachView,
  crmConsentView,
  salesPipelineView,
} from "./marketingViewModel";
import {
  acquisitionsView,
  headquartersView,
  treasuryView,
} from "./companyOperationsViewModel";
describe("company surface projections", () => {
  it("projects commercial audiences without budget figures", () => {
    const s = createInitialGameState(2);
    expect(salesPipelineView(s)).toEqual({ leads: [], contracts: [] });
    expect(crmConsentView(s).profiles).toBe(0);
    expect(audienceReachView(s).media.length).toBeGreaterThan(0);
  });
  it("projects treasury, targets and headquarters from authority", () => {
    const s = createInitialGameState(2);
    expect(treasuryView(s).consolidatedMinor).toBe(s.finance.cashMinor);
    expect(acquisitionsView(s)[0].offer.lowMinor).toBeLessThanOrEqual(
      acquisitionsView(s)[0].offer.highMinor,
    );
    expect(headquartersView(s)).toMatchObject({ hotelCount: 1, analysts: 1 });
  });
});
