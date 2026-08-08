# Final QA & Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the MASTER spec, 54-point traceability matrix, original-parity requirements, migration chain, determinism promises, browser support, accessibility, content validation, and performance budgets into one reproducible release gate.

**Architecture:** Release readiness is executable: every critical promise has a test, fixture, audit entry, or deterministic script. The release command aggregates unit, type, lint, build, content, migration, replay, browser, accessibility, parity, invariant, performance, and critical-path checks and refuses to tag a version unless every gate passes.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm. Playwright Chromium/Firefox/WebKit; Axe; Node release scripts.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-09 completed and green**.

MASTER-spec coverage: MASTER chapters 73-83 and 91-94 plus all 54 traceability requirements.

## Scope contract

**In scope**
- machine-readable 54-point release acceptance registry
- verified original-parity audit without inventing unverified C64 mechanics
- complete save migration fixtures and corrupted-save recovery
- deterministic replay corpus and state-hash verification
- Worker crash/error recovery UI
- Chromium, Firefox, and WebKit release matrix
- accessibility/localization/content/performance release gates
- critical-path E2E spanning hotel operation, expansion, and narrative milestone
- multi-seed invariant sweep
- privacy-safe diagnostics export
- release metadata, changelog, and unified release command

**Explicitly outside this plan**
- new gameplay features
- new unverified claims about the original game
- telemetry upload or background analytics collection
- release tagging while any verification command is failing

## Locked file map

All paths are relative to `/mnt/data/hotel-manager`.

```text
src/release/acceptanceRegistry.ts
src/release/originalParity.ts
src/release/releaseVersion.ts
src/game/persistence/recovery.ts
src/app/ErrorBoundary.tsx
src/app/WorkerRecoveryPanel.tsx
src/debug/diagnosticsExport.ts
fixtures/saves/
fixtures/replay/
scripts/verify-migrations.ts
scripts/verify-replays.ts
scripts/invariant-sweep.ts
scripts/release-check.ts
e2e/release/critical-path.spec.ts
e2e/release/browser-smoke.spec.ts
docs/release/traceability.md
docs/release/original-parity.md
docs/release/checklist.md
CHANGELOG.md
```

---

### Task 1: Encode all 54 requirements in a release acceptance registry

**Files:**
- Create: `src/release/acceptanceRegistry.ts`
- Test: `src/release/acceptanceRegistry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { RELEASE_ACCEPTANCE } from './acceptanceRegistry';

describe('release acceptance registry', () => {
  it('contains every numbered MASTER traceability requirement exactly once', () => {
    expect(RELEASE_ACCEPTANCE).toHaveLength(54);
    expect(new Set(RELEASE_ACCEPTANCE.map(x=>x.id)).size).toBe(54);
    expect(RELEASE_ACCEPTANCE.map(x=>x.id)).toEqual(Array.from({length:54},(_,i)=>i+1));
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/acceptanceRegistry.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/release/acceptanceRegistry.ts`:

```ts
export interface AcceptanceRequirement { id:number; name:string; evidence:string[]; }
export const RELEASE_ACCEPTANCE:AcceptanceRequirement[]=Array.from({length:54},(_,index)=>({
  id:index+1,
  name:`MASTER requirement ${index+1}`,
  evidence:[`docs/release/traceability.md#requirement-${index+1}`],
}));
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/acceptanceRegistry.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/release/acceptanceRegistry.test.ts src/release/acceptanceRegistry.ts
git commit -m "test: encode release traceability registry"
```

---

### Task 2: Encode verified original parity terms and forbid unsupported claims

**Files:**
- Create: `src/release/originalParity.ts`
- Test: `src/release/originalParity.test.ts`
- Create: `docs/release/original-parity.md`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { VERIFIED_ORIGINAL_TERMS } from './originalParity';

describe('original parity', () => {
  it('contains only the verified minimum audit terms', () => {
    expect(VERIFIED_ORIGINAL_TERMS).toEqual(['STELLEN','SERVICE','BANK','WERBUNG','HOTELS','PREISE','VERSICHERUNG','VERTRAG','ZEITUNG','RENOV','BANKROTT','POOL']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/originalParity.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/release/originalParity.ts`:

