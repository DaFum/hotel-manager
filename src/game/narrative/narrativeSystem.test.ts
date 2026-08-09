import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import { QUANTUM_MINUTES } from "../simulation/clock";
import { commandEnvelope, type GameCommand } from "../commands/commandEnvelope";
import { CREDIT_LINE_MINOR } from "../campaign/recovery";

const QUANTA_PER_DAY = 1440 / QUANTUM_MINUTES;

function game(seed = 11): GameSimulation {
  const s = new GameSimulation(createInitialGameState(seed));
  s.refreshDerivedState();
  return s;
}

function submit(s: GameSimulation, payload: GameCommand) {
  // The id comes from the game's own sequence, so a test cannot depend on how
  // many other tests happened to run first.
  return s.submitCommands([
    commandEnvelope({
      commandId: `narrative.cmd.${s.state.commandSequence + 1}`,
      issuedAtMinutes: s.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ])[0];
}

const runDays = (s: GameSimulation, days: number) => {
  for (let d = 0; d < days; d++)
    for (let q = 0; q < QUANTA_PER_DAY; q++) s.advanceQuantum();
};

describe("the narrative in a running game", () => {
  it("raises a story from the month the hotel actually had", () => {
    const s = game();
    runDays(s, 32);
    const [raised] = s.state.narrative.activeEvents;
    expect(raised?.definitionId).toBe("narrative.press-profile");
    // Same world, same story: the draw comes from a seeded stream.
    const twin = game();
    runDays(twin, 32);
    expect(twin.state.narrative.activeEvents).toEqual(
      s.state.narrative.activeEvents,
    );
  });

  it("pays for a decision through the ordinary finance and reputation systems", () => {
    const s = game();
    runDays(s, 32);
    const [raised] = s.state.narrative.activeEvents;
    const cashBefore = s.state.finance.cashMinor;
    const result = submit(s, {
      type: "RESOLVE_NARRATIVE_EVENT",
      eventId: raised.id,
      choiceId: "compensate",
    });

    expect(result.status).toBe("accepted");
    expect(s.state.finance.cashMinor).toBe(cashBefore - 40_000);
    expect(s.state.reputation.hotel[s.state.hotel.id].score).toBeGreaterThan(
      50,
    );
    expect(s.state.narrative.activeEvents).toEqual([]);
    expect(s.state.narrative.chronicle.at(-1)?.textKey).toBe(
      "chronicle.narrative.press-profile.compensate",
    );
    // A story that has been answered cannot be answered again.
    expect(
      submit(s, {
        type: "RESOLVE_NARRATIVE_EVENT",
        eventId: raised.id,
        choiceId: "decline",
      }).status,
    ).toBe("rejected");
  });

  it("moves media reach with adoption and standing with what was achieved", () => {
    const s = game();
    runDays(s, 32);
    const early = s.state.narrative.media;
    expect(early.reviewSites).toBe(0);
    s.state.world.technologies = s.state.world.technologies.map((t) =>
      t.id === "internet" ? { ...t, adoptionBp: 7000 } : t,
    );
    runDays(s, 31);
    expect(s.state.narrative.media.reviewSites).toBe(7000);
    expect(s.state.narrative.keyPeople.length).toBeGreaterThan(0);
  });

  it("offers a measure only while the company is in distress, then takes it", () => {
    const s = game();
    runDays(s, 32);
    expect(s.state.narrative.career.distress).toBe("healthy");
    expect(
      submit(s, { type: "TAKE_RECOVERY_MEASURE", path: "refinance" }).status,
    ).toBe("rejected");

    s.state.finance.payableMinor = s.state.finance.cashMinor + 1_000_000;
    const principalBefore = s.state.loan.principalMinor;
    expect(
      submit(s, { type: "TAKE_RECOVERY_MEASURE", path: "refinance" }).status,
    ).toBe("accepted");
    expect(s.state.loan.principalMinor).toBeGreaterThan(principalBefore);
    expect(s.state.loan.principalMinor).toBeLessThanOrEqual(CREDIT_LINE_MINOR);
    // Measures a later plan owes are refused, never offered as a dead button.
    expect(
      submit(s, { type: "TAKE_RECOVERY_MEASURE", path: "investor" }).status,
    ).toBe("rejected");
  });

  it("lets difficulty be chosen before the first day and never after it", () => {
    const s = game();
    const opening = s.state.finance.cashMinor;
    expect(
      submit(s, { type: "SET_CAMPAIGN_DIFFICULTY", difficulty: "expert" })
        .status,
    ).toBe("accepted");
    // Expert is 7500bp of the standard opening balance, disclosed up front.
    expect(s.state.finance.cashMinor).toBe(
      Math.trunc((opening * 7500) / 10000),
    );
    expect(s.state.loan.annualRateBasisPoints).toBe(1170);
    expect(s.state.narrative.campaign.difficulty).toBe("expert");

    runDays(s, 1);
    expect(
      submit(s, { type: "SET_CAMPAIGN_DIFFICULTY", difficulty: "beginner" })
        .status,
    ).toBe("rejected");
  });

  it("answers an old bet from how far the technology it backed actually went", () => {
    const s = game();
    runDays(s, 2);
    s.state.narrative.opportunities = [
      {
        id: "opportunity.test",
        openedDateKey: "1991-01-01",
        resolveDateKey: "1991-01-15",
        investedMinor: 2_000_000,
        companyValueMultiplierBasisPoints: 0,
        status: "invested",
      },
    ];
    s.state.world.technologies = s.state.world.technologies.map((t) =>
      t.id === "internet" ? { ...t, adoptionBp: 9000 } : t,
    );
    const cashBefore = s.state.finance.cashMinor;
    runDays(s, 31);

    const [resolved] = s.state.narrative.opportunities;
    expect(resolved.status).toBe("resolved");
    // 1.9x the stake, because the technology reached 9000bp in this world.
    expect(s.state.finance.cashMinor - cashBefore).toBeGreaterThan(3_500_000);
    expect(s.state.narrative.chronicle.map((e) => e.textKey)).toContain(
      "chronicle.opportunity.paid-off",
    );
  });

  it("records a profitable year rather than a profitable month", () => {
    const s = game();
    // Two closes into the year: whatever the months did, no year has ended.
    runDays(s, 62);
    expect(s.state.narrative.annualProfit.lastCompletedYearProfitMinor).toBe(0);
    expect(s.state.narrative.achievedMilestones).not.toContain(
      "first-profitable-year",
    );
  });
});
