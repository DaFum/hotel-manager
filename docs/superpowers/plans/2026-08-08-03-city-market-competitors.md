# 03 City Market & Competitors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a living city market, labor/property/transport systems and economically fair competitors.

**Architecture:** Use aggregate city and competitor state in the Worker. Competitors share player economics but can simulate at lower detail; city feedback is delayed and saturating.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plan 02 final verification**.

MASTER-spec coverage: MASTER chapters 29–35.

## Scope contract

**In scope**
- city demand sources
- labor and wage market
- property/construction market
- transport connectivity
- external economic actors
- hotel-to-city feedback
- forecast uncertainty
- competitor strategies/pricing/investment
- entry/exit/rivals
- market UI and decade tests

**Explicitly outside this plan**
- global tech diffusion
- multi-hotel player company
- full narrative event chains

## Locked file map

All paths are relative to the repository root.

```text
src/game/city/
src/game/labor/
src/game/property/
src/game/transport/
src/game/actors/
src/game/competitors/
src/game/marketResearch/
src/ui/market/
src/game/persistence/migrations/v2-to-v3.ts
e2e/city-market.spec.ts
```

---
### Task 1: Create city state and source-based room-night demand

**Files:**
- Create: `src/game/city/demand.ts`
- Test: `src/game/city/demand.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {totalRoomNights} from './demand';it('sums source demand',()=>{expect(totalRoomNights({business:1200,leisure:800,event:500,group:300})).toBe(2800);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/city/demand.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/city/demand.ts`:

```ts
export function totalRoomNights(i:{business:number;leisure:number;event:number;group:number}){return i.business+i.leisure+i.event+i.group;}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/city/demand.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/city/demand.test.ts src/game/city/demand.ts
git commit -m "feat: add city demand"
```

---

### Task 2: Model labor availability and wage pressure

**Files:**
- Create: `src/game/labor/market.ts`
- Modify: `src/game/staff/staffing.ts`
- Test: `src/game/labor/market.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {wagePressureBp} from './market';it('raises wages when vacancies exceed labor supply',()=>{expect(wagePressureBp(200,100)).toBeGreaterThan(10000);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/labor/market.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/labor/market.ts`:

```ts
export function wagePressureBp(vacancies:number,workers:number){return Math.round(10000*Math.min(1.5,Math.max(.75,vacancies/Math.max(1,workers))));}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/labor/market.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/labor/market.test.ts src/game/labor/market.ts src/game/staff/staffing.ts
git commit -m "feat: add labor market"
```

---

### Task 3: Add property values, build costs and lagged adjustment

**Files:**
- Create: `src/game/property/market.ts`
- Test: `src/game/property/market.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {nextPrice} from './market';it('caps monthly land-price movement',()=>{expect(nextPrice(10000000,20000000,300)).toBe(10300000);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/property/market.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/property/market.ts`:

```ts
export function nextPrice(current:number,target:number,maxMoveBp:number){const lim=Math.round(current*maxMoveBp/10000),d=target-current;return current+Math.sign(d)*Math.min(Math.abs(d),lim);}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/property/market.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/property/market.test.ts src/game/property/market.ts
git commit -m "feat: add property market"
```

---

### Task 4: Model transport connectivity and route changes

**Files:**
- Create: `src/game/transport/network.ts`
- Test: `src/game/transport/network.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {connectivityIndex} from './network';it('weights rail airport road and local transit',()=>{expect(connectivityIndex({rail:70,airport:80,road:60,local:75})).toBe(72);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/transport/network.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/transport/network.ts`:

```ts
export function connectivityIndex(i:{rail:number;airport:number;road:number;local:number}){return Math.round(i.rail*.3+i.airport*.35+i.road*.15+i.local*.2);}
```

