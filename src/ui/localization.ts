import type { Phase as RenovationPhase } from "../game/renovation/projects";

export type { RenovationPhase };

export const ENGLISH_TEXT = {
  "trend.digital-booking.name": "Digital booking",
  "macro-credit": "Credit-market pressure",
  "city.frankfurt.name": "Frankfurt",
  "competitor.strategy.budget": "Budget operator",
  "competitor.strategy.luxury": "Luxury house",
  "competitor.strategy.family": "Family hotel",
  "competitor.strategy.lifestyle": "Lifestyle brand",
  "competitor.strategy.aggressive": "Aggressive investor",
  "alert.recovery.noFrontDesk": "Nobody is on the desk to authorise it.",
  "alert.recovery.insufficientCash": "The hotel cannot cover the discount.",
  "alert.cause.unknown": "An operational issue needs attention.",
  "guest.cause.unknown": "No single guest-experience cause was recorded.",
  "guest.cause.longCheckIn": "Long check-in wait",
  "guest.cause.dirtyRoom": "Room was not ready",
  "guest.cause.brokenAsset": "Equipment failed during the stay",
  "guest.cause.breakfastWait": "Breakfast service was delayed",
  "guest.cause.waited too long at reception": "Waited too long at reception",
  "guest.cause.checked in without waiting": "Checked in without waiting",
  "guest.stage.arrival": "arrival",
  "guest.stage.checkIn": "front desk",
  "guest.stage.room": "room",
  "guest.stage.service": "guest service",
  "guest.stage.checkOut": "check-out",
  "segment.business.name": "Business travellers",
  "segment.corporate.name": "Corporate accounts",
  "segment.leisure.name": "Leisure guests",
  "segment.budget.name": "Value-conscious guests",
  "facility.cause.closed": "closed",
  "facility.cause.demand": "current demand",
  "facility.cause.seating": "seating",
  "facility.cause.serviceStaff": "service staff",
  "facility.cause.kitchenLine": "kitchen line",
  "facility.cause.stock": "stock",
  "facility.cause.miseEnPlace": "mise-en-place",
  "facility.cause.transport": "service transport",
  "facility.cause.elevator": "lift capacity",
  "save.loading": "Loading…",
  "save.recovering": "Recovering…",
  "save.loadingMonthly": "Loading monthly autosave…",
  "save.transfer.region": "Save transfer",
  "save.transfer.heading": "Save file transfer",
  "save.transfer.export": "Export save file",
  "save.transfer.import": "Import save file",
  "save.transfer.exported": "Save exported.",
  "save.transfer.imported": "Save imported.",
  "save.transfer.noSave": "No save in",
  "save.transfer.exportFailed": "Export failed",
  "save.transfer.importFailed": "Import failed",

  // --- the campaign and its stories --------------------------------------
  "campaign.setup": "Campaign setup",
  "career.outcome": "Career outcome",
  "campaign.title": "Campaign brief — Frankfurt, 1 January 1991",
  "campaign.difficulty": "Difficulty",
  "campaign.difficulty.beginner": "Beginner",
  "campaign.difficulty.standard": "Standard",
  "campaign.difficulty.expert": "Expert",
  "campaign.capital": "Starting capital",
  "campaign.credit": "Credit spread",
  "campaign.fairness": "Competition: No hidden money or knowledge",
  "story.inbox": "Story inbox",
  "story.inbox.empty": "The telex is quiet.",
  "story.raised": "Raised",
  "chronicle.title": "Company chronicle",
  "chronicle.empty": "No milestones recorded yet.",
  "milestone.title": "Career milestone",
  "milestone.dismiss": "Dismiss",
  "career.title.review": "2026 career review",
  "career.title.distress": "Company distress",
  "career.continue": "Continue endless career",
  "career.restart": "Restart in 1991",
  "career.recovery.refinance": "Draw on the credit line",
  "career.recovery.restructure": "Restructure the company",
  "career.recovery.sell-hotel": "Sell a hotel",
  "career.recovery.investor": "Take an investor",
  "career.recovery.asset-sale": "Sell assets",
  "career.recovery.market-exit": "Leave the market",
  "career.recovery.staff-reduction": "Reduce the roster",
  "career.recovery.turnaround": "Run a turnaround",
  "rival.klara-voss.name": "Klara Voss",
  "brand.mainblick.name": "Mainblick",
  "brand.rheinstern.name": "Rheinstern Collection",
  "hotel.rival.hof.name": "Hotel Am Hof",
  "hotel.rival.taunusblick.name": "Taunusblick",
  "hotel.rival.stern.name": "Pension Stern",
  "room.standard.single.name": "Standard single",
  "room.standard.double.name": "Standard double",
  "room.comfort.double.name": "Comfort double",
  "room.suite.junior.name": "Junior suite",
  "room.renovation.planning": "Planning",
  "room.renovation.approval": "Approval",
  "room.renovation.construction": "Construction",
  "room.renovation.acceptance": "Acceptance",
  "room.renovation.complete": "Reopened",

  "milestone.first-profitable-year": "First profitable year",
  "milestone.second-hotel": "A second hotel",
  "milestone.career-2026": "Thirty-five years in the trade",
  "chronicle.milestone.first-profitable-year":
    "The company finished a year in profit for the first time.",
  "chronicle.milestone.second-hotel": "A second house joined the company.",
  "chronicle.milestone.career-2026":
    "Thirty-five years after Frankfurt, the career reached 2026.",

  "narrative.overbooking-scandal.title": "Guests turned away",
  "narrative.overbooking-scandal.body":
    "The house was oversold and guests were sent elsewhere. The local press is asking about it.",
  "narrative.overbooking-scandal.choice.compensate":
    "Compensate the displaced guests",
  "narrative.overbooking-scandal.choice.decline": "Say nothing",
  "chronicle.narrative.overbooking-scandal.compensate":
    "The house paid for the guests it turned away.",
  "chronicle.narrative.overbooking-scandal.decline":
    "The house let the overbooking story stand.",
  "narrative.press-profile.title": "A travel writer is asking",
  "narrative.press-profile.body":
    "A guide is preparing a profile of the house and would like a stay to write it up.",
  "narrative.press-profile.choice.host": "Host the writer",
  "narrative.press-profile.choice.decline": "Decline the request",
  "chronicle.narrative.press-profile.host": "The house hosted a travel writer.",
  "chronicle.narrative.press-profile.decline":
    "The house turned down a travel profile.",
  "narrative.digital-bet.title": "A stake in an online agency",
  "narrative.digital-bet.body":
    "A small booking agency is looking for capital. Whether it is worth anything depends on how far this technology goes.",
  "narrative.digital-bet.choice.invest": "Take the stake",
  "narrative.digital-bet.choice.decline": "Leave it",
  "chronicle.narrative.digital-bet.compensate":
    "The company took a stake in an online booking agency.",
  "chronicle.narrative.digital-bet.decline":
    "The company passed on an online booking agency.",
  "chronicle.opportunity.paid-off": "An old stake was sold at a profit.",
  "chronicle.opportunity.written-off": "An old stake was written off.",
} as const;

