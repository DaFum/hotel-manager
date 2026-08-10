# Release traceability

This reviewed index mirrors the executable registry. Paths are repository-relative; the registry test proves every implementation and automated target is a concrete file.

## requirement-1: Booking/reservation/distribution

- MASTER: 6
- Implementation: `src/game/bookings/bookingEngine.ts`
- Automated evidence: `src/game/bookings/bookingEngine.test.ts`

## requirement-2: Revenue management

- MASTER: 7
- Implementation: `src/game/revenue/revenuePolicy.ts`
- Automated evidence: `src/game/revenue/revenuePolicy.test.ts`

## requirement-3: Complete guest model

- MASTER: 8
- Implementation: `src/game/guests/guestJourney.ts`
- Automated evidence: `src/game/guests/guestJourney.test.ts`

## requirement-4: Financial system

- MASTER: 22
- Implementation: `src/game/finance/statements.ts`
- Automated evidence: `src/game/finance/statements.test.ts`

## requirement-5: Purchasing/inventory/suppliers

- MASTER: 19
- Implementation: `src/game/purchasing/inventory.ts`
- Automated evidence: `src/game/purchasing/inventory.test.ts`

## requirement-6: Staff/labor market

- MASTER: 18
- Implementation: `src/game/staff/staffing.ts`
- Automated evidence: `src/game/staff/staffing.test.ts`

## requirement-7: Construction/renovation/maintenance

- MASTER: 10, 17
- Implementation: `src/game/renovation/projects.ts`
- Automated evidence: `src/game/renovation/projects.test.ts`

## requirement-8: Classification/brand standards

- MASTER: 21, 43
- Implementation: `src/game/classification/quality.ts`
- Automated evidence: `src/game/classification/quality.test.ts`

## requirement-9: Calendar/season/demand

- MASTER: 5
- Implementation: `src/game/city/demand.ts`
- Automated evidence: `src/game/city/demand.test.ts`

## requirement-10: Competitor AI

- MASTER: 33
- Implementation: `src/game/competitors/month.ts`
- Automated evidence: `src/game/competitors/month.test.ts`

## requirement-11: Group/expansion

- MASTER: 28, 40-44
- Implementation: `src/game/company/companyState.ts`
- Automated evidence: `src/game/company/company.integration.test.ts`

## requirement-12: Start/difficulty/career end

- MASTER: 4
- Implementation: `src/game/campaign/campaignConfig.ts`
- Automated evidence: `src/game/campaign/campaignConfig.test.ts`

## requirement-13: Alternative history

- MASTER: 36
- Implementation: `src/game/world/WorldSimulation.ts`
- Automated evidence: `src/game/world/WorldSimulation.test.ts`

## requirement-14: Currencies/international expansion

- MASTER: 39
- Implementation: `src/game/currency/exchange.ts`
- Automated evidence: `src/game/currency/exchange.test.ts`

## requirement-15: Original parity

- MASTER: 79-81
- Implementation: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`
- Automated evidence: `e2e/vertical-slice.spec.ts`
- Reviewed evidence: `docs/superpowers/plans/2026-08-09-MASTER-spec-coverage-audit.md`

## requirement-16: Singleplayer/spiritual successor

- MASTER: 2.7, 2.10
- Implementation: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`
- Automated evidence: `e2e/vertical-slice.spec.ts`
- Reviewed evidence: `docs/superpowers/plans/2026-08-09-MASTER-spec-coverage-audit.md`

## requirement-17: Command system

- MASTER: 61
- Implementation: `src/game/commands/commandHandler.ts`
- Automated evidence: `src/game/commands/commandHandler.test.ts`

## requirement-18: Numeric rules

- MASTER: 65
- Implementation: `src/game/domain/money.ts`
- Automated evidence: `src/game/finance/monthlyClose.test.ts`

## requirement-19: Web Worker

- MASTER: 66
- Implementation: `src/game/simulation/simulation.worker.ts`
- Automated evidence: `e2e/vertical-slice.spec.ts`

## requirement-20: Isometric world

- MASTER: 55
- Implementation: `src/render/PixiHotelScene.ts`
- Automated evidence: `e2e/vertical-slice.spec.ts`

## requirement-21: Onboarding/accessibility

- MASTER: 57
- Implementation: `src/ui/onboarding/TutorialCoach.tsx`
- Automated evidence: `e2e/accessibility.spec.ts`

## requirement-22: Anti-runaway balancing

- MASTER: 34, 77
- Implementation: `src/game/world/macro.ts`
- Automated evidence: `src/game/world/macro.test.ts`

## requirement-23: Sales/Marketing/CRM/Loyalty

- MASTER: 25
- Implementation: `src/game/commercial/commercialState.ts`
- Automated evidence: `src/game/commercial/commercial.test.ts`

## requirement-24: Front-office/housekeeping state machine

- MASTER: 9
- Implementation: `src/game/rooms/roomState.ts`
- Automated evidence: `src/game/rooms/housekeeping.test.ts`

## requirement-25: F&B operation

- MASTER: 13
- Implementation: `src/game/fnb/breakfastService.ts`
- Automated evidence: `src/game/fnb/breakfastService.test.ts`

## requirement-26: Groups/conference/events

- MASTER: 15
- Implementation: `src/game/eventsales/contracts.ts`
- Automated evidence: `src/game/eventsales/contracts.test.ts`

