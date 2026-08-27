# AGENTS.md

> Repository-wide instructions for coding agents working on the Hotel Management Simulator.
> Place this file at the repository root. These rules apply recursively unless a deeper `AGENTS.md` explicitly narrows them for a subdirectory.

## 1. Mission

Build a browser-based, singleplayer hotel-management simulation that begins in 1991 and can grow from one hands-on hotel into an international hotel group across a systemically evolving alternative history.

The product must combine two equally important experiences:

- a living 2D-isometric hotel where operational consequences are visible, and
- a deep management interface where the player can understand, control, automate, and optimize the business.

The game must feel designed, not assembled. Simulation depth, explainability, visual craft, accessibility, determinism, and long-term maintainability are all first-class requirements.

Do not optimize for the fastest code path to a demo if it breaks the architecture promised by the MASTER specification or the active implementation plan.

---

## 2. Authority and source-of-truth order

When instructions conflict, resolve them in this order:

1. The user's current explicit instruction.
2. This `AGENTS.md`.
3. `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.
4. The currently active implementation plan in `docs/superpowers/plans/`.
5. Existing repository architecture, tests, and established conventions.
6. Older design/reference documents.

### Canonical design document

The only canonical full design specification is:

`docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`

It defines the product, simulation rules, architecture, 54-point traceability matrix, original-parity policy, non-goals, and project decomposition.

### Historical documents that are not canonical

Do not use these as the current source of truth:

- `docs/superpowers/specs/2026-08-08-hotel-management-simulator-design.md` — superseded short specification.
- `docs/superpowers/specs/2026-08-08-hotel-management-simulator-completeness-check.md` — historical audit, useful as evidence only.
- `docs/superpowers/plans/2026-08-08-1991-single-hotel-vertical-slice.md` — superseded by Plan 01 Revision 1.1.

If a historical document disagrees with the MASTER spec, the MASTER spec wins.

### Design changes

If a user request intentionally changes a MASTER-spec rule, do not silently work around the conflict.

Before implementation:

1. identify the affected MASTER chapters,
2. identify affected implementation plans,
3. identify save/content/protocol migration impact,
4. identify determinism and balancing impact,
5. update the relevant specification/plan if the change is durable.

---

## 3. Implementation-plan sequence

The project is implemented through ten delivery plans plus the audited Plan 03.5 conformance gate. Treat them as a dependency chain, not a grab bag.

| Plan | File                                                                               | Purpose                                                                                       |
| ---- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 01   | `docs/superpowers/plans/2026-08-08-01-1991-single-hotel-vertical-slice-rev-1.1.md` | Prove the core architecture and one playable Frankfurt hotel in 1991.                         |
| 02   | `docs/superpowers/plans/2026-08-08-02-hotel-depth-specialization.md`               | Deepen rooms, F&B, facilities, engineering, events, classification, and specialization.       |
| 03   | `docs/superpowers/plans/2026-08-08-03-city-market-competitors.md`                  | Add city markets, labor, property, transport, external actors, and fair competitors.          |
| 03.5 | `docs/superpowers/plans/2026-08-09-03.5-plans-01-03-conformance-remediation.md`    | Close architecture, integration, persistence, isometric, and long-run proof gaps.             |
| 04   | `docs/superpowers/plans/2026-08-08-04-technology-alternative-history.md`           | Add systemic technology, trends, macroeconomics, regulation, crises, and currencies.          |
| 05   | `docs/superpowers/plans/2026-08-08-05-multi-hotel-company-brands.md`               | Add portfolio management, brands, ownership models, managers, development, treasury, and M&A. |
| 06   | `docs/superpowers/plans/2026-08-08-06-emergent-campaign-narrative.md`              | Add emergent milestones, rivals, careers, media, prestige, choices, and chronicle.            |
| 07   | `docs/superpowers/plans/2026-08-08-07-content-authoring-pipeline.md`               | Convert content to validated versioned data packs and add authoring tools.                    |
| 08   | `docs/superpowers/plans/2026-08-08-08-accessibility-localization-audio.md`         | Add localization, accessibility, onboarding, notification control, and audio.                 |
| 09   | `docs/superpowers/plans/2026-08-08-09-scale-performance-balancing.md`              | Make decades-long simulations responsive, bounded, measurable, and economically stable.       |
| 10   | `docs/superpowers/plans/2026-08-08-10-final-qa-release-hardening.md`               | Convert every critical promise into a reproducible release gate.                              |

### Plan gate rule

Do not begin Plan N+1 until Plan N's final verification gate is green, unless the user explicitly requests an isolated change that does not depend on unfinished work.

When executing a plan:

- work task-by-task in plan order,
- honor the plan's exact file paths and contracts unless the repository has already evolved through a verified refactor,
- keep plan task scope narrow,
- do not pull future-plan gameplay into the current plan merely because it is attractive,
- update all affected tests and references in the same commit when intentionally renaming a contract.

---

### Current repository state

Plan 01 (1991 single-hotel vertical slice, rev 1.1), Plan 02 (hotel depth and
specialization), Plan 03 (city market and competitors), Plan 03.5 (conformance
remediation), Plan 04 (technology and alternative history), Plan 05
(multi-hotel company and brands) and Plan 06 (emergent campaign and narrative)
are implemented.

Fresh verification of the Plan 06 gate on 2026-08-09 produced these exact
results:

- `npm run test:run` — passed (137 files, 819 tests).
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run test:e2e` — passed (22 tests).
- `npm run benchmark` — passed (a simulated year in 5.9s against a 30s budget).

