import type { GameState } from "../simulation/initialState";
import type { DomainEventPayload } from "../domain/events";
import type { NarrativeOutcomeEffect } from "./outcomes";
import { commandsForNarrativeChoice } from "./outcomes";
import { eligibleEvents, selectNarrativeEvent } from "./eventEngine";
import {
  NARRATIVE_CHOICE_EFFECTS,
  NARRATIVE_DEFINITIONS,
  OPPORTUNITY_STAKE_MINOR,
  OPPORTUNITY_YEARS,
} from "../content/1991/narrative";
import { resolveInvestmentOutcome } from "./strategicOpportunities";
import { incidentReach, mediaFromAdoption } from "../media/mediaLandscape";
import { applyRivalInteraction } from "../rivals/relationships";
import { applyReputationEvent, reputationFor } from "../reputation/dimensions";
import { appendChronicleEntry } from "../chronicle/chronicle";
import { eligiblePromotions, promote } from "../people/careerProgression";
import { compareIds } from "../domain/ids";
import { careerFacts } from "../campaign/recovery";
import { assessCareerOutcome } from "../campaign/careerOutcome";

export interface NarrativeContext {
  emit(payload: DomainEventPayload, entities: readonly string[]): void;
  spend(amountMinor: number, account: string, memo: string): void;
  earn(amountMinor: number, account: string, memo: string): void;
}

/** A stream of whole numbers; the caller owns which RNG stream it is. */
export interface RollSource {
  nextUint32(): number;
}

export type Verdict = { ok: true } | { ok: false; reason: string };

/**
 * What the world currently looks like to a story. Every fact is read from
 * authoritative state and is a whole number, so an event fires because the
 * hotel really is full and really is being talked about.
 */
export function narrativeFacts(state: GameState): Record<string, number> {
  const severity = Math.max(0, 100 - state.guestSatisfaction.score);
  return {
    occupancyBasisPoints: state.metrics.occupancyBasisPoints,
    guestSatisfaction: state.guestSatisfaction.score,
    mediaReach: incidentReach(state.narrative.media, severity),
    hotelCount: state.company.portfolio.hotelIds.length,
    year: Number(state.calendar.dateKey.slice(0, 4)),
    cashMinor: state.finance.cashMinor,
    internetAdoptionBp: adoptionBp(state, "internet"),
  };
}

/**
 * The narrative month. Media reach follows real technology adoption, standing
 * follows what the company has actually done, rivals remember how it competes,
 * key staff age into their careers, and at most one story is raised — from a
 * seeded draw, so the same world always tells the same story.
 */
export function runNarrativeMonth(
  state: GameState,
  rolls: RollSource,
  ctx: NarrativeContext,
): void {
  const n = state.narrative;
  refreshMedia(state);
  refreshPrestige(state);
  refreshRivals(state);
  refreshKeyPeople(state);
  resolveDueOpportunities(state, ctx);

  const eligible = eligibleEvents(
    NARRATIVE_DEFINITIONS,
    narrativeFacts(state),
    n.lastFiredByDefinition,
    state.calendar.dateKey,
  ).filter((d) => !n.activeEvents.some((e) => e.definitionId === d.id));
  // The draw is taken whether or not anything is eligible, so the stream
  // advances identically in every replay of the same world.
  const draw = rolls.nextUint32() % 10_000;
  const chosen = selectNarrativeEvent(eligible, draw);
  if (!chosen) return;
  const id = `narrative.${state.calendar.dateKey}.${chosen.id}`;
  n.activeEvents = [
    ...n.activeEvents,
    {
      id,
      definitionId: chosen.id,
      triggeredDateKey: state.calendar.dateKey,
      choices: chosen.choices.map((c) => ({ ...c })),
    },
  ].sort((a, b) => compareIds(a.id, b.id));
  n.lastFiredByDefinition = {
    ...n.lastFiredByDefinition,
    [chosen.id]: state.calendar.dateKey,
  };
  ctx.emit(
    { type: "NARRATIVE_EVENT_RAISED", eventId: id, definitionId: chosen.id },
    [id],
  );
}