## requirement-27: Reservable ancillary services

- MASTER: 14
- Implementation: `src/game/wellness/reservations.ts`
- Automated evidence: `src/game/wellness/reservations.test.ts`

## requirement-28: Service recovery

- MASTER: 8.11-8.13
- Implementation: `src/game/guests/complaints.ts`
- Automated evidence: `src/game/guests/complaints.test.ts`

## requirement-29: Multidimensional reputation

- MASTER: 26
- Implementation: `src/game/reputation/dimensions.ts`
- Automated evidence: `src/game/reputation/dimensions.test.ts`

## requirement-30: Operating models

- MASTER: 23
- Implementation: `src/game/ownership/models.ts`
- Automated evidence: `src/game/ownership/models.test.ts`

## requirement-31: Site development/pre-opening

- MASTER: 28
- Implementation: `src/game/development/preOpening.ts`
- Automated evidence: `src/game/development/preOpening.test.ts`

## requirement-32: Market research/uncertainty

- MASTER: 29
- Implementation: `src/game/marketResearch/forecast.ts`
- Automated evidence: `src/game/marketResearch/forecast.test.ts`

## requirement-33: Insurance/claims

- MASTER: 24
- Implementation: `src/game/risk/insurance.ts`
- Automated evidence: `src/game/risk/insurance.test.ts`

## requirement-34: Compliance

- MASTER: 38
- Implementation: `src/game/regulation/compliance.ts`
- Automated evidence: `src/game/regulation/compliance.test.ts`

## requirement-35: Transport/accessibility

- MASTER: 31
- Implementation: `src/game/transport/network.ts`
- Automated evidence: `src/game/transport/network.test.ts`

## requirement-36: Weather/climate

- MASTER: 5.7, 35
- Implementation: `src/game/world/climate.ts`
- Automated evidence: `src/game/world/climate.test.ts`

## requirement-37: Energy/water/supply

- MASTER: 27
- Implementation: `src/game/utilities/consumption.ts`
- Automated evidence: `src/game/utilities/consumption.test.ts`

## requirement-38: Manager delegation/governance

- MASTER: 41
- Implementation: `src/game/management/escalation.ts`
- Automated evidence: `src/game/management/escalation.test.ts`

## requirement-39: Legal entities

- MASTER: 42
- Implementation: `src/game/company/legalEntities.ts`
- Automated evidence: `src/game/company/portfolio.test.ts`

## requirement-40: Hotel day/operating-time logic

- MASTER: 5.2-5.4
- Implementation: `src/game/simulation/clock.ts`
- Automated evidence: `src/game/simulation/GameSimulation.test.ts`

## requirement-41: Technology dependencies/standards

- MASTER: 36
- Implementation: `src/game/technology/graph.ts`
- Automated evidence: `src/game/technology/graph.test.ts`

## requirement-42: Macro stabilization

- MASTER: 34
- Implementation: `src/game/world/macro.ts`
- Automated evidence: `src/game/world/macro.test.ts`

## requirement-43: Other economic actors

- MASTER: 32
- Implementation: `src/game/actors/evolution.ts`
- Automated evidence: `src/game/actors/evolution.test.ts`

## requirement-44: Original behavioral parity

- MASTER: 81
- Implementation: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`
- Automated evidence: `e2e/hotel-depth.spec.ts`
- Reviewed evidence: `docs/superpowers/plans/2026-08-09-MASTER-spec-coverage-audit.md`

## requirement-45: Content schema

- MASTER: 70
- Implementation: `src/game/content/corePack.ts`
- Automated evidence: `src/game/content/corePack.test.ts`

## requirement-46: Content authoring

- MASTER: 71
- Implementation: `src/tools/content-editor/ContentEditorApp.tsx`
- Automated evidence: `e2e/content-editor.spec.ts`

## requirement-47: Observability/replay

- MASTER: 74
- Implementation: `scripts/replay-plans-01-03.ts`
- Automated evidence: `fixtures/replay/plans-01-03.json`

## requirement-48: Worker protocol

- MASTER: 67
- Implementation: `src/game/domain/protocol.ts`
- Automated evidence: `src/game/domain/protocol.test.ts`

## requirement-49: Performance budgets

- MASTER: 75
- Implementation: `scripts/benchmark-all.ts`
- Automated evidence: `e2e/performance-smoke.spec.ts`

## requirement-50: Save/content versioning

- MASTER: 72.6-72.8
- Implementation: `src/game/persistence/saveSchema.ts`
- Automated evidence: `src/game/persistence/migrations/v7-to-v8.test.ts`

## requirement-51: Localization

- MASTER: 78
- Implementation: `src/ui/localization.ts`
- Automated evidence: `e2e/localization.spec.ts`

## requirement-52: Audio/feedback

- MASTER: 58
- Implementation: `src/audio/audioEngine.ts`
- Automated evidence: `src/audio/audioEngine.test.ts`

## requirement-53: Notification management

- MASTER: 54
- Implementation: `src/ui/notifications/notificationPreferences.ts`
- Automated evidence: `src/ui/notifications/notificationPreferences.test.ts`

## requirement-54: Scope/non-goals

- MASTER: 82
- Implementation: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`
- Automated evidence: `src/release/plans0103Conformance.test.ts`
- Reviewed evidence: `docs/superpowers/plans/2026-08-09-MASTER-spec-coverage-audit.md`