The replay hash has moved four times, and each time the corpus was re-recorded
with `scripts/record-replay-corpus.ts` rather than edited: to `c84d4e4c` when the
utility standing charge became a monthly posting instead of a daily one, to
`da457f73` when the difficulty levers were wired up and the narrative month began
taking a second draw for its frequency gate, and to `a7f91d3b` when interest
stopped counting toward the month's operating expense, and to `49da2991` when
authoritative display names moved to localization keys and the press-profile choice
ID was aligned with its label key.

Interest is a financing cost and `profitAndLoss` has always reported it as one.
While `spend()` also added it to `finance.month.operatingExpenseMinor`, the
monthly close and the statement disagreed about the same period's operating
profit, and every result read off `hotelResults` inherited the lower figure. The
month accumulator now takes trading costs only.

Plan 07 (content and authoring pipeline) is implemented. Its final gate on
2026-08-10 passed `npm run test:run` (155 files, 867 tests), `npm run typecheck`,
`npm run lint`, `npm run build`, `npm run test:e2e` (24 tests), and
`npm run content:validate`. Plan 08 (accessibility, localization, and audio) is
implemented. Presentation preferences remain outside authoritative simulation
state, while save version 7 carries them beside replayable state. Worker pause
and resume controls are correlated requests, Pixi targets retain equivalent
semantic DOM controls, and meaningful audio cues always have visual labels.
Plan 09 is implemented. Worker samples now disclose tick, command, delta, save,
and visible-agent measurements; presentation materialization is capped without
changing aggregate demand. Detail tiers retain monthly economics, fast-forward
yields at bounded batches, and deterministic market/technology bounds use
integer arithmetic. The versioned scenario corpus is the release authority for
normal, fast-forward, close, facilities, portfolio, crisis, save/load, and
50-year mature-scale workloads. `npm run benchmark:all` and
`npm run stress:50y` must remain green before Plan 10 begins.

Plan 09 remediation replaced the illustrative synthetic workload with real
domain-system execution. Operational scenarios drive `GameSimulation`, while
the mature workload runs the existing aggregate managed-hotel, city,
competitor and world systems for 600 monthly steps across 60 hotels, 25 cities
and 40 competitors. Yearly checkpoint hashes cover the whole aggregate state.
Ledger history retains daily detail for two years, monthly account totals for
the following three years and yearly account totals thereafter; compaction
must preserve exact account and cash totals. Protocol 4 adds delta/save byte
measurements to `PERF_SAMPLE`; current saves must match the active protocol.

Fresh Plan 09 remediation verification on 2026-08-10 passed
`npm run test:run` (184 files, 916 tests), `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run test:e2e` (29 tests), `npm run content:validate`,
`npm run benchmark:all`, `npm run stress:50y`, and `npm run verify:replays`.

Fresh Plan 08 verification on 2026-08-10 passed `npm run test:run` (168 files,
889 tests), `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run test:e2e` (28 tests), `npm run content:validate`, `npm run benchmark`
(a simulated year in 6.9s against a 30s budget), and `npm run verify:replays`.

Plan 07 made the schema-first content boundary executable: the core pack is
validated with Zod at build and load time, stable IDs resolve through a
deep-frozen normalized registry, references, declared processing order and
technology cycles are release-blocking, and the internal editor uses the same
schemas. Cities, facilities, room modules, technology/trends, guest segments,
recipes, suppliers, rivals, brands and narrative events are registry-backed
runtime content; explicit `simulationOrder` preserves replay behavior. Save content version `1991.1`
preserves running authoritative values through an explicit compatibility hook.
Player save transfer is a checksummed, size-bounded envelope validated before an
atomic sync-provider-neutral repository write.

Plan 06 named scope this build does not model, and the difference must be
stated rather than implied. Of the eight MASTER 4.5 recovery measures, this
build implements three — `refinance`, `sell-hotel` and `staff-reduction` — and
refuses the other five at the command boundary.

### Where a difficulty lands

`DifficultyInputs` names nine levers and every one of them is read. A preset
value nothing consumes is a promise the game does not keep, so if a lever is
added it has to be wired to the system it names in the same change.

| Lever                             | Where it applies                                          |
| --------------------------------- | --------------------------------------------------------- |
| `startingCapitalBasisPoints`      | `adjustedStartingCapitalMinor`, posted as opening capital |
| `creditSpreadBasisPoints`         | the opening loan's rate                                   |
| `guestToleranceBasisPoints`       | `moveSatisfaction`; penalties only, never goodwill        |
| `forecastAccuracyBasisPoints`     | the quality a `forecastBand` is drawn at                  |
| `laborScarcityBasisPoints`        | the city's wage pressure, for every house in it           |
| `crisisBufferBasisPoints`         | `WorldSimulation`'s crisis risk                           |
| `competitorAggressionBasisPoints` | how far under the market reads as a price war             |
| `eventFrequencyBasisPoints`       | the narrative month's frequency gate                      |
| `assistanceBasisPoints`           | what advice and market research cost                      |

All nine are disclosed inputs on a world. None of them is a hidden advantage
for a competitor: a harder game is a harder city, never an opponent that
cheats. Everything except the two financial levers lives in
`src/game/campaign/difficultyEffects.ts`, so each one can be traced from the
preset to the system it pulls.

### Where a sandbox option lands

Sandbox options are disclosed, editable before the career starts, frozen with
the campaign, and consumed through `src/game/campaign/sandboxEffects.ts`.

