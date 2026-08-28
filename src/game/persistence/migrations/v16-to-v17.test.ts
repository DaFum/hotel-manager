import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../simulation/initialState";
import { PROTOCOL_VERSION } from "../../domain/protocol";
import {
  CONTENT_VERSION,
  type SaveEnvelope,
} from "../saveVersions";
import { migrateV16ToV17 } from "./v16-to-v17";
import { validateEnvelope } from "../saveSchema";

describe("v16-to-v17 save migration", () => {
  it("converts single loan into loans array and seeds payment history", () => {
    const initialState = createInitialGameState(1);
    const { loans, ...restState } = initialState as any;
    const oldSave: SaveEnvelope = {
      saveVersion: 16,
      contentVersion: CONTENT_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      rngState: initialState.rngState,
      state: {
        ...restState,
        loan: {
          id: "loan.starter",
          principalMinor: 1_000_000,
          annualRateBasisPoints: 500,
          termMonths: 60,
        },
      },
      preferences: {
        locale: "en-GB",
        audio: { master: 100, music: 100, ambience: 100, ui: 100, warnings: 100 },
        accessibility: { textScale: 1, highContrast: false, reducedMotion: false },
        notifications: {
          categories: [],
          severities: ["info", "notice", "warning", "critical"],
          hotelIds: [],
          regionIds: [],
          delegated: "all",
          autoPauseAt: "critical",
          autoPauseTypes: [],
          groupRepeated: true,
        },
        tutorialCompleted: [],
      },
    };

    const migrated = migrateV16ToV17(oldSave);
    expect(migrated.saveVersion).toBe(17);

    const migratedState = migrated.state as any;
    expect(migratedState.loan).toBeUndefined();
    expect(Array.isArray(migratedState.loans)).toBe(true);
    expect(migratedState.loans).toHaveLength(1);
    expect(migratedState.loans[0]).toEqual({
      id: "loan.starter",
      principalMinor: 1_000_000,
      annualRateBasisPoints: 500,
      termMonths: 60,
      amortisation: "bullet",
      rateType: "fixed",
      spreadBasisPoints: 0,
      startMonthIndex: 0,
      collateralValueMinor: 0,
    });
    expect(migratedState.finance.paymentHistory).toEqual({
      onTimePayments: 0,
      missedPayments: 0,
      consecutiveMissedPayments: 0,
    });
  });
});
