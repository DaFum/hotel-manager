# Scale, Performance & Long-Run Balancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make decades-long simulations with many hotels, cities, competitors, histories, and visible agents stay responsive, bounded, reproducible, and economically plausible.

**Architecture:** Measure first, then introduce explicit simulation detail tiers, compact deltas, history compaction, cooperative fast-forward, and bounded feedback functions. Headless deterministic scenario runners and release budgets turn performance and balance into executable gates instead of subjective observations.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-08 completed and green**.

MASTER-spec coverage: MASTER chapters 30, 33-37, 63-77; implementation decomposition chapter 90. Cross-plan ownership is recorded in `2026-08-09-MASTER-spec-coverage-audit.md`.

## Implementation fidelity rule

Code fragments in this plan demonstrate the first red/green increment only. They are not
the completion definition. A task is complete only when its full scope and MASTER
completion contract are implemented, integrated into commands/events/snapshots and
persistence where applicable, and all focused plus final gates pass. Do not commit the
illustrative minimum as the finished task.

## Scope contract

**In scope**
- Worker performance sampling and measurable budgets
- deterministic headless scenario runner
- full/operational/aggregate detail tiers
- visible-agent materialization budget
- compact state deltas and bounded history growth
- cooperative fast-forward without main-thread stalls
- anti-runaway city, property, labor, technology, and competition checks
- save-size and memory budgets
- developer balancing dashboard
- CI benchmark corpus and 50-year stress simulation

**Explicitly outside this plan**
- new player-facing hotel features
- new narrative content
- release packaging and final parity signoff (Plan 10)

## Locked file map

All paths are relative to the repository root.

```text
src/game/perf/perfSample.ts
src/game/perf/performanceBudget.ts
src/game/simulation/detailTiers.ts
src/game/simulation/materialization.ts
src/game/protocol/stateDelta.ts
src/game/history/historyCompaction.ts
src/game/simulation/fastForward.ts
src/game/balancing/saturation.ts
src/game/balancing/marketBounds.ts
src/game/balancing/technologyBounds.ts
src/game/balancing/marketHealth.ts
src/game/persistence/saveBudget.ts
src/tools/balancing/BalancingDashboard.tsx
scripts/scenarios/runScenario.ts
scripts/scenarios/scenarioCatalog.ts
scripts/benchmark-all.ts
scripts/stress-50-years.ts
e2e/performance-smoke.spec.ts
```

---

### Task 1: Emit Worker performance samples and enforce budgets

**Files:**
- Create: `src/game/perf/perfSample.ts`
- Create: `src/game/perf/performanceBudget.ts`
- Test: `src/game/perf/performanceBudget.test.ts`
- Modify: `src/game/simulation/simulation.worker.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { evaluatePerfSample } from './performanceBudget';

describe('performance budget', () => {
  it('flags an over-budget worker tick', () => {
    expect(evaluatePerfSample({tickMs:35,commandAckMs:8,visibleAgents:200,saveBytes:1000})).toContain('tickMs');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/perf/performanceBudget.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/perf/performanceBudget.ts`:

```ts
export interface PerfSample { tickMs:number; commandAckMs:number; visibleAgents:number; saveBytes:number; }
export const PERF_BUDGET={tickMs:25,commandAckMs:20,visibleAgents:500,saveBytes:25_000_000} as const;
export function evaluatePerfSample(s:PerfSample):string[] { return (Object.keys(PERF_BUDGET) as Array<keyof PerfSample>).filter(k=>s[k]>PERF_BUDGET[k]); }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/perf/performanceBudget.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/perf/perfSample.ts src/game/perf/performanceBudget.test.ts src/game/perf/performanceBudget.ts src/game/simulation/simulation.worker.ts
git commit -m "perf: add measurable worker budgets"
```

---

### Task 2: Create deterministic headless scenario runner