export function validateNarrativeChoice(
  state: GameState,
  eventId: string,
  choiceId: string,
): Verdict {
  const event = state.narrative.activeEvents.find((e) => e.id === eventId);
  if (!event) return { ok: false, reason: "unknown story" };
  if (!event.choices.some((c) => c.id === choiceId))
    return { ok: false, reason: "unknown choice" };
  if (!NARRATIVE_CHOICE_EFFECTS[`${event.definitionId}:${choiceId}`])
    return { ok: false, reason: "the choice has no modelled consequence" };
  return { ok: true };
}

/**
 * Carries out a decision. The story does not move money or standing itself: it
 * produces effects, and the finance and reputation systems that own those
 * things are the ones that post them.
 */
export function resolveNarrativeChoice(
  state: GameState,
  eventId: string,
  choiceId: string,
  ctx: NarrativeContext,
): void {
  const verdict = validateNarrativeChoice(state, eventId, choiceId);
  if (!verdict.ok) throw new Error(verdict.reason);
  const n = state.narrative;
  const event = n.activeEvents.find((e) => e.id === eventId)!;
  const effect = NARRATIVE_CHOICE_EFFECTS[`${event.definitionId}:${choiceId}`];
  const effects = commandsForNarrativeChoice(
    choiceId === "decline"
      ? { kind: "decline", reputationDelta: effect.reputationDelta }
      : {
          kind: "compensate-displaced-guests",
          costMinor: effect.costMinor,
          reputationDelta: effect.reputationDelta,
        },
  );
  applyNarrativeEffects(state, effects, ctx, event.definitionId);
  if (event.definitionId === "narrative.digital-bet" && choiceId !== "decline")
    n.opportunities = [
      ...n.opportunities,
      {
        id: `opportunity.${eventId}`,
        openedDateKey: state.calendar.dateKey,
        resolveDateKey: `${Number(state.calendar.dateKey.slice(0, 4)) + OPPORTUNITY_YEARS}${state.calendar.dateKey.slice(4)}`,
        investedMinor: OPPORTUNITY_STAKE_MINOR,
        companyValueMultiplierBasisPoints: 0,
        status: "invested",
      },
    ];
  n.activeEvents = n.activeEvents.filter((e) => e.id !== eventId);
  n.chronicle = appendChronicleEntry(n.chronicle, {
    id: `${eventId}.${choiceId}`,
    date: state.calendar.dateKey,
    scope: "company",
    textKey: `chronicle.${event.definitionId}.${choiceId}`,
  });
  ctx.emit(
    {
      type: "NARRATIVE_EVENT_RESOLVED",
      eventId,
      definitionId: event.definitionId,
      choiceId,
    },
    [eventId],
  );
}

export function applyNarrativeEffects(
  state: GameState,
  effects: readonly NarrativeOutcomeEffect[],
  ctx: NarrativeContext,
  cause: string,
): void {
  for (const effect of effects) {
    if (effect.type === "POST_EXPENSE") {
      ctx.spend(effect.amountMinor, effect.category, `story: ${cause}`);
      continue;
    }
    state.reputation = applyReputationEvent(state.reputation, {
      dimension: effect.dimension,
      scopeId: state.hotel.id,
      delta: effect.delta,
      cause: `story: ${cause}`,
      atMinutes: state.elapsedMinutes,
    });
  }
}

/** The career reading, taken from the position the company is actually in. */
export function refreshCareerOutcome(state: GameState): void {
  state.narrative.career = assessCareerOutcome(careerFacts(state));
}

const adoptionBp = (state: GameState, id: string) =>
  state.world.technologies.find((t) => t.id === id)?.adoptionBp ?? 0;

function refreshMedia(state: GameState): void {
  // Review sites ride on the internet, social media on the smartphone. The
  // decade the player is in is a consequence of adoption, never of the date.
  state.narrative.media = mediaFromAdoption(
    adoptionBp(state, "internet"),
    adoptionBp(state, "smartphone"),
  );
}

/**
 * A bet placed years ago, answered now. What it is worth is read from how far
 * the technology it backed actually went in this world, so there was never a
 * right answer to be guessed at the time it was taken.
 */
