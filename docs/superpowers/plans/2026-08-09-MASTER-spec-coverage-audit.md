# MASTER Specification to Implementation Plan Coverage Audit

**Audit date:** 2026-08-09

**Canonical source:** `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`

**Applies to:** Plans 01-10

## Audit rule

A MASTER chapter is covered only when a plan supplies a production task, targeted
verification, migration work for persistent state, and an integration gate. A chapter
number in a header or an acceptance-registry row is not implementation coverage.
Plans 01-03 passed their original gates, but a later implementation audit found that
those gates prove a playable slice rather than every claimed architecture and integration
contract. Baseline conformance gaps are now owned by Plan 03.5 before Plan 04. Plans
04-06 retain only later-system depth beyond that repaired baseline.

## Gaps found and disposition

1. Plan 01 proved only the vertical-slice baseline for its broad chapter range.
   Difficulty/sandbox/game-over, later distribution/revenue automation, and complete
   employee/supplier lifecycles remain correctly assigned to later plans; Plan 03.5 owns
   only missing contracts that Plan 01 itself claimed as delivered architecture/slice.
2. Plan 02 did not explicitly finish lobby automation, shops/operator models, outdoor
   areas, or their specialization dependencies.
3. Plan 05 claimed Chapters 22-28 but lacked tasks for complete accounting, insurance,
   Sales/Marketing/CRM/Loyalty, multidimensional reputation, and utilities.
4. Plan 06 did not own campaign setup, difficulty, endless continuation, or game-over.
5. Plan 10 counted 54 requirements without requiring distinct implementation,
   automated-verification, and audit evidence.

Plan 03.5 owns the Plans 01-03 conformance delta. Plans 04-06 deepen the repaired
baseline, and Plan 10 must reject missing implementation or verification evidence.

## 54-requirement ownership ledger

