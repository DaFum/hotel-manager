# Traceability

## Requirement 34: Compliance (Master Chapter 38)

- **Compliance Model**: `src/game/regulation/compliance.ts`
  - Evaluates compliance rules, exposes gap and remediation choices, and applies typed consequence descriptors (`fine`, `restriction`, `closure`, `reputation`).
  - Unit tests in `src/game/regulation/compliance.test.ts`.

- **Content Schema & Authoring**: `src/content-schema/regulation.ts` & `src/game/content/1991/regulation.ts`
  - Defines strict Zod schema for regulation rules and consequence descriptors, integrated into content pack registry.
  - Seeds regulation rules for labor, safety, and accessibility in core content pack (`src/content/core/core-pack.json`).

- **Measured Facts & Simulation Wiring**: `src/game/regulation/measuredFacts.ts` & `src/game/simulation/GameSimulation.ts`
  - Computes pure facts for regulated areas from authoritative game state.
  - Runs monthly rule evaluation in `closeMonth()`, updating persistent `compliance` state.
  - Applies fine ledger entries, reputation deltas, and facility capacity constraints.
  - Emits `COMPLIANCE_BREACH_DETECTED` and `COMPLIANCE_REMEDIED` domain events with chronicle entries.
  - Raises and manages lead-time compliance alerts.
  - Simulation tests in `src/game/simulation/GameSimulation.test.ts`.
