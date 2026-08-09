# CLAUDE.md

Working instructions for Claude Code in this repository.

**`AGENTS.md` in this directory is the full rulebook and takes precedence over this file
wherever the two overlap.** Read it before non-trivial work. This file is the short
operating guide: what to run, where things live, and the traps specific to this codebase.

## What this is

A browser-based, singleplayer hotel-management simulation starting in Frankfurt, 1991.
React and Pixi render immutable snapshots; every authoritative rule runs in a deterministic
Web Worker. Design authority, in order: the user, `AGENTS.md`,
`docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`, then the
active plan in `docs/superpowers/plans/`.

Plans 01 (vertical slice), 02 (hotel depth), 03 (city market), 03.5 (conformance),
04 (technology and alternative history) and 05 (multi-hotel company and brands) are
implemented and verified. Plan 06 (emergent campaign and narrative) is next; see
`AGENTS.md` for the exact fresh Plan 05 gate evidence.

## Commands

```bash
npm run test:run                     # unit + system tests (Vitest)
npm run test:run -- src/game/finance # one path while iterating
npm run typecheck
npm run lint                         # prettier --check .
npm run build
npm run test:e2e                     # Playwright; needs a build first
npm run benchmark                    # a simulated year, budget 30s
```

If Playwright's browser or Linux dependencies are absent, install them first:

```bash
npx playwright install chromium
npx playwright install-deps chromium
npm run test:e2e
```

Run `npx prettier --write <paths>` on the files you touched, never `prettier --write .`
without checking `.prettierignore` — `docs/` is deliberately excluded and must not be
reformatted.

## Where things live

| Path                                            | Responsibility                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/game/simulation/GameSimulation.ts`         | the thirteen-phase quantum; all systems are called from here                              |
| `src/game/simulation/simulation.worker.ts`      | the only place the protocol is spoken worker-side                                         |
| `src/app/GameClient.ts`, `src/app/gameStore.ts` | UI-side protocol handle and snapshot mirror                                               |
| `src/game/domain/`                              | money, calendar, ids, RNG streams, protocol, commands, events                             |
| `src/game/content/1991/`                        | Frankfurt, starter hotel, guest segments, suppliers, city market — data, not conditionals |
| `src/game/<system>/`                            | one domain per directory (rooms, staff, revenue, fnb, finance, …)                         |
| `src/game/company/`                             | the corporate layer: portfolio, brands, budgets, treasury, managed hotels                 |
| `src/ui/`, `src/render/`                        | React surfaces and the Pixi scene; presentation only                                      |

## Non-negotiables in this codebase

- **The worker owns the rules.** React never mutates game state; the UI sends typed
  commands and renders snapshots. Never fake an accepted command before the worker says so.
- **Phase order is a contract.** `PHASE_ORDER` mirrors the MASTER spec. Reordering it is a
  simulation-contract change and needs determinism review, not a quick edit.
- **Determinism.** No `Math.random()`, no `Date.now()`, no wall-clock input, no
  order-dependent iteration in `src/game/`. Randomness comes from the seeded per-subsystem
  streams in `src/game/domain/rng.ts`, and every stream's state is saved.
- **Money is integer Pfennig.** Percentages are basis points. Format only at the UI edge
  (`src/ui/money.ts`). Boundaries validate with `Number.isSafeInteger`.
- **Accessibility is structural.** Pixi is decorative; every player action has a DOM path.
  `HotelView` degrades to its room list when no renderer exists.
- **Saves are versioned.** `saveVersion`, `contentVersion`, `protocolVersion` and all RNG
  states travel together; a schema change needs a migration and fixtures. The current
  version is 5; the v5 fixture and the replay corpus are recorded from real runs by
  `scripts/record-save-fixture.ts` and `scripts/record-replay-corpus.ts`, never edited.
- **The treasury never holds money.** `consolidatedCashMinor(treasury)` must always equal
  `finance.cashMinor`; the invariants assert it every quantum.

## How to work

TDD is the default: write the smallest failing test, watch it fail, implement the smallest
production-shaped change, then run the targeted test plus `typecheck`. One coherent commit
per plan task, conventional prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

Never claim done on confidence. Run the gates in the session and report exactly what was
run, what passed, and what remains unverified.