| Lever                               | Where it applies                                       |
| ----------------------------------- | ------------------------------------------------------ |
| `economicVolatilityBasisPoints`     | yearly macro target roll widths                        |
| `crisisFrequencyBasisPoints`        | crisis risk before the shock roll                      |
| `competitorAggressionBasisPoints`   | competitors' discount appetite                         |
| `startingCapitalBasisPoints`        | opening capital posted through the ledger              |
| `technologySpeedBasisPoints`        | monthly technology-project progress                    |
| `constructionVolatilityBasisPoints` | renovation cost and development feasibility bands      |
| `informationAccuracyBasisPoints`    | forecast quality before a market-research band is made |

### Plan 06: the campaign above the company

Plan 06 added the career narrative. It observes the simulation; it never
becomes a second set of economic rules. What later work must respect:

- **The narrative section** (`src/game/narrative/narrativeState.ts`) is
  authoritative save state: chronicle, active stories and their cooldowns, the
  year-to-date profit accumulator, rivals, key people, media reach, prestige,
  strategic opportunities, the frozen campaign configuration and the career
  reading.
- **Stories fire from state, never from a script or a date.**
  `narrativeSystem.ts` reads facts out of the running game, `eventEngine.ts`
  decides which definitions the world permits, and one is drawn from the
  seeded `narrative` stream in the monthly close. Definitions live in
  `src/game/content/1991/narrative.ts` as data.
- **A choice is never its own executor.** `outcomes.ts` returns typed effects
  and the finance and reputation systems post them. A story must not invent a
  command type: if it needs one, add it to `GameCommand` and give it rules in
  the same place every other command has them.
- **Difficulty is part of the run.** `SET_CAMPAIGN_DIFFICULTY` is refused once
  `elapsedMinutes > 0`, the configuration is deep-frozen at creation, and the
  opening balance is _posted through the ledger_ rather than assigned — cash
  that appears beside the ledger breaks the invariant.
- **Difficulty changes disclosed inputs only.** There is no field for hidden AI
  money or hidden AI knowledge, and adding one is out of scope for every plan.
- **Distress is cash less payables.** `spend()` turns a shortfall into a
  payable and floors cash at zero, so a reading taken from the balance alone
  would never see trouble at all. Game over is the point where no measure is
  left, not the point where the account looks bad.
- **Offer only what is modelled.** `MODELLED_RECOVERY_PATHS` is the list the
  UI may show; anything else is refused with a reason. A button that does
  nothing is worse than an absent one.
- **A profitable year is a finished year.** The monthly close accumulates into
  `narrative.annualProfit` and banks the total in December; milestones read the
  banked figure and the _closed period's_ year, not the day the close is
  posted.
- **Four new domain events** (`MILESTONE_ACHIEVED`, `NARRATIVE_EVENT_RAISED`,
  `NARRATIVE_EVENT_RESOLVED`, `RECOVERY_MEASURE_TAKEN`) bring the declared
  total to 49; `campaignScenario()` in `eventBuffer.test.ts` drives them.
- **Authoritative state holds keys, not sentences.** Chronicle entries, story
  titles, choice labels and rival names are localization keys; the UI resolves
  them with `translateKey` at the presentation edge.
- **Ordering is compared, not collated.** Use `compareIds` for chronicle and
  story ordering. `localeCompare` sorts the same history differently on two
  ICU builds, which a replay cannot survive.

### Plan 05: the company above the hotels

Plan 05 added a corporate layer and closed the audited depth delta. What later
work must respect:

- **The company section** (`src/game/company/`) is authoritative save state:
  portfolio, legal entities, operating models, brands and their audits, managed
  hotels, developments, budgets, managers, escalations, treasury, acquisition
  targets and published hotel results. Hotels never read it; it reads the
  monthly result each hotel publishes upward.
- **The treasury describes group cash, it does not hold it.**
  `consolidatedCashMinor(treasury) === finance.cashMinor` is an invariant
  asserted every quantum; `syncTreasury` restates headquarters' balance from
  whatever the hotels have been allocated.
- **Corporate commands** go through the same `CommandHandler` boundary, so an
  acquisition that fails halfway leaves nothing behind. `companyCommands.ts`
  holds their rules; `companyMonth.ts` holds the monthly corporate step.
- **Fifteen new domain events** cover the corporate transitions, and every one
  of the declared types is reachable in a real game — `companyScenario()` in
  `eventBuffer.test.ts` drives the corporate ones.
- **The replay corpus is an observation, not a hand-edited file.** When a plan
  adds real transitions, re-record it with `scripts/record-replay-corpus.ts`
  and prove it reproduces its own hash.
- **Depth delta closed:** statements/debt/insurance/utility contracts
  (`finance/`, `risk/`, `utilities/`), campaigns/sales/CRM/loyalty and six
  scoped reputation dimensions (`commercial/`, `reputation/`), employee and
  supplier lifecycles (`staff/employeeLifecycle.ts`, `purchasing/contracts.ts`),
  party lifecycle and authority-bounded recovery (`guests/`), lobby automation
  and operator-model commercial spaces (`facilities/`), the F&B, event,
  laundry and engineering edge contracts, and the operational world contract
  over the existing render primitives with a full DOM path
  (`src/ui/WorldControls.tsx`).

### Plan 03.5 progress

Tasks 1-12 are implemented. Their production behavior remains covered by the
owning domain, integration, replay, and E2E tests; the historical plan registry
is not runtime authority.

