import { describe, expect, it } from "vitest";
import { validateCompanyCommand } from "./companyCommands";
import { createInitialGameState } from "../simulation/initialState";

describe("companyCommands TAKE_LOAN validation", () => {
  it("rejects termMonths > 600", () => {
    const state = createInitialGameState(1);
    const result = validateCompanyCommand(state, {
      type: "TAKE_LOAN",
      principalMinor: 100_000_00,
      termMonths: 601,
      amortisation: "bullet",
      rateType: "fixed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("up to 600");
    }
  });

  it("rejects collateral exceeding unencumbered assets", () => {
    const state = createInitialGameState(1);
    const unencumbered = state.statements.fixedAssetsMinor;
    const result = validateCompanyCommand(state, {
      type: "TAKE_LOAN",
      principalMinor: 100_000_00,
      termMonths: 12,
      amortisation: "bullet",
      rateType: "fixed",
      collateralValueMinor: unencumbered + 10_000_00,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("exceeds unencumbered asset value");
    }
  });

  it("accepts valid loan within borrowing capacity and unencumbered collateral", () => {
    const state = createInitialGameState(1);
    const result = validateCompanyCommand(state, {
      type: "TAKE_LOAN",
      principalMinor: 100_000_00,
      termMonths: 12,
      amortisation: "bullet",
      rateType: "fixed",
      collateralValueMinor: 50_000_00,
    });
    expect(result.ok).toBe(true);
  });
});
