import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_LAG_DAYS,
  attributedEffectBasisPoints,
  campaignEffectBasisPoints,
  campaignReach,
  campaignUncertaintyBand,
  channelAvailable,
  createCampaign,
  finishExpiredCampaigns,
  realisedEffectBasisPoints,
  registerCampaign,
} from "./campaigns";
import {
  addLead,
  advanceLead,
  committedShareBasisPoints,
  contractProfitabilityMinor,
  createSalesState,
  negotiatedDiscountBasisPoints,
  rateForAccountMinor,
  setRenewalIntent,
  signContract,
} from "./salesPipeline";
import {
  createCrmState,
  marketableGuestIds,
  recordPreference,
  recordStay,
  repeatGuestIds,
  setConsent,
  STAY_HISTORY_LIMIT,
} from "./crm";
import {
  burnPoints,
  createLoyaltyState,
  crossHotelSettlementMinor,
  earnPoints,
  memberFor,
  POINT_VALUE_MINOR,
  releaseBreakageMinor,
  tierBenefits,
  tierForNights,
} from "./loyalty";
import { XorShift32 } from "../domain/rng";

const CAMPAIGN = {
  id: "campaign.spring",
  objective: "occupancy" as const,
  targetSegmentId: "segment.business",
  channel: "print" as const,
  startDateKey: "1991-03-01",
  durationDays: 30,
  budgetMinor: 400_000,
  creativeQuality: 70,
};

describe("campaigns", () => {
  it("gates a channel on the world catching up, not on the calendar", () => {
    expect(channelAvailable("print", {})).toBe(true);
    expect(channelAvailable("onlineListing", {})).toBe(false);
    expect(channelAvailable("onlineListing", { internet: 1500 })).toBe(true);
  });

  it("buys reach and frequency with the budget, capped by the audience", () => {
    const campaign = createCampaign(CAMPAIGN);
    const small = campaignReach(campaign, 1_000);
    expect(small.reach).toBe(1_000);
    // Ten thousand contacts over a thousand people would be ten exposures
    // each; the reported frequency is capped at five, because nobody is
    // actually being reached a tenth time.
    expect(small.frequencyBasisPoints).toBe(50_000);
    const large = campaignReach(campaign, 1_000_000);
    expect(large.reach).toBe(10_000);
    expect(large.frequencyBasisPoints).toBe(10_000);
  });

  it("saturates: buying the same eyes again and again stops paying", () => {
    const cheap = createCampaign({ ...CAMPAIGN, budgetMinor: 400_000 });
    const lavish = createCampaign({ ...CAMPAIGN, budgetMinor: 4_000_000 });
    const effect = (c: ReturnType<typeof createCampaign>) =>
      campaignEffectBasisPoints(c, 5_000);
    expect(effect(lavish)).toBeGreaterThan(effect(cheap));
    expect(effect(lavish)).toBeLessThan(effect(cheap) * 10);
  });

  it("rewards the work as well as the money", () => {
    const good = createCampaign({ ...CAMPAIGN, creativeQuality: 90 });
    const poor = createCampaign({ ...CAMPAIGN, creativeQuality: 20 });
    expect(campaignEffectBasisPoints(good, 5_000)).toBeGreaterThan(
      campaignEffectBasisPoints(poor, 5_000),
    );
  });

  it("attributes nothing before the lag and nothing after the run", () => {
    const campaign = createCampaign(CAMPAIGN);
    expect(attributedEffectBasisPoints(campaign, 5_000, 0)).toBe(0);
    expect(
      attributedEffectBasisPoints(campaign, 5_000, ATTRIBUTION_LAG_DAYS - 1),
    ).toBe(0);
    expect(
      attributedEffectBasisPoints(campaign, 5_000, ATTRIBUTION_LAG_DAYS),
    ).toBeGreaterThan(0);
    expect(
      attributedEffectBasisPoints(
        campaign,
        5_000,
        ATTRIBUTION_LAG_DAYS + campaign.durationDays,
      ),
    ).toBe(0);
  });

  it("quotes the effect as a band and draws the outcome from the economy", () => {
    const band = campaignUncertaintyBand(1_000, 3000);
    expect(band).toEqual({ low: 700, base: 1_000, high: 1_300 });
    const realised = realisedEffectBasisPoints(band, new XorShift32(5));
    expect(realised).toBeGreaterThanOrEqual(band.low);
    expect(realised).toBeLessThanOrEqual(band.high);
    // The same seed gives the same outcome; the uncertainty is modelled, not
    // re-rolled every time somebody looks at it.
    expect(realisedEffectBasisPoints(band, new XorShift32(5))).toBe(realised);
  });

  it("finishes a campaign only once its lagged effect is spent", () => {
    const campaigns = registerCampaign([], createCampaign(CAMPAIGN));
    expect(
      finishExpiredCampaigns(campaigns, { "campaign.spring": 30 })[0].status,
    ).toBe("running");
    expect(
      finishExpiredCampaigns(campaigns, {
        "campaign.spring": 30 + ATTRIBUTION_LAG_DAYS,
      })[0].status,
    ).toBe("finished");
  });

  it("refuses a campaign with no duration or a fractional budget", () => {
    expect(() => createCampaign({ ...CAMPAIGN, durationDays: 0 })).toThrow(
      /duration/,
    );
    expect(() => createCampaign({ ...CAMPAIGN, budgetMinor: 1.5 })).toThrow(
      /budget/,
    );
  });
});

