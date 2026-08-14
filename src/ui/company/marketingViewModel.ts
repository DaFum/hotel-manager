import type { GameState } from "../../game/simulation/initialState";
import { activeContracts } from "../../game/commercial/salesPipeline";
import { marketableGuestIds, repeatGuestIds } from "../../game/commercial/crm";
import {
  campaignEffectBasisPoints,
  campaignUncertaintyBand,
} from "../../game/commercial/campaigns";
import { GUEST_SEGMENTS } from "../../game/content/1991/guestSegments";
import { MEDIA_CHANNELS, incidentReach } from "../../game/media/mediaLandscape";
import { addDays } from "../../game/domain/calendar";

export function salesPipelineView(state: GameState) {
  return {
    leads: state.commercial.sales.leads.map((x) => ({ ...x })),
    contracts: state.commercial.sales.contracts.map((x) => ({
      ...x,
      active: activeContracts(
        state.commercial.sales,
        state.calendar.dateKey,
      ).some((a) => a.id === x.id),
    })),
  };
}
export function crmConsentView(state: GameState) {
  const profiles = state.commercial.crm.profiles;
  return {
    profiles: profiles.length,
    consent: {
      none: profiles.filter((x) => x.consent === "none").length,
      service: profiles.filter((x) => x.consent === "service").length,
      marketing: profiles.filter((x) => x.consent === "marketing").length,
    },
    marketable: marketableGuestIds(state.commercial.crm).length,
    repeat: repeatGuestIds(state.commercial.crm).length,
  };
}
export function audienceReachView(state: GameState) {
  const audience = 40_000;
  const reps = (["brand", "media", "channel"] as const).flatMap((d) =>
    Object.entries(state.reputation[d]).map(([scope, r]) => ({
      dimension: d,
      scope,
      score: r.score,
      cause: r.contributors.at(-1)?.cause ?? null,
    })),
  );
  return {
    media: MEDIA_CHANNELS.map((channel) => ({
      channel,
      reachBp: state.narrative.media[channel],
    })),
    incidentReach: incidentReach(state.narrative.media, 100),
    reputation: reps,
    campaigns: state.commercial.campaigns.map((c) => {
      const effect = campaignEffectBasisPoints(c, audience);
      const band = campaignUncertaintyBand(effect, 2500);
      return {
        id: c.id,
        channel: c.channel,
        segment:
          GUEST_SEGMENTS.find((s) => s.id === c.targetSegmentId)?.nameKey ??
          c.targetSegmentId,
        lowBp: band.lowBasisPoints,
        highBp: band.highBasisPoints,
        influencedBookings: state.reservations.filter(
          (booking) =>
            booking.segmentId === c.targetSegmentId &&
            booking.bookingDateKey >= c.startDateKey &&
            booking.bookingDateKey < addDays(c.startDateKey, c.durationDays),
        ).length,
      };
    }),
  };
}