function resolveDueOpportunities(
  state: GameState,
  ctx: NarrativeContext,
): void {
  const n = state.narrative;
  for (const opportunity of n.opportunities)
    if (
      opportunity.status === "invested" &&
      opportunity.resolveDateKey <= state.calendar.dateKey
    ) {
      const multiplier = 10_000 + adoptionBp(state, "internet");
      const outcome = resolveInvestmentOutcome({
        investedMinor: opportunity.investedMinor,
        companyValueMultiplierBasisPoints: multiplier,
      });
      opportunity.status = "resolved";
      opportunity.companyValueMultiplierBasisPoints = multiplier;
      // The stake was paid when the bet was taken; only the return moves now.
      if (outcome + opportunity.investedMinor > 0)
        ctx.earn(
          outcome + opportunity.investedMinor,
          "investment",
          `return on ${opportunity.id}`,
        );
      n.chronicle = appendChronicleEntry(n.chronicle, {
        id: `${opportunity.id}.resolved`,
        date: state.calendar.dateKey,
        scope: "company",
        textKey:
          outcome >= 0
            ? "chronicle.opportunity.paid-off"
            : "chronicle.opportunity.written-off",
      });
    }
}

function refreshPrestige(state: GameState): void {
  const n = state.narrative;
  const hotel = reputationFor(state.reputation, "hotel", state.hotel.id).score;
  const earned = n.achievedMilestones.length * 5;
  n.prestige = {
    personal: clampScore(earned),
    company: clampScore(hotel - 50 + earned),
    causes: n.achievedMilestones.slice(-8),
  };
}

/**
 * What the rivals make of how the player competes. Undercutting the city by a
 * wide margin is a price war whether or not it was meant as one, and it is
 * remembered.
 */
function refreshRivals(state: GameState): void {
  const operating = state.competitors.filter((c) => c.status !== "exit");
  if (operating.length === 0 || state.metrics.adrMinor <= 0) return;
  const marketRate = Math.trunc(
    operating.reduce((sum, c) => sum + c.rateMinor, 0) / operating.length,
  );
  if (state.metrics.adrMinor >= Math.trunc((marketRate * 8500) / 10_000))
    return;
  const year = Number(state.calendar.dateKey.slice(0, 4));
  state.narrative.rivals = state.narrative.rivals.map((rival) =>
    rival.active
      ? {
          ...rival,
          relationship: applyRivalInteraction(rival.relationship, {
            kind: "price-war",
            year,
          }),
        }
      : rival,
  );
}

/**
 * Long careers. Everybody on a permanent contract becomes somebody the company
 * knows; time in the job is experience, and a promotion is earned rather than
 * announced.
 */
function refreshKeyPeople(state: GameState): void {
  const n = state.narrative;
  const roleOf = (staffId: string) =>
    state.staff.find((s) => s.id === staffId)?.role ?? "staff";
  const working = state.workforce.employees
    .filter((e) => e.status === "working")
    .sort((a, b) => compareIds(a.id, b.id));

  const byStaffId = new Map(n.keyPeople.map((p) => [p.staffId, p]));
  const next = working.map((employee) => {
    const existing = byStaffId.get(employee.staffId);
    const person = existing ?? {
      id: `person.${employee.staffId}`,
      staffId: employee.staffId,
      role: roleOf(employee.staffId),
      experience: 0,
      leadership: 0,
      monthsInRole: 0,
      careerHistory: [],
    };
    const monthsInRole = person.monthsInRole + 1;
    const grown = {
      ...person,
      monthsInRole,
      experience: clampScore(Math.trunc(monthsInRole / 2) + employee.skill / 2),
      leadership: clampScore(
        Math.trunc(monthsInRole / 3) + employee.trainingCompleted.length * 5,
      ),
    };
    const [promotion] = eligiblePromotions(grown);
    return promotion
      ? promote(grown, promotion, state.calendar.dateKey)
      : grown;
  });
  n.keyPeople = next.sort((a, b) => compareIds(a.id, b.id));
}

const clampScore = (value: number) =>
  Math.max(0, Math.min(100, Math.trunc(value)));