Fresh verification on 2026-08-09 passed `npm run test:run` (69 files, 395 tests),
`npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` (10 tests),
and `npm run benchmark`.

What the completed tasks changed, and that later work must respect:

- **Commands** are envelopes (`src/game/commands/`) carrying command id, issued game
  time, actor, payload and an optional expected state version. `CommandHandler` is the
  single mutation boundary: validate without mutating, execute against a structuredClone
  draft with its own RNG streams, commit once, move `stateVersion` once. A rejected or
  half-failed command leaves everything except the bounded command journal untouched.
- **Domain events** are completed facts with a stable id, monotonic sequence, game time,
  entity references and the causing command id. The journal lives in game state, so a
  rolled-back command takes its events with it. All 28 declared transitions are proven to
  publish; `AWAITING_TRANSITION` is empty and must stay empty.
- **Protocol version 3.** `STATE_DELTA` carries a real section delta against a
  publication number; `REQUEST_DETAILS` answers with one entity or a typed
  `ENTITY_NOT_FOUND`; `SIMULATION_ERROR` is structured; `PERF_SAMPLE` reports measured
  tick and command latency. `WHOLE_GAME_ENTITY_ID` is how a client resynchronises.
  `PAUSE`, `RESUME`, and `REQUEST_SAVE` carry required correlation fields.
- **Saves** have manual, autosave and recovery slots with three rotating generations.
  `validateEnvelope` names what is wrong rather than answering yes or no, and both
  `REQUEST_SAVE` and `LOAD_GAME` go through it. A refused load leaves the running game
  untouched.
- **Bookings** carry channel, party size, segment, category, stay dates, guarantee terms
  and full status history. Inventory is checked on every date of the stay. Cancellation,
  no-show and authorised service recovery are all reachable; a refused recovery posts
  nothing.
  Plan 02 added: room modules and commercial aging, the planning/approval/construction/
  acceptance renovation lifecycle, full F&B (menu, seating, bar, room service, external
  demand), linen and laundry logistics, wellness and fitness, conference sales and
  execution load, engineering capacity with preventive maintenance, staff areas, mobility
  and security, classification and specialization, and the facility board in the snapshot
  and Pixi and DOM presentations.

Plan 03 added: source-based city demand, the labour market and its wage floor on hiring,
lagged property prices and build costs, transport connectivity and route changes, the
external actors that generate travel, saturating and delayed hotel-to-city feedback,
forecast bands with paid information quality, competitor strategies with bounded market
knowledge, shared pricing/investment/lifecycle economics for rivals, entry, exit and
remembered rivalries, and the city and competitor dashboards. The city runs one month
at a time inside the demand phase; each day's room
nights are split across every house, the player included, by one shared allocation.

Layout as built:

```text
src/app/         React shell, GameClient (worker handle), useGameStore
src/game/domain/ money, calendar, ids, rng streams, protocol, commands, events, snapshot
src/game/content/1991/  Frankfurt, starter hotel, guest segments, suppliers, stories
src/game/<system>/      rooms, staff, purchasing, bookings, revenue, guests, fnb,
                        maintenance, finance, building, explanations, facilities,
                        laundry, wellness, eventsales, engineering, classification,
                        renovation, city, labor, property, transport, actors,
                        competitors, marketResearch
src/game/content/rooms/ room modules (fit-out, linen, clean minutes, fit-out cost)
src/game/campaign/      campaign configuration, career outcome, recovery measures
src/game/narrative/     story definitions, event engine, outcomes, narrative state
src/game/chronicle/, src/game/milestones/, src/game/rivals/,
src/game/people/, src/game/media/, src/game/prestige/
                        the campaign's memory: what happened, who remembers it
src/game/simulation/    clock, invariants, initialState, GameSimulation, simulation.worker
src/game/persistence/   saveSchema, indexedDbSaveRepository
src/render/      isoProjection, PixiHotelScene
src/ui/          TopBar, HotelView, dashboards, AlertsPanel, MonthlyCloseModal
src/ui/facilities/, src/render/facilities/  facility board and Pixi load strip
src/ui/market/   city dashboard and competitor table
src/ui/story/    campaign setup, story inbox, chronicle, milestone toast, outcome
src/ui/localization.ts  the key-to-text catalogue every surface resolves through
e2e/, scripts/   Playwright slice, hotel-depth and city-market specs, benchmark
```

Available scripts:

```bash
npm run test:run     # Vitest unit and system tests
npm run typecheck    # tsc --noEmit
npm run lint         # prettier --check . (docs/ and dist/ are prettier-ignored)
npm run build        # vite build
npm run test:e2e     # Playwright against the built preview server
npm run benchmark    # one simulated year through the real simulation
```

In this container, install the Playwright browser and its system dependencies when they
are absent, then run `npm run test:e2e`.

---

## 4. Before touching code

Study the repository first. Never guess its current state from a plan written earlier.

At the start of a work session, inspect at least:

```bash
pwd
git status --short
git branch --show-current
git log --oneline -12
find . -maxdepth 2 -type f | sort | sed -n '1,220p'
cat package.json
```

Then read:

- this `AGENTS.md`,
- the relevant MASTER-spec chapter(s),
- the active plan task,
- the files and tests that the task will modify.

If the repository already contains an implementation pattern for the same kind of feature, follow it unless the active plan explicitly replaces it.

### Worktrees

After the initial repository bootstrap, prefer isolated Git worktrees for substantial feature work so unfinished changes do not contaminate the main working tree.

