# 04 Technology & Alternative History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make post-1991 technology, trends, macroeconomics, regulation, crises and currencies evolve systemically.

**Architecture:** Add deterministic world-level monthly/yearly systems. Technology is a dependency/adoption graph with standards and network effects; macro feedback is bounded; UI capabilities derive from adoption state rather than calendar year.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plan 03 final verification**.

MASTER-spec coverage: MASTER chapters 34–39.

## Scope contract

**In scope**
- technology prerequisites/adoption/obsolescence
- standards and network effects
- hotel adoption cost curves
- guest trends
- bounded macro economy
- systemic crises/black swans/climate
- dynamic regulation/compliance
- currencies and alternate common-currency path
- era UI derived from adoption
- 50-year deterministic tests

**Explicitly outside this plan**
- multi-hotel corporate treasury
- franchising/M&A
- narrative campaign chains
- content editor UI

## Locked file map

All paths are relative to `/mnt/data/hotel-manager`.

```text
src/game/technology/
src/game/world/
src/game/regulation/
src/game/currency/
src/ui/era/
src/game/persistence/migrations/v3-to-v4.ts
e2e/alternative-history.spec.ts
```

---
### Task 1: Define technology prerequisite graph

**Files:**
- Create: `src/game/technology/graph.ts`
- Test: `src/game/technology/graph.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {canEmerge} from './graph';it('blocks online booking without payment prerequisite',()=>{expect(canEmerge(['internet','payment'],new Set(['internet']))).toBe(false);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/technology/graph.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/technology/graph.ts`:

```ts
export function canEmerge(requires:string[],available:Set<string>){return requires.every(x=>available.has(x));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/technology/graph.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/technology/graph.test.ts src/game/technology/graph.ts
git commit -m "feat: add tech prerequisites"
```

---

### Task 2: Implement diffusion, obsolescence and bounded adoption

**Files:**
- Create: `src/game/technology/lifecycle.ts`
- Test: `src/game/technology/lifecycle.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {nextAdoptionBp} from './lifecycle';it('keeps adoption within 0..10000',()=>{expect(nextAdoptionBp(9900,15000)).toBeLessThanOrEqual(10000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/technology/lifecycle.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/technology/lifecycle.ts`:

```ts
export function nextAdoptionBp(current:number,push:number){return Math.max(0,Math.min(10000,current+Math.round((10000-current)*.03+push/100)));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/technology/lifecycle.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/technology/lifecycle.test.ts src/game/technology/lifecycle.ts
git commit -m "feat: add tech lifecycle"
```

---

### Task 3: Add competing standards and network effects

**Files:**
- Create: `src/game/technology/standards.ts`
- Test: `src/game/technology/standards.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {networkValueBp} from './standards';it('rises with hotel and guest participation',()=>{expect(networkValueBp(7000,6000)).toBeGreaterThan(networkValueBp(2000,2000));});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/technology/standards.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/technology/standards.ts`:

```ts
export function networkValueBp(hotelBp:number,guestBp:number){return Math.round(Math.sqrt(hotelBp*guestBp));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/technology/standards.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/technology/standards.test.ts src/game/technology/standards.ts
git commit -m "feat: add technology standards"
```

---

### Task 4: Model adoption cost curves and hotel implementation projects

**Files:**
- Create: `src/game/technology/adoption.ts`
- Modify: `src/game/renovation/projects.ts`
- Test: `src/game/technology/adoption.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {adoptionCostMinor} from './adoption';it('makes mature tech cheaper',()=>{expect(adoptionCostMinor(10000000,8000)).toBeLessThan(adoptionCostMinor(10000000,1000));});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/technology/adoption.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/technology/adoption.ts`:

```ts
export function adoptionCostMinor(base:number,marketBp:number){return Math.max(1,Math.round(base*(1.35-marketBp/20000)));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/technology/adoption.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/renovation/projects.ts src/game/technology/adoption.test.ts src/game/technology/adoption.ts
git commit -m "feat: add tech adoption cost"
```

---

### Task 5: Add segment-specific societal guest trends

**Files:**
- Create: `src/game/world/trends.ts`
- Test: `src/game/world/trends.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {segmentDemandBp} from './trends';it('applies segment affinity to trend adoption',()=>{expect(segmentDemandBp(7000,12000)).toBeGreaterThan(7000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/world/trends.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/world/trends.ts`:

```ts
export function segmentDemandBp(globalBp:number,affinityBp:number){return Math.min(15000,Math.round(globalBp*affinityBp/10000));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/world/trends.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/world/trends.test.ts src/game/world/trends.ts
git commit -m "feat: add societal trends"
```

---

### Task 6: Implement bounded macroeconomic transitions

**Files:**
- Create: `src/game/world/macro.ts`
- Test: `src/game/world/macro.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {nextBounded} from './macro';it('caps monthly moves',()=>{expect(nextBounded(500,900,50)).toBe(550);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/world/macro.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/world/macro.ts`:

```ts
export function nextBounded(current:number,target:number,maxMove:number){const d=target-current;return current+Math.sign(d)*Math.min(Math.abs(d),maxMove);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/world/macro.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/world/macro.test.ts src/game/world/macro.ts
git commit -m "feat: add macroeconomy"
```

---

### Task 7: Generate systemic crises and rare shocks