| ID | MASTER requirement | Implementation owner |
|---:|---|---|
| 1 | Booking/reservation/distribution | Plan 01 Tasks 8,10; Plan 03.5 Task 6; Plan 04 Task 13 |
| 2 | Revenue management | Plan 01 Task 9; Plan 04 Task 13 |
| 3 | Complete guest model | Plan 01 Tasks 8,10-11; Plan 03.5 Task 6; Plan 05 Task 18 |
| 4 | Financial system | Plan 01 Task 14; Plan 05 Task 15 |
| 5 | Purchasing/inventory/suppliers | Plan 01 Task 7; Plan 05 Task 17 |
| 6 | Staff/labor market | Plans 01 Task 6, 03 Task 2; Plan 05 Task 17 |
| 7 | Construction/renovation/maintenance | Plans 01 Tasks 13,15; 02 Tasks 3,9 |
| 8 | Classification/brand standards | Plans 02 Task 11, 05 Task 3 |
| 9 | Calendar/season/demand | Plans 01 Tasks 2,8; 03 Task 1; 04 Tasks 5,8 |
| 10 | Competitor AI | Plan 03 Tasks 8-10; Plan 09 Task 11 |
| 11 | Group/expansion | Plan 05 Tasks 1,4-14 |
| 12 | Start/difficulty/career end | Plan 06 Task 13 |
| 13 | Alternative history | Plan 04 Tasks 1-12 |
| 14 | Currencies/international expansion | Plans 04 Task 9, 05 Tasks 1,10 |
| 15 | Original parity | Feature owners; Plan 10 Task 2 |
| 16 | Singleplayer/spiritual successor | Architecture/content policy; Plan 10 Task 2 |
| 17 | Command system | Plan 01 Tasks 3,16-17; Plan 03.5 Tasks 2-3 |
| 18 | Numeric rules | Plan 01 Tasks 2,14; Plan 05 Task 15 |
| 19 | Web Worker | Plan 01 Tasks 16-17; Plan 03.5 Tasks 2-5; Plan 09 Tasks 1,5,7 |
| 20 | Isometric world | Plans 01 Task 19, 02 Task 12; Plan 03.5 Task 8; Plan 05 Task 21 |
| 21 | Onboarding/accessibility | Plan 08 Tasks 3-7,13 |
| 22 | Anti-runaway balancing | Plans 04 Tasks 2,6-7,12; 09 Tasks 8-14 |
| 23 | Sales/Marketing/CRM/Loyalty | Plan 05 Task 16 |
| 24 | Front-office/housekeeping state machine | Plan 01 Tasks 5,10; Plan 03.5 Task 6 |
| 25 | F&B operation | Plans 01 Task 12, 02 Tasks 4-5; Plan 03.5 Task 7; Plan 05 Task 20 |
| 26 | Groups/conference/events | Plan 02 Task 8; Plan 03.5 Task 7; Plan 05 Task 20 |
| 27 | Reservable ancillary services | Plan 02 Task 7; Plan 03.5 Task 7; Plan 05 Task 20 |
| 28 | Service recovery | Plan 01 Task 11; Plan 05 Task 18 |
| 29 | Multidimensional reputation | Plan 05 Task 16; Plan 06 Tasks 6-7 |
| 30 | Operating models | Plan 05 Task 2 |
| 31 | Site development/pre-opening | Plan 05 Tasks 4-6 |
| 32 | Market research/uncertainty | Plan 03 Task 7; Plan 05 Tasks 4,11 |
| 33 | Insurance/claims | Plan 05 Task 15 |
| 34 | Compliance | Plan 04 Task 8; Plan 05 Task 15 |
| 35 | Transport/accessibility | Plan 03 Task 4 |
| 36 | Weather/climate | Plan 04 Tasks 7-8 |
| 37 | Energy/water/supply | Plan 05 Task 15 |
| 38 | Manager delegation/governance | Plan 05 Tasks 8-9 |
| 39 | Legal entities | Plan 05 Task 1 |
| 40 | Hotel day/operating-time logic | Plan 01 Tasks 2,8,10,12,16 |
| 41 | Technology dependencies/standards | Plan 04 Tasks 1-4,10-11 |
| 42 | Macro stabilization | Plans 04 Tasks 6-7,12; 09 Tasks 8-11,14 |
| 43 | Other economic actors | Plan 03 Task 5 |
| 44 | Original behavioral parity | Feature owners; Plan 10 Tasks 2,11 |
| 45 | Content schema | Plan 07 Tasks 1-9 |
| 46 | Content authoring | Plan 07 Tasks 10-14 |
| 47 | Observability/replay | Plan 01 Task 21; Plan 03.5 Tasks 3,10-11; Plans 09 Tasks 1-2, 10 Tasks 5,13 |
| 48 | Worker protocol | Plan 01 Tasks 3,17; Plan 03.5 Tasks 3-4; Plan 09 Tasks 1,5 |
| 49 | Performance budgets | Plan 09 Tasks 1-14 |
| 50 | Save/content versioning | Plans 01-03 migrations; Plan 03.5 Tasks 5,12; Plan 07 Tasks 9,15 |
| 51 | Localization | Plan 08 Tasks 1-2,12-13 |
| 52 | Audio/feedback | Plan 08 Tasks 9-12 |
| 53 | Notification management | Plan 08 Task 8 |
| 54 | Scope/non-goals | Every plan scope contract; Plan 10 Tasks 1,2,16 |

Every row's release evidence owner is Plan 10 Task 1 plus the applicable focused gate
in Tasks 2-16. Task 1 stores three distinct links: implementation, automated evidence,
and reviewed evidence where automation cannot prove the claim.

## Cross-plan acceptance rules

1. Update this ledger and the owning plan self-review together when ownership changes.
2. Include persistent completion-delta fields in the owning plan's migration and fixture.
3. Technology unlocks availability through simulated adoption, never a hard-coded year.
4. Player and competitor economics reuse shared primitives.
5. A final E2E is not a substitute for focused system and determinism tests.
6. This audit establishes plan coverage; it does not claim future implementation exists.
   Runtime reachability is audited separately in
   `2026-08-10-MASTER-spec-code-alignment-audit.md`.