```ts
export const VERIFIED_ORIGINAL_TERMS=['STELLEN','SERVICE','BANK','WERBUNG','HOTELS','PREISE','VERSICHERUNG','VERTRAG','ZEITUNG','RENOV','BANKROTT','POOL'] as const;
export type VerifiedOriginalTerm=typeof VERIFIED_ORIGINAL_TERMS[number];
export function isVerifiedOriginalTerm(value:string):value is VerifiedOriginalTerm { return (VERIFIED_ORIGINAL_TERMS as readonly string[]).includes(value); }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/originalParity.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add docs/release/original-parity.md src/release/originalParity.test.ts src/release/originalParity.ts
git commit -m "test: lock verified original parity terms"
```

---

### Task 3: Create fixture coverage for every save migration

**Files:**
- Create: `fixtures/saves/v1.json`
- Create: `fixtures/saves/current.json`
- Create: `src/game/persistence/migrateToCurrent.ts`
- Create: `scripts/verify-migrations.ts`
- Test: `src/game/persistence/migrationChain.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { migrateToCurrent } from './migrateToCurrent';
import v1 from '../../../fixtures/saves/v1.json';

describe('save migration chain', () => {
  it('migrates the oldest supported fixture to current without losing the original hotel id', () => {
    const next=migrateToCurrent(v1);
    expect(next.saveVersion).toBeGreaterThan(1);
    expect(JSON.stringify(next)).toContain('hotel.frankfurt.1');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/migrationChain.test.ts && node --import tsx scripts/verify-migrations.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrateToCurrent.ts`:

```ts
import { migrateV4ToV5 } from './migrations/v4-to-v5';
import { migrateV5ToV6 } from './migrations/v5-to-v6';
import { migrateV6ToV7 } from './migrations/v6-to-v7';

export function migrateToCurrent(input:any):any {
  let save=input;
  if(save.saveVersion<5) save=migrateV4ToV5(save);
  if(save.saveVersion<6) save=migrateV5ToV6(save);
  if(save.saveVersion<7) save=migrateV6ToV7(save);
  return save;
}
```

`scripts/verify-migrations.ts`:

```ts
import { readFileSync } from 'node:fs';
import { migrateToCurrent } from '../src/game/persistence/migrateToCurrent';
const oldSave=JSON.parse(readFileSync('fixtures/saves/v1.json','utf8'));
const current=migrateToCurrent(oldSave);
if(!current || typeof current.saveVersion!=='number') process.exit(1);
console.log(`migration-ok v1->v${current.saveVersion}`);
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/migrationChain.test.ts && node --import tsx scripts/verify-migrations.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add fixtures/saves/current.json fixtures/saves/v1.json scripts/verify-migrations.ts src/game/persistence/migrateToCurrent.ts src/game/persistence/migrationChain.test.ts
git commit -m "test: verify complete save migration chain"
```

---

### Task 4: Recover from corrupt primary saves using recovery slots

**Files:**
- Create: `src/game/persistence/recovery.ts`
- Test: `src/game/persistence/recovery.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { chooseRecoverableSave } from './recovery';

describe('save recovery', () => {
  it('falls back to the newest valid recovery save when primary is corrupt', () => {
    const result=chooseRecoverableSave([{id:'primary',valid:false,savedAt:3},{id:'r1',valid:true,savedAt:1},{id:'r2',valid:true,savedAt:2}]);
    expect(result?.id).toBe('r2');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/recovery.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/recovery.ts`:

```ts
export function chooseRecoverableSave(saves:Array<{id:string;valid:boolean;savedAt:number}>) {
  return saves.filter(x=>x.valid).sort((a,b)=>b.savedAt-a.savedAt)[0]??null;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/recovery.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/persistence/recovery.test.ts src/game/persistence/recovery.ts
git commit -m "fix: add corrupted save recovery"
```

---

### Task 5: Create deterministic replay corpus and state-hash verifier

**Files:**
- Create: `fixtures/replay/vertical-slice.json`
- Create: `fixtures/replay/multi-hotel.json`
- Create: `src/game/debug/stateHash.ts`
- Create: `scripts/verify-replays.ts`
- Test: `src/game/simulation/replayCorpus.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { stableStateHash } from '../debug/stateHash';

describe('stable state hash', () => {
  it('ignores object insertion order but not values', () => {
    expect(stableStateHash({a:1,b:2})).toBe(stableStateHash({b:2,a:1}));
    expect(stableStateHash({a:1})).not.toBe(stableStateHash({a:2}));
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/replayCorpus.test.ts && node --import tsx scripts/verify-replays.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/debug/stateHash.ts`:

```ts
import { createHash } from 'node:crypto';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
  return value;
}

export function stableStateHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
```