const RENOVATION_PHASE_KEYS: Record<RenovationPhase, string> = {
  planning: "room.renovation.planning",
  approval: "room.renovation.approval",
  construction: "room.renovation.construction",
  acceptance: "room.renovation.acceptance",
  complete: "room.renovation.complete",
};

/** Presentation-only code: stable and readable without exposing a booking id. */
export function guestIdentityCode(guestId: string): string {
  const code = guestId.replace(/^guest\./, "").replace(/[^a-z0-9]+/gi, "-");
  return `G-${code.toUpperCase()}`;
}

export function renovationPhaseKey(phase: RenovationPhase): string {
  return RENOVATION_PHASE_KEYS[phase];
}

export function roomConditionKey(state: string): string {
  return state === "OutOfOrder" || state === "Blocked"
    ? "room.condition.unserviceable"
    : "room.condition.serviceable";
}

export function agentStatusKey(status: string): string {
  return `agent.status.${status}`;
}

const FACILITY_CAUSE_KEYS: Readonly<Record<string, string>> = {
  seating: "facility.cause.seating",
  "staffed throughput": "facility.cause.serviceStaff",
  "portions in stock": "facility.cause.stock",
  "housekeepers on duty": "facility.cause.serviceStaff",
  "clean linen": "facility.cause.stock",
  "machine capacity": "facility.cause.equipment",
  "laundry staff": "facility.cause.serviceStaff",
  "cars in service": "facility.cause.elevator",
  "guards rostered": "facility.cause.serviceStaff",
  "changing room space": "facility.cause.space",
};

export function facilityCauseKey(cause: string): string {
  return cause.startsWith("facility.cause.")
    ? cause
    : (FACILITY_CAUSE_KEYS[cause] ?? "facility.cause.demand");
}

export type LocalizationKey = keyof typeof ENGLISH_TEXT;

/** Presentation-edge lookup until Plan 08 supplies locale-selected catalogs. */
export function translate(key: LocalizationKey): string {
  return ENGLISH_TEXT[key];
}

/**
 * Resolves a key the simulation stored. Authoritative state carries keys, not
 * sentences, so an unknown one is a content gap: it shows as the key rather
 * than as an empty space, which is what makes the gap findable.
 */
export function translateKey(key: string): string {
  return ENGLISH_TEXT[key as LocalizationKey] ?? key;
}

export function translateAlertCause(
  key: string,
  values?: Record<string, string | number>,
): string {
  const template =
    ENGLISH_TEXT[key as LocalizationKey] ?? ENGLISH_TEXT["alert.cause.unknown"];
  if (!values) return template;
  return template.replace(/\{([^}]+)\}/g, (_, k) =>
    String(values[k] ?? `{${k}}`),
  );
}