## Plans 01-03 implementation audit status

The original Plan 01-03 checkboxes and green gates remain valid evidence for the
implemented playable slice, but not for full conformance. The repository audit found
missing command metadata/atomicity, un-emitted events and performance samples, mislabeled
full-snapshot deltas, non-specific detail responses, one UI save slot without autosave or
recovery policy, under-integrated Plan 02 operating depth, a static isometric tile view,
and a decade market assertion too weak to prove fairness or determinism. These findings
are release-blocking and are owned by
`2026-08-09-03.5-plans-01-03-conformance-remediation.md`.

## Deep chapter and subsection audit

The 54-point ledger is necessary but too coarse: one requirement can span dozens of
normative subsections. The following second pass checks the behavioral contracts in
MASTER Chapters 1-83. `Existing` means a verified Plan 01-03 task owns the baseline;
`future` names the task that must finish the contract. This is an implementation-plan
audit, not a claim that future behavior already exists.

### Product, time, booking, guest journey, and front office (Chapters 1-9)

| MASTER sections | Required detail that must not be lost | Owner/gate |
|---|---|---|
| 1-3 | Hotel operations remain central; loop connects observe, decide, execute, simulate, explain | Existing Plan 01; Plan 10 critical path |
| 4.1-4.5 | Fixed standard start, disclosed difficulty axes, orthogonal sandbox, 2026 continuation, recoverable distress/game over | Plan 06 Task 13 |
| 5.1-5.9 | Real calendar/hotel-day boundaries, check-in/out, weekday/season/weather, source demand, causal explanation | Existing Plans 01/03; Plan 04 Tasks 5,8 |
| 6.1-6.17 | Full reservation record, lead/stay length, cancellation/no-show/walk-in, direct/agency/corporate/group/allotment/OTA, commission, single inventory, overbooking/displacement | Plan 04 Task 13 completion contract |
| 7.1-7.12 | Rate plans/restrictions, uncertain forecast, elasticity/group contribution, ADR/RevPAR/GOPPAR, bounded automation and player rules | Plan 04 Task 13 completion contract |
| 8.1-8.17 | Stable parties, needs/search/compare/book/arrive/stay, contributor satisfaction, complaints/recovery authority, checkout/review/loyalty/CRM | Plan 05 Task 18 completion contract |
| 9.1-9.12 | Room state/check-in conditions, early/late, assignment/change, work orders/priorities/capacity, inspection, Lost & Found, delayed release | Existing Plan 01 plus Plan 05 Task 18 |

### Hotel product and operations (Chapters 10-21)

| MASTER sections | Required detail that must not be lost | Owner/gate |
|---|---|---|
| 10-11 | Defined structural envelopes, module placement, non-linear products, approval/build/noise/risk/acceptance, room modules/aging and renovation types | Verified Plan 02 Tasks 2-3,13 |
| 12.1-12.4 | Arrival/orientation/waiting/check-in/out/baggage/concierge capacity plus adoption-gated automation | Plan 05 Task 19 completion contract |
| 13.1-13.16 | Concepts/hours/reservations/external demand/menu/recipes/board plans/mise-en-place/allergies/menu engineering/kitchen bottlenecks/waste/bar/room service | Verified Plan 02 baseline; Plan 05 Task 20 edge matrix |
| 14.1-14.5 | Wellness/fitness modules, resource and specialist load, slots/waitlists, shared ancillary capacity rules | Verified Plan 02 baseline; Plan 05 Task 20 |
| 15.1-15.10 | Rooms/technology evolution, lead-offer-negotiation-deposit-cancel-block lifecycle, execution peaks and delayed city effect | Verified Plan 02 baseline; Plan 05 Task 20 |
| 16-17 | Linen types/floor stock/internal-external laundry; plant capacity/efficiency/condition/life, preventive/reactive/replacement and consequence-based priority | Verified Plan 02 baseline; Plan 05 Task 20 |
| 18.1-18.15 | Departments, labor market, attributes/contracts/rosters/overtime/absence/leave/training/promotion/exit/reputation/staff areas/automation | Existing Plans 01/03 plus Plan 05 Task 17 |
| 19.1-19.9 | Categories, supplier attributes/contracts, storage, spoilage, reorder, lead time, stockout, central purchasing trade-offs | Existing Plan 01 plus Plan 05 Task 17 |
| 20.1-20.7 | Parking/mobility/shops/operator models/outdoors/security/concept dependencies with economics and capacity | Plan 05 Task 19 |
| 21.1-21.5 | Auditable classification, no XP stars, brand standards and audits | Verified Plan 02 plus Plan 05 Task 3 |