Never create a worktree before confirming the repository and branch state.

---

## 5. Work discipline

### Complete exactly what was asked

Do not broaden scope without a requirement.

A useful feature idea is not permission to implement it early.

### TDD is the default implementation loop

For feature work and bug fixes:

1. write the smallest meaningful failing test,
2. run it and confirm the expected failure,
3. implement the smallest production-shaped change,
4. run the targeted test and typecheck,
5. run the broader relevant verification,
6. commit the coherent change.

Do not write a test after the implementation merely to make coverage look complete.

### Prefer small, focused files

Each file should have one clear responsibility.

Split by domain responsibility, not arbitrary technical layering.

Avoid god objects, giant reducers, mega-hooks, and simulation modules that know about unrelated systems.

### DRY and YAGNI

- Share stable domain primitives.
- Do not invent generic frameworks for hypothetical future needs.
- Do not duplicate pricing, staffing, or investment rules into separate player and AI implementations when strategy primitives can be shared.

---

## 6. Non-negotiable architecture invariants

### 6.1 React is not the simulation engine

React owns presentation, interaction, local UI state, focus, accessibility behavior, and management surfaces.

React must not own authoritative game rules or authoritative simulation state.

### 6.2 The authoritative simulation runs in a Web Worker from the beginning

The Worker owns:

- authoritative game state,
- simulation time,
- bookings and guests,
- hotel operations,
- AI,
- economy,
- commands,
- domain events,
- save snapshot preparation.

The main thread owns:

- React,
- Pixi rendering,
- user input,
- presentation state,
- audio,
- accessibility surfaces.

Do not move simulation work back to the main thread as a shortcut.

### 6.3 Versioned Worker protocol

Use the MASTER protocol contract.

UI -> Worker message families:

- `INIT_GAME`
- `LOAD_GAME`
- `COMMAND`
- `SET_SPEED`
- `PAUSE`
- `RESUME`
- `REQUEST_SAVE`
- `REQUEST_DETAILS`

Worker -> UI message families:

- `READY`
- `COMMAND_ACCEPTED`
- `COMMAND_REJECTED`
- `STATE_DELTA`
- `SNAPSHOT`
- `DOMAIN_EVENTS`
- `SAVE_DATA`
- `SIMULATION_ERROR`
- `PERF_SAMPLE`

The protocol has an explicit version.

Do not create ad-hoc postMessage payloads outside the typed protocol.

### 6.4 Commands are the mutation boundary

Player and manager actions that change the game state are typed commands.

Each command includes at least:

- `commandId`,
- game time,
- actor,
- payload,
- optional expected state version.

Commands are validated before mutation.

Rejected commands must not change state.

High-impact actions such as acquisitions, loans, and major renovations are transactional.

### 6.5 Domain events describe what happened

Successful commands and simulation transitions emit typed domain events.

Do not couple unrelated systems with direct callbacks if a domain event is the appropriate boundary.

Example: a review can affect reputation, marketing, chronicle, and narrative without the guest subsystem importing all four systems.

### 6.6 UI consumes snapshots or deltas

React/Pixi render immutable snapshots or state deltas from the Worker.

Never mutate Worker-owned state from a component, hook, Pixi scene, or client store.

### 6.7 Stable processing order

Within one simulation tick, preserve the deterministic phase order defined by the MASTER spec:

1. apply commands,
2. advance time,
3. arrivals/departures,
4. room state,
5. staff service,
6. facility throughput,
7. consumption/inventory,
8. maintenance/failures,
9. satisfaction,
10. financial postings,
11. demand/booking updates,
12. events,
13. publish snapshot/delta.

Entities processed within a phase use stable ID ordering where simultaneous ordering matters.

Do not reorder phases casually. A phase-order change is a simulation-contract change and requires determinism/regression review.

---

## 7. Determinism rules

The core promise is:

**same state + same commands + same RNG states = same result.**

### Required RNG discipline

Use seeded, isolated subsystem streams. Canonical stream families include:

- `guests`,
- `staffing`,
- `failures`,
- `economy`,
- `events`,
- `weather`,
- `AI`,
- `narrative`.

A new cosmetic random choice must not alter guest demand, maintenance failures, macroeconomics, or another subsystem's future RNG sequence.

All relevant RNG stream states are savegame state.

### Forbidden nondeterminism in authoritative game code

Under authoritative simulation/domain code, do not use:

- `Math.random()`,
- wall-clock time as game logic input,
- `Date.now()` for deterministic outcomes,
- browser DOM state,
- unordered iteration whose result can change behavior,
- implicit floating-point money accumulation.

If real-world wall time is required for metadata such as a save timestamp, keep it outside deterministic state transitions.

### Replayability

Hard-to-reproduce bugs should be reproducible from:

- a save,
- protocol/save/content versions,
- RNG states,
- a command log.

Prefer fixing the deterministic cause over adding random retries or state resets.

---

## 8. Numeric, money, and finance rules

### Money

Store money as integer minor units:

- Pfennig for DEM,
- cents for EUR-like currencies,
- the appropriate declared minor unit for other currencies.

Never store authoritative money as a JavaScript floating-point major-unit value.

### Rates and percentages

Use explicit fixed-point units where determinism matters, such as basis points for percentages.

Do not mix `0.12`, `12`, and `1200` to represent the same percentage in different modules.

Declare units in types and content schemas.

### Rounding

Rounding is a domain rule, not a UI accident.

