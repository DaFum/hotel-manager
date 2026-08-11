# Redundant Release Tests Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove three release-gate assertions that are fully subsumed by the authoritative exact command-list test.

**Architecture:** Keep `src/release/releaseCheck.test.ts` as the single test for release-command membership and ordering. Keep `src/release/releaseVersion.test.ts` focused on semantic-version validation, and preserve every behavioral, migration, replay, performance, accessibility, simulation, and E2E test.

**Tech Stack:** TypeScript, Vitest, npm, Prettier

## Global Constraints

- Delete only tests whose assertions are fully covered by `src/release/releaseCheck.test.ts`.
- Do not delete or modify E2E tests with stale tab-navigation selectors.
- Do not change production code or the release command list.
- Do not rewrite historical implementation plans that record when the redundant tests were introduced.

---

### Task 1: Consolidate release-gate contract coverage

**Files:**
- Delete: `src/release/contentGate.test.ts`
- Delete: `src/release/performanceGate.test.ts`
- Modify: `src/release/releaseVersion.test.ts`
- Preserve: `src/release/releaseCheck.test.ts`

**Interfaces:**
- Consumes: `commandSetForRelease(): string[]` and `assertReleaseVersion(version: string): string` from `src/release/releaseVersion.ts`.
- Produces: one canonical exact-list test for release commands and one focused semantic-version test.

- [ ] **Step 1: Establish the focused baseline**

Run:

```powershell
npm run test:run -- src/release/contentGate.test.ts src/release/performanceGate.test.ts src/release/releaseVersion.test.ts src/release/releaseCheck.test.ts
```

Expected: all four files and all five tests pass before consolidation.

- [ ] **Step 2: Remove only the redundant coverage**

Delete `src/release/contentGate.test.ts` and
`src/release/performanceGate.test.ts`. In
`src/release/releaseVersion.test.ts`, remove exactly this case:

```ts
it("includes the invariant gate", () => {
  expect(commandSetForRelease()).toContain("npm run invariant:sweep");
});
```

Then remove `commandSetForRelease` from that file's import, leaving:

```ts
import { assertReleaseVersion } from "./releaseVersion";
```

Do not change `src/release/releaseCheck.test.ts`; its exact array assertion
continues to cover content validation ordering, both performance commands, and
the invariant sweep.

- [ ] **Step 3: Verify the consolidated release tests**

Run:

```powershell
npm run test:run -- src/release/releaseVersion.test.ts src/release/releaseCheck.test.ts
```

Expected: both files and both tests pass.

- [ ] **Step 4: Verify the remaining unit suite**

Run:

```powershell
npm run test:run -- --exclude src/release/plans0103Conformance.test.ts
```

Expected: the suite passes with no failures. The excluded test is the
independently confirmed CRLF-sensitive repository baseline and is not part of
this cleanup.

- [ ] **Step 5: Verify types and formatting**

Run:

```powershell
npm run typecheck
npx prettier --check src/release/releaseVersion.test.ts docs/superpowers/specs/2026-08-11-redundant-release-tests-cleanup-design.md docs/superpowers/plans/2026-08-11-redundant-release-tests-cleanup.md
git diff --check
```

Expected: every command exits successfully.

- [ ] **Step 6: Review and commit the coherent cleanup**

Run:

```powershell
git diff -- src/release/contentGate.test.ts src/release/performanceGate.test.ts src/release/releaseVersion.test.ts docs/superpowers/plans/2026-08-11-redundant-release-tests-cleanup.md
git status --short
git add -- src/release/contentGate.test.ts src/release/performanceGate.test.ts src/release/releaseVersion.test.ts docs/superpowers/plans/2026-08-11-redundant-release-tests-cleanup.md
git commit -m "test: remove redundant release gate checks"
```

Expected: the diff contains only the approved test consolidation and this
implementation plan, and the commit succeeds.