### Finance, commercial systems, city, and evolving world (Chapters 22-39)

| MASTER sections | Required detail that must not be lost | Owner/gate |
|---|---|---|
| 22.1-22.17 | Reconciled P&L/cash flow/balance sheet, CapEx/OpEx, depreciation, debt/rates/amortization/credit/collateral/terms/tax/insolvency/restructuring/group finance/treasury | Plan 05 Task 15 completion contract |
| 23.1-23.5 | Ownership, lease, management, franchise, and property/operations separation | Plan 05 Tasks 1-2 |
| 24.1-24.5 | Policy types/parameters, conditional claims, underinsurance and delayed settlement | Plan 05 Task 15 |
| 25.1-25.10 | Era-appropriate marketing, campaign parameters/attribution, sales pipeline, CRM, loyalty economics/liability | Plan 05 Task 16 completion contract |
| 26.1-26.7 | Separate hotel/brand/group/employer/media/channel reputations and personal prestige | Plan 05 Task 16; Plan 06 Tasks 6-7 |
| 27.1-27.8 | Metered energy/water, supply contracts/outages, investment, waste/supply chains, no green-score shortcut | Plan 05 Task 15 |
| 28-29 | Feasibility through ramp-up; uncertainty, paid information quality and surprises | Existing Plan 03 research; Plan 05 Tasks 4-6,11 |
| 30-33 | City feedback/saturation/delay, transport, actors, fair bounded-knowledge competitors/entry/exit/rival memory | Verified Plan 03; Plan 09 bounds |
| 34-35 | Bounded macro feedback, systemic non-dated crises, stabilizers, rare conditional recoverable/insurable events | Plan 04 Tasks 6-8; Plan 09 gates |
| 36-39 | Technology prerequisites/standards/cost/adoption/platform effects, trends, full compliance domains, currencies and non-fixed common-currency path | Plan 04 Tasks 1-11, especially Task 8 contract |

### Company, narrative, interface, and isometric world (Chapters 40-58)

| MASTER sections | Required detail that must not be lost | Owner/gate |
|---|---|---|
| 40-44 | Portfolio/regions/HQ/shared services/budgets, bounded delegation, legal entities, brand fit/rebrand, due diligence and atomic M&A/integration | Plan 05 Tasks 1-14 |
| 45-48 | Conditional non-linear events, milestones, key staff, media evolution, company/world chronicle and delayed choices without morality score | Plan 06 Tasks 1-12 |
| 49-53 | Linked hotel/dashboard views, complete management navigation, layered why-analysis, actionable monthly close, scalable portfolio drill-down | Existing Plan 01; Plans 05/06 UI; Plan 10 critical path |
| 54.1-54.5 | Priorities, category/hotel/region filters, protocol-safe auto-pause, delegated summaries, grouping/deduplication | Plan 08 Task 8 completion contract |
| 55.1-55.14 | Presentation-only renderer, camera/focus/floors/cutaway, touch targets, navigation/pathfinding, elevators/stairs/queues, visual states/day-night/LOD and agent budget | Plan 05 Task 21; Plan 09 Tasks 3-4 |
| 56 | Adoption-driven visual era with stable information architecture | Plan 04 Task 10 |
| 57 | Tutorial/help/recommendations/presets, keyboard, scaling, contrast, reduced motion, semantic canvas alternative | Plan 08 Tasks 3-7,13 |
| 58 | Layered ambience/UI/alarm/music controls with non-audio alternatives | Plan 08 Tasks 9-13 |