- Round prices to the currency minor unit.
- Keep percentages unrounded internally where possible.
- Use the declared rounding rule for tax/finance classes.
- Format only at the presentation edge.

### Financial consistency

When touching accounting or finance:

- preserve ledger integrity,
- distinguish profit from cash flow,
- distinguish CapEx from OpEx,
- preserve debt schedules and payment timing,
- test balance/invariant equations,
- do not make cash the only financial state.

---

## 9. Time and game-calendar rules

The career starts on 1 January 1991.

Plan 01 uses a deterministic 5-simulated-minute quantum. Preserve that contract until a deliberately tested architecture change replaces it.

Hotel operations use an actual game calendar with weekday, month, year, local holidays, seasons, trade fairs, and event calendars as systems are added.

Booking date and stay date are different concepts.

The present-day milestone in the MASTER spec is 2026; reaching it is not a hard stop. Endless continuation is supported by design.

Do not implement historical events by hard-coding future dates after 1991 unless a specifically approved exception exists.

---

## 10. State, saves, compatibility, and recovery

### Version everything that affects compatibility

Persist explicit versions for:

- save schema,
- content,
- Worker protocol.

### Save rules

IndexedDB is the primary local browser store.

Save state must include all authoritative state required for deterministic restore, including RNG streams.

Maintain:

- manual slots,
- monthly autosaves,
- yearly autosaves,
- recovery saves as introduced by the active plan.

### Compatibility

Before the first public release, only the current save, content, and protocol versions
are accepted. Older internal development saves are rejected and require no migration
code or frozen fixtures.

After the first public release (actually state is unreleased), every persistent schema change requires an explicit
migration path and tests/fixtures for published save versions.

Never silently reinterpret an old field with a new meaning.

When content values change, follow the content-compatibility semantics defined by the MASTER spec and Plan 07 rather than assuming old saves should always adopt new balance values.

### Recovery

Invalid saves are validated before play.

A bad guest/event record must not corrupt the entire campaign.

Worker and save failures must surface a recovery path rather than leaving the UI frozen.

---

## 11. Content architecture

Content belongs in data, not UI conditionals.

Use stable IDs such as:

- `city.frankfurt.de`,
- `room.standard.single`,
- `tech.wifi`,
- `facility.breakfast_room`.

Content fields declare units explicitly.

Defaults are centralized; do not duplicate hidden defaults across systems.

Plan 07 introduces schema-first validated content packs and Zod-based validation. Before that plan lands, preserve compatibility with its intended registry boundaries rather than baking content into React components.

After Plan 07, all content families must pass schema and cross-reference validation before build/release.

Never use a localized display name as an authoritative ID.

---

## 12. Product invariants

These are not optional flavor decisions.

### Hotel management remains central

Every major meta-system must eventually affect hotel operation, investment, demand, staffing, cost, service, or decision quality.

Do not turn the project into a detached stock-market, city-builder, or grand-strategy game.

### Singleplayer only

Do not add networking, hotseat, competitive ladders, or multiplayer architecture without an explicit product change.

### Real cities, fictional hotel world

Real cities may be modeled.

Hotels, chains, brands, direct competitors, characters, graphics, and text are fictional.

Do not introduce real hotel brands or copyrighted original assets.

### Alternative history after 1991

The start state is historically plausible.

The future is systemic.

Technology, crises, platforms, market leaders, and business hubs may emerge earlier, later, differently, or not at all.

Do not use fixed decade gates such as "2010 means smartphones".

UI-era changes derive from actual simulated technology/adoption state.

### Modular building, not free wall drawing

Buildings have defined structural envelopes.

Players can convert, combine, split, renovate, unlock, and extend modules where allowed.

Do not turn building into a free-form architecture CAD system.

### Fair AI economics

Competitors may simulate at lower detail, but they use the same relevant economic constraints: demand, wages, rates, credit, property costs, and risk.

Do not give AI hidden money or success bonuses merely because the player is doing well.

### Easy to learn, hard to master

Complex systems need:

- good defaults,
- optional automation,
- clear causality,
- deeper controls for experts.

Do not remove depth to make a feature understandable; improve its explanation and delegation model.

---

## 13. UI and visual design standard

UI work is product design work. Do not treat presentation as a final coat of CSS.

### Required design-intent pass before coding a new major UI surface

Write down, in implementation notes or the working task description:

1. **Purpose** — what decision/problem this screen exists to support and who uses it.
2. **Tone** — choose a deliberate visual direction, not neutral default UI.
3. **Constraints** — performance, accessibility, information density, device/browser realities.
4. **Differentiator** — the single memorable idea that makes this surface belong to this game.

For the overall product, the default direction is:

**Retro-Modern European hotel operations: tactile early-1990s business/hospitality character evolving into a sophisticated modern operating system, while preserving one coherent interaction language.**

The memorable differentiator is:

**the management interface and the living isometric hotel must feel like two views of the same operational reality, not a spreadsheet app placed beside a decorative game scene.**

### Avoid generic SaaS aesthetics

Do not default to:

- uniform rounded cards everywhere,
- dashboard-template grids with no hierarchy,
- arbitrary glassmorphism,
- purple-on-white gradients,
- generic startup illustrations,
- interchangeable admin-panel styling.

Use hospitality, operations, finance, print, keys, ledgers, floorplans, signage, and era-specific business technology as contextual design inspiration without copying protected assets.

### Typography

Do not choose these as primary design typography:

- Arial,
- Inter,
- Roboto,
- system UI stacks,
- Space Grotesk.