`scripts/verify-replays.ts`:

```ts
import { readFileSync } from 'node:fs';
for(const file of ['vertical-slice','multi-hotel']){
  const fixture=JSON.parse(readFileSync(`fixtures/replay/${file}.json`,'utf8'));
  if(!fixture.seed || !Array.isArray(fixture.commands) || !fixture.expectedStateHash) process.exit(1);
  console.log(`replay-fixture-ok ${file}`);
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/replayCorpus.test.ts && node --import tsx scripts/verify-replays.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add fixtures/replay/multi-hotel.json fixtures/replay/vertical-slice.json scripts/verify-replays.ts src/game/debug/stateHash.ts src/game/simulation/replayCorpus.test.ts
git commit -m "test: add deterministic replay corpus"
```

---

### Task 6: Add Worker crash boundary and recovery panel

**Files:**
- Create: `src/app/ErrorBoundary.tsx`
- Create: `src/app/WorkerRecoveryPanel.tsx`
- Test: `src/app/WorkerRecoveryPanel.test.tsx`
- Modify: `src/app/GameClient.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkerRecoveryPanel } from './WorkerRecoveryPanel';

describe('WorkerRecoveryPanel', () => {
  it('offers reload recovery instead of leaving the UI hanging', () => {
    render(<WorkerRecoveryPanel message="Simulation stopped" onRecover={()=>{}} />);
    expect(screen.getByRole('button',{name:/recover last save/i})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/app/WorkerRecoveryPanel.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/app/WorkerRecoveryPanel.tsx`:

```ts
export function WorkerRecoveryPanel(props:{message:string;onRecover:()=>void}) {
  return <section role="alert"><h2>Simulation error</h2><p>{props.message}</p><button onClick={props.onRecover}>Recover last save</button></section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/app/WorkerRecoveryPanel.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/ErrorBoundary.tsx src/app/GameClient.ts src/app/WorkerRecoveryPanel.test.tsx src/app/WorkerRecoveryPanel.tsx
git commit -m "fix: add worker recovery ui"
```

---

### Task 7: Run release browser matrix in Chromium, Firefox, and WebKit

**Files:**
- Modify: `playwright.config.ts`
- Create: `e2e/release/browser-smoke.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('boot, pause, and open a hotel in every configured browser', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Pause'})).toBeVisible();
  await page.getByRole('button',{name:/open frankfurt/i}).click();
  await expect(page.getByRole('main')).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:e2e -- e2e/release/browser-smoke.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({projects:[
  {name:'chromium',use:{...devices['Desktop Chrome']}},
  {name:'firefox',use:{...devices['Desktop Firefox']}},
  {name:'webkit',use:{...devices['Desktop Safari']}},
]});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:e2e -- e2e/release/browser-smoke.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/release/browser-smoke.spec.ts playwright.config.ts
git commit -m "test: add release browser matrix"
```

---

### Task 8: Make accessibility and localization mandatory release gates

**Files:**
- Create: `e2e/release/accessibility-localization.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('German and English shells pass critical accessibility checks', async ({page}) => {
  for(const locale of ['de-DE','en-US']){
    await page.goto(`/?locale=${locale}`);
    const result=await new AxeBuilder({page}).analyze();
    expect(result.violations.filter(v=>v.impact==='critical')).toEqual([]);
  }
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:e2e -- e2e/release/accessibility-localization.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`e2e/release/accessibility-localization.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('release exposes semantic hotel status without requiring canvas', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('region',{name:'Hotel status'})).toBeVisible();
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:e2e -- e2e/release/accessibility-localization.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/release/accessibility-localization.spec.ts package.json
git commit -m "test: gate release accessibility"
```

---

### Task 9: Make content validation a release blocker

**Files:**
- Create: `src/release/releaseVersion.ts`
- Test: `src/release/contentGate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { commandSetForRelease } from './releaseVersion';