const CONTRACT = {
  id: "contract.hoechst",
  accountName: "Hoechst AG",
  segmentId: "segment.business",
  negotiatedRateMinor: 9_000,
  expectedRoomNights: 900,
  concessions: ["breakfast"],
  validFromDateKey: "1991-04-01",
  validToDateKey: "1992-04-01",
  renewalIntent: "unknown" as const,
};

describe("the sales pipeline", () => {
  it("moves a lead forward through the pipeline and never back", () => {
    let state = addLead(createSalesState(), {
      id: "lead.hoechst",
      accountName: "Hoechst AG",
      segmentId: "segment.business",
      expectedRoomNights: 900,
      stage: "lead",
    });
    state = advanceLead(state, "lead.hoechst", "qualified");
    expect(state.leads[0].stage).toBe("qualified");
    expect(() => advanceLead(state, "lead.hoechst", "lead")).toThrow(
      /backwards/,
    );
    // Losing a lead is always allowed, from wherever it got to.
    expect(advanceLead(state, "lead.hoechst", "lost").leads[0].stage).toBe(
      "lost",
    );
  });

  it("refuses to reopen a decided lead", () => {
    let state = addLead(createSalesState(), {
      id: "lead.hoechst",
      accountName: "Hoechst AG",
      segmentId: "segment.business",
      expectedRoomNights: 900,
      stage: "won",
    });
    expect(() => advanceLead(state, "lead.hoechst", "proposed")).toThrow(
      /already won/,
    );
    state = createSalesState();
    expect(() => advanceLead(state, "lead.missing", "won")).toThrow(/unknown/);
  });

  it("charges the account its negotiated rate, whatever the house is asking", () => {
    const state = signContract(createSalesState(), CONTRACT);
    expect(rateForAccountMinor(state, "Hoechst AG", "1991-06-01", 15_000)).toBe(
      9_000,
    );
    // Outside the contract's dates the account pays what everybody pays.
    expect(rateForAccountMinor(state, "Hoechst AG", "1993-06-01", 15_000)).toBe(
      15_000,
    );
    expect(
      rateForAccountMinor(state, "Somebody Else", "1991-06-01", 15_000),
    ).toBe(15_000);
  });

  it("shows an account that is not worth having", () => {
    const good = contractProfitabilityMinor(CONTRACT, {
      variableCostPerNightMinor: 3_000,
      concessionCostMinor: 1_000,
    });
    expect(good).toBe(4_500_000);
    const bad = contractProfitabilityMinor(
      { ...CONTRACT, negotiatedRateMinor: 3_000 },
      { variableCostPerNightMinor: 3_000, concessionCostMinor: 1_000 },
    );
    expect(bad).toBeLessThan(0);
  });

  it("says how much of the year is already committed", () => {
    const state = signContract(createSalesState(), CONTRACT);
    expect(committedShareBasisPoints(state, "1991-06-01", 9_000)).toBe(1_000);
    expect(committedShareBasisPoints(state, "1993-06-01", 9_000)).toBe(0);
    expect(committedShareBasisPoints(state, "1991-06-01", 0)).toBe(0);
  });

  it("records the discount and the renewal intent for the record", () => {
    const state = signContract(createSalesState(), CONTRACT);
    expect(negotiatedDiscountBasisPoints(CONTRACT, 12_000)).toBe(2_500);
    expect(
      setRenewalIntent(state, "contract.hoechst", "leaving").contracts[0]
        .renewalIntent,
    ).toBe("leaving");
    expect(() => setRenewalIntent(state, "contract.none", "renewing")).toThrow(
      /unknown/,
    );
  });

  it("refuses a contract that ends before it starts", () => {
    expect(() =>
      signContract(createSalesState(), {
        ...CONTRACT,
        validToDateKey: "1991-01-01",
      }),
    ).toThrow(/after it starts/);
  });
});

