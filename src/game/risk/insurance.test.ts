import { describe, expect, it } from "vitest";
import {
  createInsuranceState,
  cancelPolicy,
  fileClaim,
  monthlyPremiumMinor,
  settleClaim,
  settlementMinor,
  takeOutPolicy,
  underinsuranceBasisPoints,
  varyPolicy,
} from "./insurance";
import { XorShift32 } from "../domain/rng";

const POLICY = {
  id: "policy.building",
  peril: "fire" as const,
  insuredValueMinor: 100_000_000,
  limitMinor: 60_000_000,
  deductibleMinor: 2_000_000,
  annualRateBasisPoints: 120,
  exclusions: ["wear"],
};

describe("insurance", () => {
  it("prices a premium from the insured value and the rate", () => {
    expect(monthlyPremiumMinor(POLICY)).toBe(100_000);
  });

  it("pays a loss less the deductible, capped at the limit", () => {
    expect(
      settlementMinor(POLICY, { perilId: "fire", lossMinor: 10_000_000 }),
    ).toBe(8_000_000);
    // The limit binds however large the loss is.
    expect(
      settlementMinor(POLICY, { perilId: "fire", lossMinor: 90_000_000 }),
    ).toBe(60_000_000);
    // A loss inside the deductible is the hotel's own to carry.
    expect(
      settlementMinor(POLICY, { perilId: "fire", lossMinor: 1_000_000 }),
    ).toBe(0);
  });

  it("pays nothing for a peril the policy does not cover", () => {
    expect(
      settlementMinor(POLICY, { perilId: "flood", lossMinor: 10_000_000 }),
    ).toBe(0);
  });

  it("pays nothing for an excluded cause even under a covered peril", () => {
    expect(
      settlementMinor(POLICY, {
        perilId: "fire",
        lossMinor: 10_000_000,
        cause: "wear",
      }),
    ).toBe(0);
  });

  it("scales the settlement down when the building is underinsured", () => {
    const thin = { ...POLICY, insuredValueMinor: 50_000_000 };
    expect(
      underinsuranceBasisPoints(thin, { rebuildValueMinor: 100_000_000 }),
    ).toBe(5000);
    expect(
      settlementMinor(
        thin,
        { perilId: "fire", lossMinor: 10_000_000 },
        { rebuildValueMinor: 100_000_000 },
      ),
      // Average bites the loss first — 10m becomes 5m — and only then does
      // the hotel's own 2m deductible come off it.
    ).toBe(3_000_000);
    // Fully insured, the average condition does nothing.
    expect(
      underinsuranceBasisPoints(POLICY, { rebuildValueMinor: 100_000_000 }),
    ).toBe(10_000);
  });

  it("takes a claim through evidence and a delay before it settles", () => {
    let state = takeOutPolicy(createInsuranceState(), POLICY);
    state = fileClaim(state, {
      id: "claim.1",
      policyId: "policy.building",
      perilId: "fire",
      lossMinor: 10_000_000,
      filedAtMinutes: 1440,
      cause: "electrical",
    });
    const claim = state.claims[0];
    expect(claim.status).toBe("filed");
    expect(claim.settlementMinor).toBe(0);

    const settled = settleClaim(state, "claim.1", {
      atMinutes: 1440 + claim.assessmentMinutes,
      rebuildValueMinor: 100_000_000,
    });
    expect(settled.claims[0].status).toBe("settled");
    expect(settled.claims[0].settlementMinor).toBe(8_000_000);
  });

  it("refuses to settle before the assessment has run its course", () => {
    let state = takeOutPolicy(createInsuranceState(), POLICY);
    state = fileClaim(state, {
      id: "claim.1",
      policyId: "policy.building",
      perilId: "fire",
      lossMinor: 10_000_000,
      filedAtMinutes: 1440,
    });
    expect(() =>
      settleClaim(state, "claim.1", {
        atMinutes: 1441,
        rebuildValueMinor: 100_000_000,
      }),
    ).toThrow(/still being assessed/);
  });

  it("refuses to settle the same claim twice", () => {
    let state = takeOutPolicy(createInsuranceState(), POLICY);
    state = fileClaim(state, {
      id: "claim.1",
      policyId: "policy.building",
      perilId: "fire",
      lossMinor: 10_000_000,
      filedAtMinutes: 0,
    });
    const once = settleClaim(state, "claim.1", {
      atMinutes: 100_000,
      rebuildValueMinor: 100_000_000,
    });
    expect(() =>
      settleClaim(once, "claim.1", {
        atMinutes: 200_000,
        rebuildValueMinor: 100_000_000,
      }),
    ).toThrow(/already settled/);
  });

  it("draws its assessment delay from the failures stream, not the guests", () => {
    const state = takeOutPolicy(createInsuranceState(), POLICY);
    const stream = new XorShift32(7);
    const first = fileClaim(
      state,
      {
        id: "claim.1",
        policyId: "policy.building",
        perilId: "fire",
        lossMinor: 1_000_000,
        filedAtMinutes: 0,
      },
      stream,
    );
    // The same seed gives the same delay: a claim is deterministic, not luck.
    const again = fileClaim(
      state,
      {
        id: "claim.1",
        policyId: "policy.building",
        perilId: "fire",
        lossMinor: 1_000_000,
        filedAtMinutes: 0,
      },
      new XorShift32(7),
    );
    expect(first.claims[0].assessmentMinutes).toBe(
      again.claims[0].assessmentMinutes,
    );
    expect(first.claims[0].assessmentMinutes).toBeGreaterThan(0);
  });

  it("refuses a policy whose limit is above the value it insures", () => {
    expect(() =>
      takeOutPolicy(createInsuranceState(), {
        ...POLICY,
        limitMinor: POLICY.insuredValueMinor + 1,
      }),
    ).toThrow(/limit/);
    expect(() =>
      takeOutPolicy(createInsuranceState(), { ...POLICY, id: "" }),
    ).toThrow(/id/);
  });

  it("varies a policy immutably and revalidates its limits", () => {
    const state = takeOutPolicy(createInsuranceState(), POLICY);
    const varied = varyPolicy(state, POLICY.id, {
      deductibleMinor: 3_000_000,
      limitMinor: 50_000_000,
    });
    expect(varied.policies[0]).toMatchObject({
      deductibleMinor: 3_000_000,
      limitMinor: 50_000_000,
    });
    expect(state.policies[0]).toEqual(POLICY);
    expect(() =>
      varyPolicy(state, POLICY.id, {
        limitMinor: POLICY.insuredValueMinor + 1,
      }),
    ).toThrow(/limit/);
  });

  it("cancels only a known policy", () => {
    const state = takeOutPolicy(createInsuranceState(), POLICY);
    expect(cancelPolicy(state, POLICY.id).policies).toEqual([]);
    expect(() => cancelPolicy(state, "policy.missing")).toThrow(/unknown/);
  });
});
