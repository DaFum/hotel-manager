import { existsSync, statSync } from "node:fs";

export interface AcceptanceRequirement {
  id: number;
  name: string;
  masterChapters: string[];
  implementationEvidence: string[];
  automatedEvidence: string[];
  reviewedEvidence?: string[];
}

const rows: readonly [number, string, string[], string, string][] = [
  [
    1,
    "Booking/reservation/distribution",
    ["6"],
    "src/game/bookings/bookingEngine.ts",
    "src/game/bookings/bookingEngine.test.ts",
  ],
  [
    2,
    "Revenue management",
    ["7"],
    "src/game/revenue/revenuePolicy.ts",
    "src/game/revenue/revenuePolicy.test.ts",
  ],
  [
    3,
    "Complete guest model",
    ["8"],
    "src/game/guests/guestJourney.ts",
    "src/game/guests/guestJourney.test.ts",
  ],
  [
    4,
    "Financial system",
    ["22"],
    "src/game/finance/statements.ts",
    "src/game/finance/statements.test.ts",
  ],
  [
    5,
    "Purchasing/inventory/suppliers",
    ["19"],
    "src/game/purchasing/inventory.ts",
    "src/game/purchasing/inventory.test.ts",
  ],
  [
    6,
    "Staff/labor market",
    ["18"],
    "src/game/staff/staffing.ts",
    "src/game/staff/staffing.test.ts",
  ],
  [
    7,
    "Construction/renovation/maintenance",
    ["10", "17"],
    "src/game/renovation/projects.ts",
    "src/game/renovation/projects.test.ts",
  ],
  [
    8,
    "Classification/brand standards",
    ["21", "43"],
    "src/game/classification/quality.ts",
    "src/game/classification/quality.test.ts",
  ],
  [
    9,
    "Calendar/season/demand",
    ["5"],
    "src/game/city/demand.ts",
    "src/game/city/demand.test.ts",
  ],
  [
    10,
    "Competitor AI",
    ["33"],
    "src/game/competitors/month.ts",
    "src/game/competitors/month.test.ts",
  ],
  [
    11,
    "Group/expansion",
    ["28", "40-44"],
    "src/game/company/companyState.ts",
    "src/game/company/company.integration.test.ts",
  ],
  [
    12,
    "Start/difficulty/career end",
    ["4"],
    "src/game/campaign/campaignConfig.ts",
    "src/game/campaign/campaignConfig.test.ts",
  ],
  [
    13,
    "Alternative history",
    ["36"],
    "src/game/world/WorldSimulation.ts",
    "src/game/world/WorldSimulation.test.ts",
  ],
  [
    14,
    "Currencies/international expansion",
    ["39"],
    "src/game/currency/exchange.ts",
    "src/game/currency/exchange.test.ts",
  ],
  [
    15,
    "Original parity",
    ["79-81"],
    "docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md",
    "e2e/vertical-slice.spec.ts",
  ],
  [
    16,
    "Singleplayer/spiritual successor",
    ["2.7", "2.10"],
    "docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md",
    "e2e/vertical-slice.spec.ts",
  ],
  [
    17,
    "Command system",
    ["61"],
    "src/game/commands/commandHandler.ts",
    "src/game/commands/commandHandler.test.ts",
  ],
  [
    18,
    "Numeric rules",
    ["65"],
    "src/game/domain/money.ts",
    "src/game/finance/monthlyClose.test.ts",
  ],
  [
    19,
    "Web Worker",
    ["66"],
    "src/game/simulation/simulation.worker.ts",
    "e2e/vertical-slice.spec.ts",
  ],
  [
    20,
    "Isometric world",
    ["55"],
    "src/render/PixiHotelScene.ts",
    "e2e/vertical-slice.spec.ts",
  ],
  [
    21,
    "Onboarding/accessibility",
    ["57"],
    "src/ui/onboarding/TutorialCoach.tsx",
    "e2e/accessibility.spec.ts",
  ],
  [
    22,
    "Anti-runaway balancing",
    ["34", "77"],
    "src/game/world/macro.ts",
    "src/game/world/macro.test.ts",
  ],
  [
    23,
    "Sales/Marketing/CRM/Loyalty",
    ["25"],
    "src/game/commercial/commercialState.ts",
    "src/game/commercial/commercial.test.ts",
  ],
  [
    24,
    "Front-office/housekeeping state machine",
    ["9"],
    "src/game/rooms/roomState.ts",
    "src/game/rooms/housekeeping.test.ts",
  ],
  [
    25,
    "F&B operation",
    ["13"],
    "src/game/fnb/breakfastService.ts",
    "src/game/fnb/breakfastService.test.ts",
  ],
  [
    26,
    "Groups/conference/events",
    ["15"],
    "src/game/eventsales/contracts.ts",
    "src/game/eventsales/contracts.test.ts",
  ],
  [
    27,
    "Reservable ancillary services",
    ["14"],
    "src/game/wellness/reservations.ts",
    "src/game/wellness/reservations.test.ts",
  ],
  [
    28,
    "Service recovery",
    ["8.11-8.13"],
    "src/game/guests/complaints.ts",
    "src/game/guests/complaints.test.ts",
  ],
  [
    29,
    "Multidimensional reputation",
    ["26"],
    "src/game/reputation/dimensions.ts",
    "src/game/reputation/dimensions.test.ts",
  ],
  [
    30,
    "Operating models",
    ["23"],
    "src/game/ownership/models.ts",
    "src/game/ownership/models.test.ts",
  ],
  [
    31,
    "Site development/pre-opening",
    ["28"],
    "src/game/development/preOpening.ts",
    "src/game/development/preOpening.test.ts",
  ],
  [
    32,
    "Market research/uncertainty",
    ["29"],
    "src/game/marketResearch/forecast.ts",
    "src/game/marketResearch/forecast.test.ts",
  ],
  [
    33,
    "Insurance/claims",
    ["24"],
    "src/game/risk/insurance.ts",
    "src/game/risk/insurance.test.ts",
  ],
  [
    34,
    "Compliance",
    ["38"],
    "src/game/regulation/compliance.ts",
    "src/game/regulation/compliance.test.ts",
  ],
  [
    35,
    "Transport/accessibility",
    ["31"],
    "src/game/transport/network.ts",
    "src/game/transport/network.test.ts",
  ],
  [
    36,
    "Weather/climate",
    ["5.7", "35"],
    "src/game/world/climate.ts",
    "src/game/world/climate.test.ts",
  ],
  [
    37,
    "Energy/water/supply",
    ["27"],
    "src/game/utilities/consumption.ts",
    "src/game/utilities/consumption.test.ts",
  ],
  [
    38,
    "Manager delegation/governance",
    ["41"],
    "src/game/management/escalation.ts",
    "src/game/management/escalation.test.ts",
  ],
  [
    39,
    "Legal entities",
    ["42"],
    "src/game/company/legalEntities.ts",
    "src/game/company/portfolio.test.ts",
  ],
  [
    40,
    "Hotel day/operating-time logic",
    ["5.2-5.4"],
    "src/game/simulation/clock.ts",
    "src/game/simulation/GameSimulation.test.ts",
  ],
  [
    41,
    "Technology dependencies/standards",
    ["36"],
    "src/game/technology/graph.ts",
    "src/game/technology/graph.test.ts",
  ],
  [
    42,
    "Macro stabilization",
    ["34"],
    "src/game/world/macro.ts",
    "src/game/world/macro.test.ts",
  ],
  [
    43,
    "Other economic actors",
    ["32"],
    "src/game/actors/evolution.ts",
    "src/game/actors/evolution.test.ts",
  ],
  [
    44,
    "Original behavioral parity",
    ["81"],
    "docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md",
    "e2e/hotel-depth.spec.ts",
  ],
  [
    45,
    "Content schema",
    ["70"],
    "src/game/content/corePack.ts",
    "src/game/content/corePack.test.ts",
  ],
  [
    46,
    "Content authoring",
    ["71"],
    "src/tools/content-editor/ContentEditorApp.tsx",
    "e2e/content-editor.spec.ts",
  ],
  [
    47,
    "Observability/replay",
    ["74"],
    "scripts/replay-plans-01-03.ts",
    "fixtures/replay/plans-01-03.json",
  ],
  [
    48,
    "Worker protocol",
    ["67"],
    "src/game/domain/protocol.ts",
    "src/game/domain/protocol.test.ts",
  ],
  [
    49,
    "Performance budgets",
    ["75"],
    "scripts/benchmark-all.ts",
    "e2e/performance-smoke.spec.ts",
  ],
  [
    50,
    "Save/content versioning",
    ["72.6-72.8"],
    "src/game/persistence/saveSchema.ts",
    "src/game/persistence/migrations/v7-to-v8.test.ts",
  ],
  [
    51,
    "Localization",
    ["78"],
    "src/ui/localization.ts",
    "e2e/localization.spec.ts",
  ],
  [
    52,
    "Audio/feedback",
    ["58"],
    "src/audio/audioEngine.ts",
    "src/audio/audioEngine.test.ts",
  ],
  [
    53,
    "Notification management",
    ["54"],
    "src/ui/notifications/notificationPreferences.ts",
    "src/ui/notifications/notificationPreferences.test.ts",
  ],
  [
    54,
    "Scope/non-goals",
    ["82"],
    "docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md",
    "src/release/plans0103Conformance.test.ts",
  ],
];

const reviewed = new Set([15, 16, 44, 54]);
export const RELEASE_ACCEPTANCE: readonly AcceptanceRequirement[] = rows.map(
  ([id, name, masterChapters, implementation, automated]) => ({
    id,
    name,
    masterChapters,
    implementationEvidence: [implementation],
    automatedEvidence: [automated],
    ...(reviewed.has(id)
      ? {
          reviewedEvidence: [
            "docs/superpowers/plans/2026-08-09-MASTER-spec-coverage-audit.md",
          ],
        }
      : {}),
  }),
);

function isConcreteFile(target: string): boolean {
  return (
    !target.includes("*") && existsSync(target) && statSync(target).isFile()
  );
}

export const resolveConcreteImplementationTarget = isConcreteFile;
export const resolveConcreteAutomatedTarget = isConcreteFile;