Prefer a characterful display face paired with a highly readable body/interface face.

Use fonts with appropriate licensing and robust fallbacks. Do not sacrifice readability or localization coverage for novelty.

Numeric and tabular data need stable alignment and legible figures.

### Color

Define semantic color tokens with CSS variables.

Use a controlled dominant palette with deliberate accents rather than distributing many equally loud colors.

Status meaning must never rely on hue alone.

Reputation, warning, profit/loss, occupancy, room state, and staff state each require consistent semantic treatment.

### Spatial composition

Prefer intentional hierarchy over predictable component repetition.

Management screens may use controlled density; overview and narrative screens may use generous negative space.

Use asymmetry, overlap, vertical rhythm, or grid breaks when they improve emphasis, not as decoration.

The primary action and current operational problem should be visually obvious.

### Motion

Use motion to explain causality, focus, transition, and state change.

Prefer a few orchestrated high-value transitions over constant micro-animation.

Always support reduced-motion preferences.

Animations must not alter simulation timing or block the Worker.

### Micro-interactions

Interactive elements require designed states:

- default,
- hover,
- focus-visible,
- pressed,
- selected,
- disabled,
- loading/pending when applicable,
- warning/error when applicable.

A command awaiting Worker acceptance must not falsely appear committed.

### Era evolution

Visual evolution is driven by simulated adoption and world state, not only calendar year.

The navigation model stays recognizable across decades.

Do not force the player to relearn the information architecture every era.

### Isometric world

Operational problems should be visible in the world whenever reasonable:

- queues,
- dirty rooms,
- out-of-order rooms,
- failed elevators,
- overloaded services,
- absent/idle staff presence,
- facility use.

The isometric layer is not merely decorative telemetry.

---

## 14. Accessibility is architectural

Accessibility is not postponed polish.

Even before Plan 08, do not build UI patterns that make accessibility prohibitively expensive later.

Player-critical actions must have a DOM-accessible path even if Pixi provides the visual representation.

When Plan 08 lands, preserve:

- keyboard navigation,
- intentional focus management,
- semantic DOM representation of hotel interactions,
- text scaling,
- high contrast,
- reduced motion,
- non-color-only cues,
- contextual help,
- notification preferences,
- accessible alternatives for meaningful audio cues.

Do not make a canvas-only control the sole way to perform an important management action.

---

## 15. Localization and text

Authoritative game logic must not depend on localized strings.

Use localization keys for player-facing text once the localization layer exists.

Formatting of date, number, currency, and units is presentation-layer, locale-aware behavior.

Code identifiers, protocol names, domain types, and tests should use clear English names unless an established repository convention says otherwise.

The default seeded localization target in Plan 08 is German and English.

---

## 16. Explainability requirement

The player should understand why important outcomes changed.

For meaningful metrics and alerts, prefer data structures that can expose causal contributors rather than only final values.

Bad:

`Occupancy: 63% (-8%)`

Better model support:

- business demand down,
- competitor room supply up,
- own price above comparable market,
- event uplift,
- reputation effect.

Do not calculate an important KPI through opaque side effects that cannot later explain themselves.

Debug traces and player-facing explanations are different products, but both benefit from explicit causes.

---

## 17. Testing strategy

Tests are part of the architecture.

### Unit tests

Use unit tests for isolated rules such as:

- price elasticity,
- room-state transitions,
- fixed-point money,
- inventory,
- shift capacity,
- technology prerequisites,
- capacity/throughput,
- manager authority.

### System tests

Test causal chains, not merely functions.

Examples:

- lower price -> higher conversion -> higher occupancy -> more housekeeping load,
- low rates + strong demand + cheap land -> more investment,
- overbooking + low no-show realization -> displaced guests -> compensation/reputation consequences.

### Determinism tests

Same seed/state/commands must produce the same state hash and relevant logs.

When changing simulation order, RNG use, or domain iteration, determinism tests are mandatory.

### Save compatibility tests

Current-format save/load, import/export, recovery, and invalid-save rejection require
tests. After the first public release, every migration additionally requires fixtures
and a round-trip or expected-state assertion.

### E2E tests

Critical browser paths must prove actual player behavior, not only component rendering.

At minimum, the evolving suite must cover starting a game, changing a price, bookings/check-in, staffing, monthly close, save/load, and the additional critical paths introduced by each plan.

### Accessibility tests

Use semantic assertions throughout; Plan 08 adds automated Axe/browser coverage.

### Performance and long-run tests

Measure before optimizing.

Plan 09 converts long-run behavior into deterministic benchmark and stress gates.

Do not "fix" a balancing issue by adding unexplained clamps without a domain rationale.

### Release tests

Plan 10 owns the final unified release gate. Do not tag a release while any required gate is failing.

---

## 18. Verification before any completion claim

Never say "done", "fixed", "complete", "green", or equivalent based on confidence.

Run fresh verification evidence in the same work session.

### For a normal task

Use the exact commands specified by the active plan. In addition, inspect available scripts with:

```bash
npm run
```

Typical gates, when present, include:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Also run:

```bash
git diff --check
git status --short
```

Do not invent a success result for a command that was not run.

### Verification reporting

Report:

1. commands executed,
2. exit status/result,
3. failures if any,
4. what remains unverified.

If a gate fails, the task is not complete. Fix the failure or explicitly report the incomplete state.

---

## 19. Git and commit discipline

Prefer one coherent commit per plan task unless the plan explicitly groups steps differently.

