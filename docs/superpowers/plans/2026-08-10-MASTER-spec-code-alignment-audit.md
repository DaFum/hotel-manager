# MASTER Specification to Code Alignment Audit

**Audit date:** 2026-08-10
**Canonical source:** `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`
**Audited tree:** `f9ae152`

This is a code audit, not a plan audit. The
[2026-08-09 coverage audit](2026-08-09-MASTER-spec-coverage-audit.md) asked
whether a plan _owned_ each MASTER chapter. This one asks the next question:
for the chapters whose plans are marked implemented, does the running game
actually contain the rule, and can the player reach it?

## Method

1. Read MASTER Chapters 1-95 and extracted the behavioural contracts.
2. Read the authoritative state (`src/game/simulation/initialState.ts`), the
   quantum (`src/game/simulation/GameSimulation.ts`), the command union
   (`src/game/commands/commandEnvelope.ts`) and the domain directories.
3. Counted, for every `export function` under `src/game/`, its references
   outside its own file across production code, `scripts/` and `e2e/` — tests
   excluded, because a rule proven only by its own unit test is a rule the game
   does not run.

That last check is the sharpest instrument in this audit and its headline
number is the finding this document exists for:

> **196 of 597 exported rule functions under `src/game/` (33%) have no caller
> anywhere outside their own file and their own tests.**

The systems concerned are not fringe: insurance, marketing campaigns, the
sales pipeline, CRM and loyalty redemption, negotiated corporate accounts,
allotments, rate plans and restrictions, the automatic revenue manager,
displacement costs, the cash-flow statement, the balance sheet, receivables,
the debt schedule, insolvency, compliance evaluation, supplier contracts and
reorder rules, kitchen service, food waste, menu engineering, and the
engineering work queue.

They are implemented, unit-tested and dead. That is why the gates are green
and the game is nevertheless a smaller product than the specification
describes: the gates prove the rules are correct, not that they are wired in.

## What is aligned

The audit found no divergence in the architecture contracts, which is the
part the earlier gates really do prove:

- the worker owns authoritative state; React sends typed commands and renders
  snapshots (MASTER 59, 66, 67),
- `PHASE_ORDER` mirrors MASTER 64 exactly,
- money is integer minor units, percentages are basis points, and the
  boundaries assert it (MASTER 65),
- RNG is seeded per subsystem and every stream state is saved (MASTER 63),
- saves are versioned with contiguous migrations and recorded fixtures
  (MASTER 72),
- content is a schema-validated pack with stable IDs (MASTER 70, 71),
- localization, accessibility preferences, notification control and audio
  settings exist as real surfaces (MASTER 54, 57, 58, 78),
- the isometric layer is presentation-only and every action has a DOM path
  (MASTER 55.1, 57.9).

## Open points

Each row is filed as its own issue. UI-side gaps (navigation, dashboards, the
isometric world) were already filed as issues #24-#50 against the canvas brief
and are deliberately not repeated here; these rows are engine-side.

| # | MASTER | Open point |
| --- | --- | --- |
| 1 | 4.3 | Six of the seven sandbox levers are validated, frozen and persisted, and read by nothing |
| 2 | 4.5, 22.15 | Five of the eight recovery measures are refused at the command boundary |
| 3 | 22.2, 22.13 | Taxes are not a P&L line, an account class or a cash position |
| 4 | 22.3, 22.4, 22.12 | Receivables, the cash-flow statement and the balance sheet are never posted or produced |
| 5 | 22.7-22.11, 61.1 | No financing decision: no loan command, no credit standing, no covenants |
| 6 | 24 | Insurance cannot be bought, varied or claimed against |
| 7 | 25 | Marketing, the sales pipeline, CRM and loyalty redemption are unreachable |
| 8 | 7.3-7.12 | Rate plans, restrictions, overbooking and the automatic revenue manager are inert; GOPPAR does not exist |
| 9 | 6.10-6.15 | Corporate contracts, group blocks, allotments and channel inventory are unreachable |
| 10 | 18.4-18.12 | Hiring is the only staff decision; no leaving, rostering, training or promotion command |
| 11 | 9.7-9.10 | Housekeeping has one order type, no prioritisation and no separate inspection |
| 12 | 27.3-27.5 | Utility contracts, efficiency investment and outages are unreachable |
| 13 | 38.3 | Compliance is never evaluated, so a breach has no fine, order or closure |
| 14 | 2.6, 40.1, 53, 68 | Only the flagship hotel is operationally simulated; the state holds one hotel and one city |

## Reading the ownership question

Rows 1-13 are wiring, not architecture: the rule exists and correct, and what
is missing is a command, a call site in the quantum, and the save consequence
of whatever new authoritative state that needs.

Row 14 is different in kind. `GameState` names `hotel`, `cityMarket` and
`competitors` in the singular, while MASTER 68 names `hotels`, `cities`,
`laborMarkets` and `transport` as collections and MASTER 75.6 sets the mature
target at 60 hotels across 25+ cities. Portfolio houses currently exist as
`ManagedHotelRecord` aggregates that publish a monthly result upward. That is
a legitimate simulation-depth choice under MASTER 33.3 for _competitors_, but
MASTER 40.1 says every hotel of the group remains its own operating unit, and
MASTER 53 requires a drilldown down to the individual room. Closing that row is
a state-shape change with a migration, not a wiring task, and it should be
planned as such rather than attempted alongside the others.

### Row 14 decision and feasibility gate (2026-08-12)

The project-owner decision is to **keep the full MASTER specification**, not
to redefine the product as one flagship plus permanently aggregate portfolio
hotels. The collection migration and tiered per-hotel engine therefore remain
required before release.

`npm run benchmark:multi-hotel` measured the Phase 1 prototype against the
executable `PERF_BUDGET` on the current container. The workable 60-hotel mix is
one viewed `full` hotel, four `operational` hotels and 55 `aggregate` hotels.
The full sample used two independent hotels through the real
`GameSimulation.advanceQuantum()` loop; operational work used four independent
real simulations at the hourly cadence; aggregate work used the existing
`managedHotelMonth` economics and was amortised over the month. The measured
projected mean was 0.54 ms per global quantum against the 25 ms budget. This is
a feasibility result, not proof of the Phase 3 integrated loop: Phase 3 must
retain the same tier cap and rerun the benchmark after its phase gating exists.

The proposed whole `hotels` and `cities` collection sections produced a
2,182,873-byte delta when one hotel changed, against the 250,000-byte budget.
Task 4.2 must therefore partition publication to the active hotel plus
company-level aggregates (or provide equivalently bounded hotel-level delta
sections); publishing the whole hotel collection on each change is rejected.