**Files:**
- Create: `scripts/scenarios/runScenario.ts`
- Create: `scripts/scenarios/scenarioCatalog.ts`
- Test: `src/game/simulation/scenarioRunner.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { runScenario } from '../../../scripts/scenarios/runScenario';

describe('scenario runner', () => {
  it('produces the same state hash for the same seed and duration', () => {
    const a=runScenario({seed:42,years:5,scenarioId:'baseline'});
    const b=runScenario({seed:42,years:5,scenarioId:'baseline'});
    expect(a.stateHash).toBe(b.stateHash);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/scenarioRunner.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`scripts/scenarios/runScenario.ts`:

```ts
import { createHash } from 'node:crypto';
export function runScenario(input:{seed:number;years:number;scenarioId:string}) {
  const canonical=JSON.stringify(input);
  return {stateHash:createHash('sha256').update(canonical).digest('hex'),metrics:{years:input.years}};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/scenarioRunner.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add scripts/scenarios/runScenario.ts scripts/scenarios/scenarioCatalog.ts src/game/simulation/scenarioRunner.test.ts
git commit -m "test: add deterministic scenario runner"
```

---

### Task 3: Introduce simulation detail tiers

**Files:**
- Create: `src/game/simulation/detailTiers.ts`
- Test: `src/game/simulation/detailTiers.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { detailTierForHotel } from './detailTiers';

describe('detail tiers', () => {
  it('uses full detail only for the actively viewed property', () => {
    expect(detailTierForHotel({isViewed:true,isPlayerHotel:true})).toBe('full');
    expect(detailTierForHotel({isViewed:false,isPlayerHotel:true})).toBe('operational');
    expect(detailTierForHotel({isViewed:false,isPlayerHotel:false})).toBe('aggregate');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/detailTiers.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/detailTiers.ts`:

```ts
export type DetailTier='full'|'operational'|'aggregate';
export function detailTierForHotel(h:{isViewed:boolean;isPlayerHotel:boolean}):DetailTier { return h.isViewed?'full':h.isPlayerHotel?'operational':'aggregate'; }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/detailTiers.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/simulation/detailTiers.test.ts src/game/simulation/detailTiers.ts
git commit -m "perf: add simulation detail tiers"
```

---

### Task 4: Bound visible-agent materialization without changing demand

**Files:**
- Create: `src/game/simulation/materialization.ts`
- Test: `src/game/simulation/materialization.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { selectVisibleAgents } from './materialization';

describe('agent materialization', () => {
  it('caps visible representatives while preserving total party demand separately', () => {
    const parties=Array.from({length:800},(_,i)=>({id:`p${i}`,priority:i%10}));
    const result=selectVisibleAgents(parties,300);
    expect(result.visible).toHaveLength(300);
    expect(result.totalParties).toBe(800);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/materialization.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/materialization.ts`:

```ts
export function selectVisibleAgents<T extends {id:string;priority:number}>(parties:T[],budget:number) {
  const visible=[...parties].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,budget);
  return {visible,totalParties:parties.length};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/materialization.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/simulation/materialization.test.ts src/game/simulation/materialization.ts
git commit -m "perf: bound visible agents"
```

---

### Task 5: Send compact state deltas instead of full snapshots every update

**Files:**
- Create: `src/game/protocol/stateDelta.ts`
- Test: `src/game/protocol/stateDelta.test.ts`
- Modify: `src/game/simulation/simulation.worker.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { diffRecord } from './stateDelta';

describe('state deltas', () => {
  it('includes only changed top-level keys', () => {
    expect(diffRecord({cash:1,occupancy:2},{cash:1,occupancy:3})).toEqual({occupancy:3});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/protocol/stateDelta.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/protocol/stateDelta.ts`:

```ts
export function diffRecord<T extends Record<string,unknown>>(before:T,after:T):Partial<T> {
  const out:Partial<T>={};
  for(const key of Object.keys(after) as Array<keyof T>) if(!Object.is(before[key],after[key])) out[key]=after[key];
  return out;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/protocol/stateDelta.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/protocol/stateDelta.test.ts src/game/protocol/stateDelta.ts src/game/simulation/simulation.worker.ts
git commit -m "perf: add compact state deltas"
```

---

### Task 6: Compact old history into monthly and yearly aggregates

**Files:**
- Create: `src/game/history/historyCompaction.ts`
- Test: `src/game/history/historyCompaction.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { compactDailyHistory } from './historyCompaction';

describe('history compaction', () => {
  it('replaces old daily points with an aggregate that preserves count and sum', () => {
    const result=compactDailyHistory([{day:'1991-01-01',revenueMinor:100},{day:'1991-01-02',revenueMinor:200}]);
    expect(result).toEqual({count:2,revenueMinor:300,minMinor:100,maxMinor:200});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/history/historyCompaction.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/history/historyCompaction.ts`:

```ts
export function compactDailyHistory(points:Array<{day:string;revenueMinor:number}>) {
  const values=points.map(p=>p.revenueMinor);
  return {count:points.length,revenueMinor:values.reduce((a,b)=>a+b,0),minMinor:values.length?Math.min(...values):0,maxMinor:values.length?Math.max(...values):0};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/history/historyCompaction.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/history/historyCompaction.test.ts src/game/history/historyCompaction.ts
git commit -m "perf: compact historical data"
```

---

### Task 7: Make fast-forward cooperative and interruptible

**Files:**
- Create: `src/game/simulation/fastForward.ts`
- Test: `src/game/simulation/fastForward.test.ts`
- Modify: `src/game/simulation/simulation.worker.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { quantaForBatch } from './fastForward';

describe('fast forward batches', () => {
  it('caps work per worker batch so messages can be serviced', () => {
    expect(quantaForBatch(100_000,500)).toBe(500);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/fastForward.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/fastForward.ts`:

```ts
export function quantaForBatch(requested:number,maxPerBatch:number):number {
  if(requested<0||maxPerBatch<=0) throw new Error('invalid batch');
  return Math.min(requested,maxPerBatch);
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/fastForward.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/simulation/fastForward.test.ts src/game/simulation/fastForward.ts src/game/simulation/simulation.worker.ts
git commit -m "perf: make fast forward cooperative"
```

---

### Task 8: Add bounded city and demand saturation functions

**Files:**
- Create: `src/game/balancing/saturation.ts`
- Test: `src/game/balancing/saturation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { diminishingImpact } from './saturation';

describe('saturation', () => {
  it('has diminishing marginal impact as capacity grows', () => {
    const a=diminishingImpact(100,1000); const b=diminishingImpact(200,1000); const c=diminishingImpact(300,1000);
    expect(b-a).toBeGreaterThan(c-b);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/balancing/saturation.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/balancing/saturation.ts`:

```ts
export function diminishingImpact(capacity:number,scale:number):number {
  if(capacity<=0) return 0;
  return 1-Math.exp(-capacity/Math.max(1,scale));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/balancing/saturation.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/balancing/saturation.test.ts src/game/balancing/saturation.ts
git commit -m "balance: add saturation guards"
```

---

### Task 9: Bound property and labor feedback loops

**Files:**
- Create: `src/game/balancing/marketBounds.ts`
- Test: `src/game/balancing/marketBounds.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { boundedAnnualChangeBasisPoints } from './marketBounds';

describe('market bounds', () => {
  it('caps annual price and wage movement while preserving direction', () => {
    expect(boundedAnnualChangeBasisPoints(9000,2500)).toBe(2500);
    expect(boundedAnnualChangeBasisPoints(-9000,2500)).toBe(-2500);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/balancing/marketBounds.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/balancing/marketBounds.ts`:

```ts
export function boundedAnnualChangeBasisPoints(raw:number,maxAbs:number):number { return Math.max(-maxAbs,Math.min(maxAbs,raw)); }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/balancing/marketBounds.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/balancing/marketBounds.test.ts src/game/balancing/marketBounds.ts
git commit -m "balance: bound market feedback"
```

---

### Task 10: Guard technology diffusion against instant or permanent lock

**Files:**
- Create: `src/game/balancing/technologyBounds.ts`
- Test: `src/game/balancing/technologyBounds.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { boundedAdoptionStep } from './technologyBounds';

describe('technology bounds', () => {
  it('caps one-period adoption change inside zero to one hundred percent', () => {
    expect(boundedAdoptionStep(9800,1000,400)).toBe(10_000);
    expect(boundedAdoptionStep(100, -1000,400)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/balancing/technologyBounds.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/balancing/technologyBounds.ts`:

```ts
export function boundedAdoptionStep(currentBp:number,rawDeltaBp:number,maxStepBp:number):number {
  const delta=Math.max(-maxStepBp,Math.min(maxStepBp,rawDeltaBp));
  return Math.max(0,Math.min(10_000,currentBp+delta));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/balancing/technologyBounds.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/balancing/technologyBounds.test.ts src/game/balancing/technologyBounds.ts
git commit -m "balance: bound technology diffusion"
```

---

### Task 11: Add competitor diversity and market-health invariants

**Files:**
- Create: `src/game/balancing/marketHealth.ts`
- Test: `src/game/balancing/marketHealth.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { marketHealthWarnings } from './marketHealth';

describe('market health', () => {
  it('warns when every competitor is insolvent or one firm owns nearly all supply', () => {
    expect(marketHealthWarnings({activeCompetitors:0,largestShareBasisPoints:10000})).toEqual(['no-active-competitors','extreme-concentration']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/balancing/marketHealth.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/balancing/marketHealth.ts`:

```ts
export function marketHealthWarnings(m:{activeCompetitors:number;largestShareBasisPoints:number}):string[] {
  const out:string[]=[]; if(m.activeCompetitors===0) out.push('no-active-competitors'); if(m.largestShareBasisPoints>=9000) out.push('extreme-concentration'); return out;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/balancing/marketHealth.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/balancing/marketHealth.test.ts src/game/balancing/marketHealth.ts
git commit -m "balance: add market health invariants"
```

---

### Task 12: Enforce save-size and history-memory budgets

**Files:**
- Create: `src/game/persistence/saveBudget.ts`
- Test: `src/game/persistence/saveBudget.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateSaveBudget } from './saveBudget';

describe('save budget', () => {
  it('rejects an uncompressed save above the release budget', () => {
    expect(evaluateSaveBudget(30_000_000)).toEqual({ok:false,maxBytes:25_000_000});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/saveBudget.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/saveBudget.ts`:

```ts
export const MAX_SAVE_BYTES=25_000_000;
export function evaluateSaveBudget(bytes:number){return {ok:bytes<=MAX_SAVE_BYTES,maxBytes:MAX_SAVE_BYTES};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/saveBudget.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/persistence/saveBudget.test.ts src/game/persistence/saveBudget.ts
git commit -m "perf: enforce save size budget"
```

---

### Task 13: Build internal balancing dashboard

**Files:**
- Create: `src/tools/balancing/BalancingDashboard.tsx`
- Test: `src/tools/balancing/BalancingDashboard.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalancingDashboard } from './BalancingDashboard';

describe('BalancingDashboard', () => {
  it('shows supply, ADR, RevPAR, insolvencies, wages, and technology adoption', () => {
    render(<BalancingDashboard metrics={{hotelRooms:1000,adrMinor:15000,revparMinor:11000,insolvencies:2,wageIndex:105,technologyAdoptionBasisPoints:4500}}/>);
    expect(screen.getByText(/1000/)).toBeTruthy(); expect(screen.getByText(/45%/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/tools/balancing/BalancingDashboard.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/tools/balancing/BalancingDashboard.tsx`:

```ts
export function BalancingDashboard({metrics}:{metrics:{hotelRooms:number;adrMinor:number;revparMinor:number;insolvencies:number;wageIndex:number;technologyAdoptionBasisPoints:number}}) {
  return <section aria-label="Balancing dashboard"><p>Rooms {metrics.hotelRooms}</p><p>ADR {metrics.adrMinor}</p><p>RevPAR {metrics.revparMinor}</p><p>Insolvencies {metrics.insolvencies}</p><p>Wage index {metrics.wageIndex}</p><p>Technology {Math.round(metrics.technologyAdoptionBasisPoints/100)}%</p></section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/tools/balancing/BalancingDashboard.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/balancing/BalancingDashboard.test.tsx src/tools/balancing/BalancingDashboard.tsx
git commit -m "feat: add balancing dashboard"
```

---

### Task 14: Add CI benchmark corpus and 50-year stress gate

**Files:**
- Create: `scripts/benchmark-all.ts`
- Create: `scripts/stress-50-years.ts`
- Modify: `package.json`
- Create: `e2e/performance-smoke.spec.ts`

**MASTER completion contract:**

- Corpus covers normal view, fast-forward, close, dense facilities, portfolio, crisis,
  migration/load, and 50-year multi-seed scenarios. Mature scale exercises about 60
  player hotels, 25+ cities, 40 competitors, bounded decades of history, and configured
  200-500 visible-agent profiles without materializing aggregate population.
- Gate main-thread responsiveness, Worker tick/ack latency, delta volume, heap/history,
  save size/load, and economic invariants separately, recording hardware and percentile.
- Representation/detail optimization preserves aggregate economics, declared checkpoint
  hashes, commands, and causal output.

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('hotel view stays interactive during 16x simulation', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'16x'}).click();
  await page.getByRole('button',{name:/room 101/i}).click();
  await expect(page.getByRole('dialog',{name:/room 101/i})).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run benchmark:all && npm run stress:50y && npm run test:e2e -- e2e/performance-smoke.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

Implement a versioned scenario catalog with the completion-contract workloads and
declared seed sets. `benchmark-all.ts` records per-scenario percentiles and compares every
metric to a hardware-profile budget. `stress-50-years.ts` runs the mature-scale scenario,
checks deterministic checkpoint hashes and economic invariants at least yearly, and emits
a machine-readable failure report. Existence of a final hash alone is not a stress gate.

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run benchmark:all && npm run stress:50y && npm run test:e2e -- e2e/performance-smoke.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/performance-smoke.spec.ts package.json scripts/benchmark-all.ts scripts/stress-50-years.ts
git commit -m "perf: add long run release gates"
```

---

## Plan self-review

### Spec coverage
- Worker metrics and budgets -> Task 1.
- Deterministic scenario runner -> Task 2.
- Detail tiers and agent materialization -> Tasks 3-4.
- Compact deltas/history and cooperative fast-forward -> Tasks 5-7.
- Anti-runaway city/market/technology guards -> Tasks 8-11.
- Save and memory budgets -> Task 12.
- Balancing dashboard -> Task 13.
- Benchmark and 50-year stress corpus -> Task 14.

### Consistency gate

Every scoped feature has an executable task, targeted test command and commit boundary. No deferred implementation markers are permitted.

### Final verification gate

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run benchmark:all
npm run stress:50y
```

Expected: every command exits 0. Do not start the next plan while any gate fails.

**Next plan after this gate:** Plan 10 - Final QA & Release Hardening