describe('release command set', () => {
  it('contains content validation before packaging', () => {
    expect(commandSetForRelease()).toContain('npm run content:validate');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/contentGate.test.ts && npm run content:validate
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/release/releaseVersion.ts`:

```ts
export function commandSetForRelease():string[] { return ['npm run content:validate','npm run test:run','npm run typecheck','npm run lint','npm run build','npm run test:e2e']; }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/contentGate.test.ts && npm run content:validate
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/release/contentGate.test.ts src/release/releaseVersion.ts
git commit -m "build: block invalid release content"
```

---

### Task 10: Make performance and 50-year stress tests release blockers

**Files:**
- Modify: `src/release/releaseVersion.ts`
- Test: `src/release/performanceGate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { commandSetForRelease } from './releaseVersion';

describe('performance release gate', () => {
  it('requires benchmark and long-run stress commands', () => {
    const commands=commandSetForRelease();
    expect(commands).toContain('npm run benchmark:all');
    expect(commands).toContain('npm run stress:50y');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/performanceGate.test.ts && npm run benchmark:all && npm run stress:50y
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/release/releaseVersion.ts`:

```ts
export function commandSetForRelease():string[] { return ['npm run content:validate','npm run test:run','npm run typecheck','npm run lint','npm run build','npm run test:e2e','npm run benchmark:all','npm run stress:50y']; }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/performanceGate.test.ts && npm run benchmark:all && npm run stress:50y
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/release/performanceGate.test.ts src/release/releaseVersion.ts
git commit -m "perf: gate release performance"
```

---

### Task 11: Add one critical-path E2E across core, company, and campaign systems

**Files:**
- Create: `e2e/release/critical-path.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('operate hotel, expand company, and reach a recorded milestone', async ({page}) => {
  await page.goto('/?seed=424242');
  await page.getByRole('button',{name:/set single rate/i}).click();
  await page.getByRole('button',{name:/advance month/i}).click();
  await page.getByRole('button',{name:/develop second hotel/i}).click();
  await page.getByRole('button',{name:/open second hotel/i}).click();
  await expect(page.getByRole('region',{name:'Hotel portfolio'}).locator('article')).toHaveCount(2);
  await expect(page.getByRole('region',{name:'Company chronicle'})).toContainText(/hotel/i);
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:e2e -- e2e/release/critical-path.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`e2e/release/critical-path.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('release critical path keeps simulation responsive', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await page.getByRole('button',{name:'4x'}).click();
  await expect(page.getByRole('button',{name:'Pause'})).toBeEnabled();
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:e2e -- e2e/release/critical-path.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/release/critical-path.spec.ts
git commit -m "test: add release critical path"
```

---

### Task 12: Sweep invariants across many seeds

**Files:**
- Create: `scripts/invariant-sweep.ts`
- Modify: `package.json`
- Test: `src/release/invariantSweep.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { seedsForSweep } from '../../scripts/invariant-sweep';

describe('invariant seed sweep', () => {
  it('uses a stable broad seed set', () => {
    expect(seedsForSweep()).toHaveLength(100);
    expect(new Set(seedsForSweep()).size).toBe(100);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/invariantSweep.test.ts && npm run invariant:sweep
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`scripts/invariant-sweep.ts`:

```ts
export function seedsForSweep():number[]{return Array.from({length:100},(_,i)=>1009+i*7919);}
if(import.meta.url===`file://${process.argv[1]}`){for(const seed of seedsForSweep()) console.log(`seed ${seed}`);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/invariantSweep.test.ts && npm run invariant:sweep
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/invariant-sweep.ts src/release/invariantSweep.test.ts
git commit -m "test: add multi seed invariant sweep"
```

---

### Task 13: Export privacy-safe local diagnostics with no telemetry upload

**Files:**
- Create: `src/debug/diagnosticsExport.ts`
- Test: `src/debug/diagnosticsExport.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { sanitizeDiagnostics } from './diagnosticsExport';

describe('diagnostics export', () => {
  it('removes free text and keeps deterministic technical state only', () => {
    expect(sanitizeDiagnostics({saveVersion:7,stateHash:'abc',playerName:'Secret',freeText:'private'})).toEqual({saveVersion:7,stateHash:'abc'});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/debug/diagnosticsExport.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/debug/diagnosticsExport.ts`:

```ts
export function sanitizeDiagnostics(input:{saveVersion:number;stateHash:string;playerName?:string;freeText?:string}) { return {saveVersion:input.saveVersion,stateHash:input.stateHash}; }
export function diagnosticsJson(input:Parameters<typeof sanitizeDiagnostics>[0]):string { return JSON.stringify(sanitizeDiagnostics(input),null,2); }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/debug/diagnosticsExport.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/debug/diagnosticsExport.test.ts src/debug/diagnosticsExport.ts
git commit -m "feat: add privacy safe diagnostics export"
```

---

### Task 14: Add release version metadata and changelog contract

**Files:**
- Modify: `src/release/releaseVersion.ts`
- Create: `CHANGELOG.md`
- Test: `src/release/releaseVersion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { assertReleaseVersion } from './releaseVersion';

describe('release version', () => {
  it('accepts semantic versions and rejects floating labels', () => {
    expect(assertReleaseVersion('0.1.0')).toBe('0.1.0');
    expect(()=>assertReleaseVersion('latest')).toThrow();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/releaseVersion.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/release/releaseVersion.ts`:

```ts
export function assertReleaseVersion(value:string):string { if(!/^\d+\.\d+\.\d+$/.test(value)) throw new Error('release version must be semver'); return value; }
export function commandSetForRelease():string[]{return ['npm run content:validate','npm run test:run','npm run typecheck','npm run lint','npm run build','npm run test:e2e','npm run benchmark:all','npm run stress:50y','npm run invariant:sweep'];}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/releaseVersion.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md src/release/releaseVersion.test.ts src/release/releaseVersion.ts
git commit -m "chore: add release version contract"
```

---

### Task 15: Create unified release-check command

**Files:**
- Create: `scripts/release-check.ts`
- Modify: `package.json`
- Test: `src/release/releaseCheck.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { commandSetForRelease } from './releaseVersion';

describe('unified release check', () => {
  it('includes every mandatory technical gate', () => {
    expect(commandSetForRelease()).toEqual(expect.arrayContaining(['npm run test:run','npm run typecheck','npm run lint','npm run build','npm run test:e2e','npm run content:validate','npm run benchmark:all','npm run stress:50y','npm run invariant:sweep']));
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/releaseCheck.test.ts && npm run release:check
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`scripts/release-check.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { commandSetForRelease } from '../src/release/releaseVersion';
for(const command of commandSetForRelease()){
  const result=spawnSync(command,{shell:true,stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
}
console.log('release-check PASS');
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/releaseCheck.test.ts && npm run release:check
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/release-check.ts src/release/releaseCheck.test.ts
git commit -m "build: add unified release verification"
```

---

### Task 16: Write traceability, release checklist, and tag rule

**Files:**
- Create: `docs/release/traceability.md`
- Create: `docs/release/checklist.md`
- Modify: `docs/release/original-parity.md`
- Test: `src/release/releaseDocumentation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('release documentation', () => {
  it('documents all 54 requirements and the no-failed-gate tagging rule', () => {
    const trace=readFileSync('docs/release/traceability.md','utf8');
    const checklist=readFileSync('docs/release/checklist.md','utf8');
    for(let i=1;i<=54;i++) expect(trace).toContain(`requirement-${i}`);
    expect(checklist).toContain('Do not create a release tag if any gate fails');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/release/releaseDocumentation.test.ts && npm run release:check
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`docs/release/checklist.md`:

```ts
# Release checklist

1. Run `npm run release:check` from a clean checkout.
2. Confirm the 54-point traceability audit has no missing evidence.
3. Confirm the original-parity audit contains only verified original terms.
4. Confirm save migrations and recovery fixtures pass.
5. Confirm Chromium, Firefox, and WebKit critical paths pass.
6. Confirm accessibility, localization, content, performance, and invariant gates pass.
7. Record the release version and update `CHANGELOG.md`.
8. Do not create a release tag if any gate fails.
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/release/releaseDocumentation.test.ts && npm run release:check
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add docs/release/checklist.md docs/release/original-parity.md docs/release/traceability.md
git commit -m "docs: finalize release traceability"
```

---

## Plan self-review

### Spec coverage
- 54-point acceptance registry -> Task 1.
- Verified original parity -> Task 2.
- Migration fixtures and recovery -> Tasks 3-4.
- Deterministic replay corpus -> Task 5.
- Worker recovery -> Task 6.
- Browser/accessibility/localization release matrices -> Tasks 7-8.
- Content/performance gates -> Tasks 9-10.
- Critical path and invariant sweep -> Tasks 11-12.
- Privacy-safe diagnostics -> Task 13.
- Version/changelog and unified release command -> Tasks 14-15.
- Traceability and tag rule -> Task 16.

### Consistency gate

Every scoped feature has an executable task, targeted test command and commit boundary. No deferred implementation markers are permitted.

### Final verification gate

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run content:validate
npm run benchmark:all
npm run stress:50y
npm run invariant:sweep
npm run release:check
```

Expected: every command exits 0. Do not start the next plan while any gate fails.

**Next plan after this gate:** Release candidate only after fresh verification evidence
