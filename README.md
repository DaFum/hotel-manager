# Hotel Manager

A browser-based, singleplayer hotel-management simulation. You take over a fictional
24-room hotel in Frankfurt am Main in January 1991 and run it: set room rates, staff the
shifts, keep housekeeping ahead of the arrivals, order supplies before the breakfast room
runs dry, service the boiler, and answer to the bank at every monthly close.

The long-term goal is a career that grows from one hands-on hotel into an international
group across a systemically evolving alternative history. The 1991 vertical slice
implemented today proves the architecture that the rest of that career is built on.

## Status

Plan 01 — the 1991 single-hotel vertical slice — is complete and its verification gate is
green. The game is playable end to end: bookings arrive, guests check in and out,
breakfast is served, assets wear down, the month closes, and the whole run can be saved
and restored deterministically. Plan 02 (hotel depth and specialization) is next.

## Getting started

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Append `?seed=424242` to the URL to start a specific run. The same seed always produces
the same hotel, so a bug you can reproduce once you can reproduce forever.

## Commands

| Command             | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Vite dev server                                        |
| `npm run build`     | production build                                       |
| `npm run test:run`  | unit and system tests (Vitest)                         |
| `npm run typecheck` | `tsc --noEmit`                                         |
| `npm run lint`      | `prettier --check .`                                   |
| `npm run test:e2e`  | Playwright browser tests against the built preview     |
| `npm run benchmark` | runs a full simulated year through the real simulation |

`test:e2e` needs a build first. Where Playwright has no bundled browser, point it at an
installed one:

```bash
CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

## How it is built

The rules live in a Web Worker; the interface only draws what the worker publishes.

```
React + Pixi  ──commands──▶  Web Worker  ──snapshots──▶  React + Pixi
  (presentation)              (authoritative state, time, rules)
```

- **The worker owns the game.** React never mutates simulation state. Player actions are
  typed commands that the worker validates and either accepts or rejects; the UI renders
  immutable snapshots and never fakes an outcome before the worker confirms it.
- **Time is a fixed quantum.** Every step advances five simulated minutes through thirteen
  phases in a locked order — commands, time, arrivals, room state, staff service, facility
  throughput, inventory, maintenance, satisfaction, finance, demand, events, snapshot.
- **Determinism is the core promise.** Same state plus same commands plus same RNG states
  produces the same result. No `Math.random()`, no wall-clock input, no order-dependent
  iteration in game code; randomness comes from seeded per-subsystem streams whose states
  travel with the save.
- **Money is integer Pfennig,** percentages are basis points, and formatting happens only
  at the presentation edge.
- **Accessibility is structural.** The isometric Pixi view is decorative — every action has
  a DOM path, and the hotel view degrades to a room list when no renderer is available.
- **Saves are versioned.** Save schema, content, and protocol versions travel together with
  every RNG stream state, so a restored game continues bit-for-bit.

### Layout

```text
src/app/              React shell, worker handle, snapshot store
src/game/domain/      money, calendar, ids, RNG streams, protocol, commands, events
src/game/content/1991/  Frankfurt, starter hotel, guest segments, suppliers
src/game/<system>/    rooms, staff, purchasing, bookings, revenue, guests, fnb,
                      maintenance, finance, building, explanations
src/game/simulation/  clock, invariants, initial state, the quantum, the worker
src/game/persistence/ versioned IndexedDB saves
src/render/, src/ui/  isometric scene and React management surfaces
e2e/, scripts/        Playwright journey, deterministic benchmark
```

## Design documents

The canonical specification is
`docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`. The work is
sequenced through ten gated plans in `docs/superpowers/plans/`; no plan starts before the
previous one's gate is green.

Contributors and coding agents should read `AGENTS.md` first — it is the repository
rulebook. `CLAUDE.md` is the short operating guide for day-to-day work.

## Scope

Singleplayer only. Real cities are modelled; hotels, brands, competitors, and characters
are fictional. History after 1991 is systemic rather than scripted — technology, crises,
and market leaders emerge from the simulation instead of from fixed calendar dates.

## Tech

React 19, TypeScript, Vite, PixiJS 8, a native Web Worker, IndexedDB, Vitest, React
Testing Library, and Playwright.