### Architecture, content, persistence, quality, and product boundaries (Chapters 59-83)

| MASTER sections | Required detail that must not be lost | Owner/gate |
|---|---|---|
| 59-64 | Worker authority, multi-rate time, command validation/rejection, events, isolated persisted RNG, exact stable phase/ID order | Existing Plan 01; Plan 10 replay/invariants |
| 65-69 | Integer money/fixed point/rounding/finite values, versioned protocol/errors, complete state, aggregate/materialized consistency | Existing Plan 01; Plan 09 detail/deltas; Plan 10 gates |
| 70-71 | Stable IDs, schema/version/reference/unit/default validation and usable authoring/validation/balancing tools | Plan 07 Tasks 1-14 |
| 72.1-72.8 | IndexedDB, manual/monthly/yearly/pre-action/recovery slots, save/content versions, contiguous migration and frozen/adopted balance semantics | Existing migrations; Plan 07 Task 9; Plan 10 Tasks 3-4 |
| 72.9-72.11 | Validated file export/import and a sync-neutral repository boundary without P0 cloud implementation | Plan 07 Task 15 |
| 73 | Atomic major actions, pre-load validation, recovery generations, deterministic record isolation | Plan 10 Tasks 3-6 completion contracts |
| 74 | Command/event/RNG traces, real replay, state diff and player-facing causal separation | Plan 10 Tasks 5,13 |
| 75-77 | Explicit UI/Worker/simulation/agent/memory/scale/save budgets, headless scenarios, long-run/property tests, anti-runaway metrics | Plan 09 Tasks 1-14; Plan 10 Tasks 10,12 |
| 78 | de/en strings and locale-aware number/date/currency/unit/name presentation without logic depending on text | Plan 08 Tasks 1-2,12-13 |
| 79-81 | Verified functional and behavioral parity, no asset copy or invented historical claims | Plan 10 Tasks 1-2,11,16 |
| 82-83 | Non-goals and decision/rule/feedback acceptance applied to every release row | Every scope contract; Plan 10 Tasks 1,16 |

## Deep-audit corrections added after the first pass

1. Plan snippets are now explicitly first red/green increments, not completion
   definitions. Future Plans 04-10 require their full MASTER completion contracts.
2. Plan 05 Tasks 15, 16, 18, and 19 now enumerate their domain records, accounting and
   causal requirements instead of broad labels.
3. Plan 05 Task 20 closes detailed F&B, ancillary, event, laundry, and engineering edge
   contracts that broad Plan 02 ownership did not prove individually.
4. Plan 05 Task 21 owns all MASTER 55 camera, floor, navigation, elevator, queue,
   day/night, LOD, semantic-access, and presentation-authority requirements.
5. Plan 07 Task 15 now owns player save export/import and the future-sync-neutral boundary.
6. Plan 08 Task 8 now owns the complete notification record/filter/auto-pause/delegation
   contract, not only severity comparison.
7. Plan 09 Task 14 now states mature campaign scale and separate measurable budgets.
8. Plan 10 migration and replay work must traverse real migrations/simulation; fixture
   shape checks and skipped migration versions cannot pass.

### Decomposition, traceability, and change control (Chapters 84-95)

- Chapters 84-90 remain the dependency-ordered project decomposition represented by
  Plans 01-10; splitting MASTER Subproject 7 across Plans 07-10 does not relax its scope.
- Chapter 91 is represented exactly once by the 54-row ledger above and Plan 10 Task 1.
- Chapters 92-93 are release invariants: no future-date technology, hidden AI cheats,
  float money, main-thread authority, free architecture mode, real hotel brands, open
  placeholders, or untested major systems.
- Chapter 94 change control requires simultaneous review of affected systems,
  traceability, migrations/content compatibility, determinism, and long-run balance.
- Chapter 95 is the product-level target; it is validated by the combined release gate,
  never by a single screenshot or nominal menu entry.