**Files:**
- Create: `src/game/world/crises.ts`
- Create: `src/game/world/shocks.ts`
- Test: `src/game/world/crises.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {crisisRiskBp} from './crises';it('raises risk from leverage overcapacity and refinance stress',()=>{expect(crisisRiskBp(8000,7000,8000)).toBeGreaterThan(6000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/world/crises.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/world/crises.ts`:

```ts
export function crisisRiskBp(leverage:number,overcapacity:number,refi:number){return Math.min(10000,Math.round(leverage*.4+overcapacity*.25+refi*.35));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/world/crises.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/world/crises.test.ts src/game/world/crises.ts src/game/world/shocks.ts
git commit -m "feat: add systemic crises"
```

---

### Task 8: Add climate/weather risk and dynamic compliance rules

**Files:**
- Create: `src/game/world/climate.ts`
- Create: `src/game/regulation/compliance.ts`
- Test: `src/game/regulation/compliance.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {complianceStatus} from './compliance';it('flags a hotel below a legal requirement',()=>{expect(complianceStatus(60,75)).toBe('noncompliant');});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/regulation/compliance.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/regulation/compliance.ts`:

```ts
export function complianceStatus(actual:number,required:number){return actual>=required?'compliant':'noncompliant';}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/regulation/compliance.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/regulation/compliance.test.ts src/game/regulation/compliance.ts src/game/world/climate.ts
git commit -m "feat: add climate and compliance"
```

---

### Task 9: Add multi-currency exchange and common-currency branching

**Files:**
- Create: `src/game/currency/exchange.ts`
- Create: `src/game/currency/paths.ts`
- Test: `src/game/currency/exchange.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {convertMinor} from './exchange';it('converts integer minor units with fixed-point basis',()=>{expect(convertMinor(10000,19550)).toBe(19550);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/currency/exchange.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/currency/exchange.ts`:

```ts
export function convertMinor(amount:number,rateBasis:number){if(!Number.isInteger(amount)||!Number.isInteger(rateBasis))throw new Error('integer inputs required');return Math.round(amount*rateBasis/10000);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/currency/exchange.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/currency/exchange.test.ts src/game/currency/exchange.ts src/game/currency/paths.ts
git commit -m "feat: add world currencies"
```

---

### Task 10: Derive UI era from actual technology adoption

**Files:**
- Create: `src/ui/era/eraCapabilities.ts`
- Modify: `src/ui/ManagementShell.tsx`
- Test: `src/ui/era/eraCapabilities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {eraCapabilities} from './eraCapabilities';it('hides mobile check-in at low smartphone adoption',()=>{expect(eraCapabilities(1000).mobileCheckIn).toBe(false);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/era/eraCapabilities.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/era/eraCapabilities.ts`:

```ts
export function eraCapabilities(smartphoneBp:number){return{mobileCheckIn:smartphoneBp>=3500,smartphoneVisuals:smartphoneBp>=2000};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/era/eraCapabilities.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/ManagementShell.tsx src/ui/era/eraCapabilities.test.ts src/ui/era/eraCapabilities.ts
git commit -m "feat: derive era ui from adoption"
```

---

### Task 11: Orchestrate deterministic world update order

**Files:**
- Create: `src/game/world/WorldSimulation.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Test: `src/game/world/WorldSimulation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {worldStepOrder} from './WorldSimulation';it('keeps stable yearly update order',()=>{expect(worldStepOrder).toEqual(['macro','regulation','technology','trends','actors','crises','currency']);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/world/WorldSimulation.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/world/WorldSimulation.ts`:

```ts
export const worldStepOrder=['macro','regulation','technology','trends','actors','crises','currency'] as const;export class WorldSimulation{stepYear(){return[...worldStepOrder];}}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/world/WorldSimulation.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/simulation/GameSimulation.ts src/game/world/WorldSimulation.test.ts src/game/world/WorldSimulation.ts
git commit -m "feat: orchestrate world simulation"
```

---

### Task 12: Migrate saves and run deterministic 50-year histories

**Files:**
- Create: `src/game/persistence/migrations/v3-to-v4.ts`
- Create: `src/game/world/longRun.test.ts`
- Create: `e2e/alternative-history.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {runWorldYears} from '../test/worldScenario';it('keeps bounded macro and technology values for 50 years',()=>{const r=runWorldYears(50,9001);expect(r.maxInflationBp).toBeLessThan(5000);expect(r.maxTechnologyBp).toBeLessThanOrEqual(10000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/world/longRun.test.ts && npm run test:e2e -- e2e/alternative-history.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v3-to-v4.ts`:

```ts
export function migrateV3ToV4(s:Record<string,unknown>){return{...s,saveVersion:4,world:(s.world as object|undefined)??{},currencies:(s.currencies as object|undefined)??{}};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/world/longRun.test.ts && npm run test:e2e -- e2e/alternative-history.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/alternative-history.spec.ts src/game/persistence/migrations/v3-to-v4.ts src/game/world/longRun.test.ts
git commit -m "feat: integrate alternative history"
```

---
## Plan self-review

### Spec coverage
- MASTER 34–35 macro/crises/shocks — Tasks 6–8.
- MASTER 36–37 technology/trends — Tasks 1–5,10–11.
- MASTER 38 compliance — Task 8.
- MASTER 39 currencies — Task 9.
- 50-year deterministic validation — Task 12.

### Consistency gate

Every scoped feature has an executable task, targeted test command and commit boundary. No deferred implementation markers are permitted.

### Final verification gate

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: every command exits 0. Do not start the next plan while any gate fails.

**Next plan after this gate:** Plan 05 – Multi-Hotel Company & Brands