> Implementation note: these weights over the test's ratings give 73, not the
> 72 the step above quotes. The weights are the contract, so the shipped test
> asserts 73.

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/transport/network.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/transport/network.test.ts src/game/transport/network.ts
git commit -m "feat: add transport market"
```

---

### Task 5: Add external companies, organizers, attractions and investors

**Files:**
- Create: `src/game/actors/evolution.ts`
- Test: `src/game/actors/evolution.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {nextActorScale} from './evolution';it('allows demand actors to grow and shrink',()=>{expect(nextActorScale({scale:100,demand:120,profitBp:800})).toBeGreaterThan(100);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/actors/evolution.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/actors/evolution.ts`:

```ts
export function nextActorScale(i:{scale:number;demand:number;profitBp:number}){return Math.max(0,i.scale+Math.round((i.demand-100)*.2+i.profitBp/1000));}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/actors/evolution.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/actors/evolution.test.ts src/game/actors/evolution.ts
git commit -m "feat: add city economic actors"
```

---

### Task 6: Apply hotel-to-city feedback with saturation and delay

**Files:**
- Create: `src/game/city/feedback.ts`
- Test: `src/game/city/feedback.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {conferenceEffect} from './feedback';it('has diminishing returns',()=>{expect(conferenceEffect(1000)-conferenceEffect(500)).toBeLessThan(conferenceEffect(500));});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/city/feedback.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/city/feedback.ts`:

```ts
export function conferenceEffect(cap:number){return Math.round(1000*(1-Math.exp(-Math.max(0,cap)/600)));}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/city/feedback.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/city/feedback.test.ts src/game/city/feedback.ts
git commit -m "feat: add city feedback"
```

---

### Task 7: Add forecast bands and paid information quality

**Files:**
- Create: `src/game/marketResearch/forecast.ts`
- Test: `src/game/marketResearch/forecast.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {forecastBand} from './forecast';it('narrows with better information',()=>{expect(forecastBand(1000,90).high-forecastBand(1000,90).low).toBeLessThan(forecastBand(1000,40).high-forecastBand(1000,40).low);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/marketResearch/forecast.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/marketResearch/forecast.ts`:

```ts
export function forecastBand(base:number,q:number){const s=Math.round(base*(1-Math.min(100,Math.max(0,q))/100)*.4);return{low:base-s,base,high:base+s};}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/marketResearch/forecast.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/marketResearch/forecast.test.ts src/game/marketResearch/forecast.ts
git commit -m "feat: add uncertain forecasts"
```

---

### Task 8: Create competitor strategies with bounded knowledge

**Files:**
- Create: `src/game/competitors/strategies.ts`
- Test: `src/game/competitors/strategies.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {targetLeverageBp} from './strategies';it('gives aggressive investors more leverage tolerance',()=>{expect(targetLeverageBp('aggressive')).toBeGreaterThan(targetLeverageBp('family'));});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/competitors/strategies.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/competitors/strategies.ts`:

```ts
export type Strategy='budget'|'luxury'|'family'|'lifestyle'|'aggressive';export function targetLeverageBp(s:Strategy){return({budget:4500,luxury:3000,family:1800,lifestyle:3500,aggressive:6500})[s];}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/competitors/strategies.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/competitors/strategies.test.ts src/game/competitors/strategies.ts
git commit -m "feat: add competitor strategies"
```

---

### Task 9: Reuse market economics for competitor pricing and investment

**Files:**
- Create: `src/game/competitors/pricing.ts`
- Create: `src/game/competitors/investment.ts`
- Test: `src/game/competitors/investment.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {chooseInvestment} from './investment';it('holds when debt exceeds risk tolerance',()=>{expect(chooseInvestment({returnBp:1200,debtBp:8500,toleranceBp:5000})).toBe('hold');});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/competitors/investment.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/competitors/investment.ts`:

```ts
export function chooseInvestment(i:{returnBp:number;debtBp:number;toleranceBp:number}){if(i.debtBp>i.toleranceBp)return'hold';return i.returnBp>=900?'expand':i.returnBp>=400?'renovate':'hold';}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/competitors/investment.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/competitors/investment.test.ts src/game/competitors/investment.ts src/game/competitors/pricing.ts
git commit -m "feat: add competitor investment"
```

---

### Task 10: Implement entry, exit, insolvency and remembered rival relations

**Files:**
- Create: `src/game/competitors/lifecycle.ts`
- Create: `src/game/competitors/relations.ts`
- Test: `src/game/competitors/lifecycle.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {lifecycleAction} from './lifecycle';it('exits when cash and refinancing are exhausted',()=>{expect(lifecycleAction({cash:-100,credit:0,burn:50})).toBe('exit');});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/competitors/lifecycle.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/competitors/lifecycle.ts`:

```ts
export function lifecycleAction(i:{cash:number;credit:number;burn:number}){if(i.cash+i.credit<0)return'exit';if(i.burn>0&&i.cash<i.burn*2)return'restructure';return'operate';}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/competitors/lifecycle.test.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/game/competitors/lifecycle.test.ts src/game/competitors/lifecycle.ts src/game/competitors/relations.ts
git commit -m "feat: add competitor lifecycle"
```

---

### Task 11: Add city and competitor comparison dashboards

**Files:**
- Create: `src/ui/market/CityDashboard.tsx`
- Create: `src/ui/market/CompetitorTable.tsx`
- Test: `src/ui/market/CityDashboard.test.tsx`

- [x] **Step 1: Write the failing test**

```ts
import {render,screen} from '@testing-library/react';import {CityDashboard} from './CityDashboard';it('shows demand drivers and uncertainty',()=>{render(<CityDashboard business={1200} leisure={800} low={1800} high={2300}/>);expect(screen.getByText(/Business 1200/)).toBeTruthy();});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/market/CityDashboard.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/ui/market/CityDashboard.tsx`:

```ts
export function CityDashboard(p:{business:number;leisure:number;low:number;high:number}){return <section><p>Business {p.business}</p><p>Leisure {p.leisure}</p><p>Forecast {p.low}–{p.high}</p></section>}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/market/CityDashboard.test.tsx
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add src/ui/market/CityDashboard.test.tsx src/ui/market/CityDashboard.tsx src/ui/market/CompetitorTable.tsx
git commit -m "feat: add market dashboards"
```

---

### Task 12: Migrate saves and run a ten-year competitive-market gate

**Files:**
- Create: `src/game/persistence/migrations/v2-to-v3.ts`
- Create: `src/game/city/cityMarket.integration.test.ts`
- Create: `e2e/city-market.spec.ts`

- [x] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {runCityYears} from '../test/cityScenario';it('keeps a functioning market for ten years',()=>{const r=runCityYears(10,4242);expect(r.activeCompetitors).toBeGreaterThan(2);expect(r.hotelSupply).toBeGreaterThan(0);});
```

- [x] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/city/cityMarket.integration.test.ts && npm run test:e2e -- e2e/city-market.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [x] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v2-to-v3.ts`:

```ts
export function migrateV2ToV3(s:Record<string,unknown>){return{...s,saveVersion:3,cityMarket:(s.cityMarket as object|undefined)??{},competitors:(s.competitors as unknown[]|undefined)??[]};}
```

- [x] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/city/cityMarket.integration.test.ts && npm run test:e2e -- e2e/city-market.spec.ts
npm run typecheck
```

- [x] **Step 5: Commit**

```bash
git add e2e/city-market.spec.ts src/game/city/cityMarket.integration.test.ts src/game/persistence/migrations/v2-to-v3.ts
git commit -m "feat: integrate city market"
```

---
## Plan self-review

### Spec coverage
- MASTER 29–31 uncertainty/city/transport — Tasks 1–7.
- MASTER 32–33 other actors and fair competitor AI — Tasks 5,8–10.
- Explainable market UI — Task 11.
- Persistence and decade stability — Task 12.

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

**Next plan after this gate:** Plan 04 – Technology & Alternative History