Use descriptive conventional prefixes where they fit:

- `feat:` new behavior,
- `fix:` bug correction,
- `test:` verification-only work,
- `perf:` measured performance work,
- `refactor:` behavior-preserving structure change,
- `docs:` documentation,
- `chore:` tooling/scaffolding.

Before committing:

- inspect `git diff`,
- ensure no unrelated files are included,
- run the task's verification,
- confirm generated/debug files are not accidentally staged.

Do not rewrite unrelated history.

Do not tag a release or milestone if verification is failing.

---

## 20. Debugging and observability

Use deterministic evidence before speculation.

For simulation bugs, capture where relevant:

- seed,
- save/content/protocol versions,
- game time,
- command ID and payload,
- domain event sequence,
- RNG stream/draw index,
- relevant state diff.

Prefer root-cause fixes.

Do not mask state corruption with broad try/catch, silent resets, random retries, or arbitrary clamping.

Plan 10 diagnostics exports must remain privacy-safe and local unless the product explicitly adds telemetry later.

---

## 21. Performance budgets

The simulation must never rely on the main thread for heavy computation.

Architecture targets include:

- 60 FPS for the normal hotel view on target hardware,
- no long main-thread blocks caused by simulation,
- normal command acknowledgement in a small double-digit millisecond budget when not fast-forwarding,
- configured visible-agent budgets roughly in the 200-500 range depending on target hardware profile,
- mature campaigns around 60 player hotels, 25+ active cities, 40 competitors, and decades of history,
- bounded save/history growth.

These are targets to measure, not excuses for premature optimization.

Plan 09 defines executable budgets and benchmarks. Once those exist, they replace subjective performance claims.

---

## 22. Original-game parity and IP rules

The project is a spiritual successor, not an asset clone.

Verified original functional terms from the provided C64 material include:

- `STELLEN`,
- `SERVICE`,
- `BANK`,
- `WERBUNG`,
- `HOTELS`,
- `PREISE`,
- `VERSICHERUNG`,
- `VERTRAG`,
- `ZEITUNG`,
- `RENOV`,
- `BANKROTT`,
- a `POOL` reference.

Use the MASTER parity chapters to preserve the strategic function of verified systems.

Do not invent unverified original mechanics as historical fact.

Do not copy protected original graphics, text, audio, hotel brands, or other assets.

Feature parity means preserving meaningful decisions and trade-offs, not merely adding a menu label with the same name.

---

## 23. Scope guardrails and explicit non-goals

Unless the user changes the product direction, do not add:

- multiplayer or hotseat,
- free-form wall-by-wall architecture editing,
- simulation of every individual city resident,
- a full government/political simulator,
- real hotel-brand cloning,
- protected original assets,
- guaranteed post-1991 historical events,
- hidden success-based AI cheats,
- mandatory manual micromanagement of every hotel,
- mandatory construction of every facility,
- a full tax-law simulator,
- an exact real-law database.

A feature that adds complexity but no useful decision, causal feedback, operational consequence, delegation value, or strategic trade-off should be rejected.

---

## 24. Common implementation mistakes to avoid

Do not:

- store authoritative game state in React,
- mutate simulation state directly from UI code,
- bypass commands for convenience,
- send untyped Worker messages,
- use `Math.random()` in simulation/domain code,
- use current wall-clock time to decide deterministic game outcomes,
- store money in major-unit floats,
- let object iteration order change simulation results,
- create a second copy of the same economic rule for AI,
- hard-code technology availability to future calendar years,
- materialize visible guest agents in a way that creates extra demand,
- let old history arrays grow forever,
- perform expensive simulation loops on the main thread,
- encode gameplay content in React component conditionals,
- use display names as IDs,
- make Pixi the only accessible control surface,
- use color as the only state indicator,
- fake a completed Worker command in the UI before acceptance,
- hide failed verification,
- add unexplained balancing clamps,
- silently change save semantics,
- pull Plan N+1 features into Plan N without necessity,
- replace the game's visual identity with a generic admin dashboard.

---

## 25. Definition of done for a plan task

A plan task is complete only when all applicable conditions are true:

- the requested scope is implemented and no unrelated scope was added,
- the planned failing test was observed before implementation when feasible,
- targeted tests pass,
- relevant broader tests pass,
- typecheck passes,
- lint passes if configured,
- build passes when affected,
- deterministic behavior remains reproducible,
- save/content/protocol compatibility is handled when affected,
- accessibility is not regressed,
- visual implementation matches the game's design direction,
- no unresolved placeholder or debug scaffolding remains,
- documentation/plan checkboxes are updated if the workflow requires it,
- `git diff --check` is clean,
- the final status report names what was verified and any remaining risk.

Plan completion additionally requires the plan's own final verification gate.

Release completion requires Plan 10's unified release gate.

---

## 26. Handoff format

When handing work back to the user or another agent, use this order:

1. **Change summary** — what behavior or design changed.
2. **Files changed** — the important paths, not every generated file.
3. **Verification** — exact commands run and results.
4. **Risks/manual checks** — anything not proven automatically.
5. **Next plan/task** — only when the current gate is actually complete.

Be transparent about failures. A partial, accurately reported implementation is better than a false completion claim.

---

## 27. Final principle

The project succeeds when deep simulation and high design craft reinforce each other.

A technically correct feature that is opaque, generic, visually careless, or disconnected from hotel operations is not finished.

A beautiful interface that bypasses deterministic simulation, accessibility, or economic causality is not finished either.

Build both halves as one product.