describe("CRM and consent", () => {
  it("keeps nothing about a guest who has not consented to it", () => {
    let state = recordStay(createCrmState(), {
      guestId: "guest.1",
      stayId: "stay.1",
    });
    expect(state.profiles[0].consent).toBe("none");
    expect(() => recordPreference(state, "guest.1", "high-floor")).toThrow(
      /not consented/,
    );
    state = setConsent(state, "guest.1", "service");
    state = recordPreference(state, "guest.1", "high-floor");
    expect(state.profiles[0].preferences).toEqual(["high-floor"]);
  });

  it("forgets preferences when consent is withdrawn", () => {
    let state = recordStay(createCrmState(), {
      guestId: "guest.1",
      stayId: "stay.1",
    });
    state = setConsent(state, "guest.1", "marketing");
    state = recordPreference(state, "guest.1", "high-floor");
    state = setConsent(state, "guest.1", "none");
    expect(state.profiles[0].preferences).toEqual([]);
    // The stay itself is still known: the hotel has to know who slept there.
    expect(state.profiles[0].stayHistory).toEqual(["stay.1"]);
  });

  it("lets marketing reach only the guests who agreed to it", () => {
    let state = recordStay(createCrmState(), {
      guestId: "guest.1",
      stayId: "stay.1",
    });
    state = recordStay(state, { guestId: "guest.2", stayId: "stay.2" });
    state = setConsent(state, "guest.2", "marketing");
    state = setConsent(state, "guest.1", "service");
    expect(marketableGuestIds(state)).toEqual(["guest.2"]);
  });

  it("counts a repeat guest by stays, and bounds the history it keeps", () => {
    let state = createCrmState();
    for (let i = 0; i < STAY_HISTORY_LIMIT + 5; i += 1)
      state = recordStay(state, { guestId: "guest.1", stayId: `stay.${i}` });
    expect(state.profiles[0].stayHistory).toHaveLength(STAY_HISTORY_LIMIT);
    expect(repeatGuestIds(state)).toEqual(["guest.1"]);
    // Recording the same stay twice is not a second visit.
    const before = state.profiles[0].stayHistory.length;
    state = recordStay(state, { guestId: "guest.1", stayId: "stay.28" });
    expect(state.profiles[0].stayHistory).toHaveLength(before);
  });
});

describe("loyalty", () => {
  it("earns points that are a liability the moment they exist", () => {
    const state = earnPoints(createLoyaltyState(), {
      guestId: "guest.1",
      roomRevenueMinor: 100_000,
      nights: 3,
    });
    expect(memberFor(state, "guest.1")?.points).toBe(1_000);
    expect(state.liabilityMinor).toBe(1_000 * POINT_VALUE_MINOR);
  });

  it("earns a tier by staying, and the tier is worth something", () => {
    expect(tierForNights(0)).toBe("none");
    expect(tierForNights(12)).toBe("silver");
    expect(tierForNights(40)).toBe("gold");
    expect(tierBenefits("gold")).toContain("room-upgrade");
    expect(tierBenefits("none")).toEqual([]);
  });

  it("burns points against the liability, and refuses what is not there", () => {
    const earned = earnPoints(createLoyaltyState(), {
      guestId: "guest.1",
      roomRevenueMinor: 100_000,
      nights: 3,
    });
    const burnt = burnPoints(earned, { guestId: "guest.1", points: 400 });
    expect(burnt.costMinor).toBe(400 * POINT_VALUE_MINOR);
    expect(memberFor(burnt.state, "guest.1")?.points).toBe(600);
    expect(burnt.state.liabilityMinor).toBe(600 * POINT_VALUE_MINOR);
    expect(() =>
      burnPoints(burnt.state, { guestId: "guest.1", points: 601 }),
    ).toThrow(/not earned/);
    expect(() =>
      burnPoints(burnt.state, { guestId: "guest.2", points: 1 }),
    ).toThrow(/unknown/);
  });

  it("releases breakage as a named amount, never as a silent drift", () => {
    const earned = earnPoints(createLoyaltyState(), {
      guestId: "guest.1",
      roomRevenueMinor: 1_000_000,
      nights: 3,
    });
    const released = releaseBreakageMinor(earned);
    expect(released.releasedMinor).toBeGreaterThan(0);
    expect(released.state.liabilityMinor).toBe(
      earned.liabilityMinor - released.releasedMinor,
    );
  });

  it("settles between hotels when points cross the group", () => {
    expect(
      crossHotelSettlementMinor({
        earnedAtHotelId: "hotel.a",
        burntAtHotelId: "hotel.b",
        costMinor: 4_000,
      }),
    ).toEqual({
      fromHotelId: "hotel.a",
      toHotelId: "hotel.b",
      amountMinor: 4_000,
    });
    expect(
      crossHotelSettlementMinor({
        earnedAtHotelId: "hotel.a",
        burntAtHotelId: "hotel.a",
        costMinor: 4_000,
      }),
    ).toBeNull();
  });
});
