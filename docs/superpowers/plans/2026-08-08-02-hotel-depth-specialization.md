# 02 Hotel Depth & Specialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the vertical-slice property into a deep modular hotel with richer rooms, F&B, wellness, events, engineering and specialization.

**Architecture:** Extend the Worker-owned hotel domain with reusable facility capacity/throughput contracts. New areas consume the existing staff, inventory, finance, reservation and renovation systems; React/Pixi only render snapshot state.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plan 01 final verification**.

MASTER-spec coverage: MASTER chapters 10–21.

## Scope contract

**In scope**
- room modules and commercial aging
- planning/construction/acceptance renovation lifecycle
- full F&B, bar and room-service economics
- laundry/linen logistics
- wellness/fitness reservations
- conference/event sales and execution
- engineering/utility capacity and maintenance
- staff areas, mobility and security
- classification and specialization
- facility UI/Pixi states and save migration

**Explicitly outside this plan**
- city macroeconomy/competitor investment
- post-1991 technology diffusion
- multi-hotel groups and brands
- campaign narrative

## Locked file map

All paths are relative to `/mnt/data/hotel-manager`.

```text
src/game/facilities/
src/game/rooms/product.ts
src/game/renovation/projects.ts
src/game/fnb/
src/game/laundry/
src/game/wellness/
src/game/eventsales/
src/game/engineering/
src/game/classification/
src/ui/facilities/
src/render/facilities/
src/game/persistence/migrations/v1-to-v2.ts
e2e/hotel-depth.spec.ts
```

---
### Task 1: Create generic facility capacity and utilization primitives

**Files:**
- Create: `src/game/facilities/capacity.ts`
- Test: `src/game/facilities/capacity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {availableThroughput,utilizationBp} from './capacity';it('uses the tightest capacity constraint',()=>{expect(availableThroughput({space:120,equipment:80,staffed:60})).toBe(60);expect(utilizationBp(54,60)).toBe(9000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/facilities/capacity.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/facilities/capacity.ts`:

```ts
export interface CapacityInputs{space:number;equipment:number;staffed:number;}export function availableThroughput(i:CapacityInputs){return Math.max(0,Math.min(i.space,i.equipment,i.staffed));}export function utilizationBp(demand:number,capacity:number){return capacity<=0?(demand>0?10000:0):Math.min(20000,Math.round(demand*10000/capacity));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/facilities/capacity.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/facilities/capacity.test.ts src/game/facilities/capacity.ts
git commit -m "feat: add facility capacity primitives"
```

---

### Task 2: Model room modules, segment fit and commercial aging

**Files:**
- Create: `src/game/rooms/product.ts`
- Create: `src/game/content/rooms/modules.ts`
- Test: `src/game/rooms/product.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {roomAppeal} from './product';it('keeps physical condition separate from commercial aging',()=>{const r=roomAppeal({comfort:80,bath:70,technology:30,condition:90,styleAgeYears:18});expect(r.condition).toBe(90);expect(r.appeal).toBeLessThan(80);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/rooms/product.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/rooms/product.ts`:

```ts
export interface RoomProduct{comfort:number;bath:number;technology:number;condition:number;styleAgeYears:number;}export function roomAppeal(r:RoomProduct){const raw=r.comfort*.35+r.bath*.25+r.technology*.2+r.condition*.2;return{condition:r.condition,appeal:Math.max(0,Math.round(raw-Math.min(35,r.styleAgeYears*1.5)))};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/rooms/product.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/content/rooms/modules.ts src/game/rooms/product.test.ts src/game/rooms/product.ts
git commit -m "feat: deepen room product model"
```

---

### Task 3: Implement planning, approval, construction noise and reopening

**Files:**
- Create: `src/game/renovation/projects.ts`
- Modify: `src/game/building/renovations.ts`
- Test: `src/game/renovation/projects.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {advanceProject} from './projects';it('moves construction to acceptance only after remaining work reaches zero',()=>{expect(advanceProject({phase:'construction',remainingMinutes:5,affected:['101']},5).phase).toBe('acceptance');});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/renovation/projects.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/renovation/projects.ts`:

```ts
export type Phase='planning'|'approval'|'construction'|'acceptance'|'complete';export interface Project{phase:Phase;remainingMinutes:number;affected:string[];}export function advanceProject(p:Project,m:number):Project{if(p.phase!=='construction')return p;const remainingMinutes=Math.max(0,p.remainingMinutes-m);return{...p,remainingMinutes,phase:remainingMinutes===0?'acceptance':'construction'};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/renovation/projects.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/building/renovations.ts src/game/renovation/projects.test.ts src/game/renovation/projects.ts
git commit -m "feat: add renovation lifecycle"
```

---

### Task 4: Build full F&B menu, recipes, seating and external demand

**Files:**
- Create: `src/game/fnb/menu.ts`
- Create: `src/game/fnb/seating.ts`
- Create: `src/game/fnb/externalDemand.ts`
- Modify: `src/game/fnb/breakfastService.ts`
- Test: `src/game/fnb/menu.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {contributionMinor,availableSeats} from './menu';it('calculates menu contribution and respects reserved seats',()=>{expect(contributionMinor(1800,650)).toBe(1150);expect(availableSeats(80,55,10)).toBe(15);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/fnb/menu.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/fnb/menu.ts`:

```ts
export function contributionMinor(priceMinor:number,ingredientMinor:number){if(!Number.isInteger(priceMinor)||!Number.isInteger(ingredientMinor))throw new Error('minor units required');return priceMinor-ingredientMinor;}export function availableSeats(seats:number,reserved:number,walkIns:number){return Math.max(0,seats-reserved-walkIns);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/fnb/menu.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/fnb/breakfastService.ts src/game/fnb/externalDemand.ts src/game/fnb/menu.test.ts src/game/fnb/menu.ts src/game/fnb/seating.ts
git commit -m "feat: add full fnb economics"
```

---

### Task 5: Add bar, lounge and room-service logistics

**Files:**
- Create: `src/game/fnb/barService.ts`
- Create: `src/game/fnb/roomService.ts`
- Test: `src/game/fnb/roomService.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {deliveryMinutes} from './roomService';it('includes kitchen elevator and service travel time',()=>{expect(deliveryMinutes({kitchen:12,elevator:4,service:6})).toBe(22);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/fnb/roomService.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/fnb/roomService.ts`:

```ts
export function deliveryMinutes(i:{kitchen:number;elevator:number;service:number}){return i.kitchen+i.elevator+i.service;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/fnb/roomService.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/fnb/barService.ts src/game/fnb/roomService.test.ts src/game/fnb/roomService.ts
git commit -m "feat: add bar and room service"
```

---

### Task 6: Add linen inventory plus internal and external laundry

**Files:**
- Create: `src/game/laundry/laundry.ts`
- Modify: `src/game/purchasing/inventory.ts`
- Test: `src/game/laundry/laundry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {laundryOutput} from './laundry';it('limits laundry by dirty stock machine and labor',()=>{expect(laundryOutput({dirty:90,machine:70,staffed:50})).toBe(50);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/laundry/laundry.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/laundry/laundry.ts`:

```ts
export function laundryOutput(i:{dirty:number;machine:number;staffed:number}){return Math.max(0,Math.min(i.dirty,i.machine,i.staffed));}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/laundry/laundry.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/laundry/laundry.test.ts src/game/laundry/laundry.ts src/game/purchasing/inventory.ts
git commit -m "feat: add laundry logistics"
```

---

### Task 7: Implement reservable wellness and fitness services

**Files:**
- Create: `src/game/wellness/reservations.ts`
- Create: `src/game/wellness/fitness.ts`
- Test: `src/game/wellness/reservations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {canReserve} from './reservations';it('requires room staff and opening-time capacity',()=>{expect(canReserve({roomSlots:1,staffSlots:0,isOpen:true})).toBe(false);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/wellness/reservations.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/wellness/reservations.ts`:

```ts
export function canReserve(i:{roomSlots:number;staffSlots:number;isOpen:boolean}){return i.isOpen&&i.roomSlots>0&&i.staffSlots>0;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/wellness/reservations.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/wellness/fitness.ts src/game/wellness/reservations.test.ts src/game/wellness/reservations.ts
git commit -m "feat: add wellness reservations"
```

---

### Task 8: Implement conference leads, offers, room blocks and execution load

**Files:**
- Create: `src/game/eventsales/contracts.ts`
- Create: `src/game/eventsales/leads.ts`
- Test: `src/game/eventsales/contracts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {contractValueMinor} from './contracts';it('combines rental rooms catering and technology',()=>{expect(contractValueMinor({rental:200000,rooms:450000,catering:180000,technology:50000})).toBe(880000);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/eventsales/contracts.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/eventsales/contracts.ts`:

```ts
export function contractValueMinor(i:{rental:number;rooms:number;catering:number;technology:number}){return i.rental+i.rooms+i.catering+i.technology;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/eventsales/contracts.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/eventsales/contracts.test.ts src/game/eventsales/contracts.ts src/game/eventsales/leads.ts
git commit -m "feat: add conference event sales"
```

---

### Task 9: Deepen engineering capacity preventive maintenance and replacement

**Files:**
- Create: `src/game/engineering/assets.ts`
- Create: `src/game/engineering/policy.ts`
- Modify: `src/game/maintenance/maintenance.ts`
- Test: `src/game/engineering/assets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {effectiveCapacity} from './assets';it('reduces effective capacity as condition falls',()=>{expect(effectiveCapacity({rated:100,condition:50})).toBe(75);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/engineering/assets.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/engineering/assets.ts`:

```ts
export function effectiveCapacity(i:{rated:number;condition:number}){const m=i.condition>=80?1:.5+i.condition/200;return Math.round(i.rated*m);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/engineering/assets.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/engineering/assets.test.ts src/game/engineering/assets.ts src/game/engineering/policy.ts src/game/maintenance/maintenance.ts
git commit -m "feat: deepen engineering systems"
```

---

### Task 10: Add staff areas, mobility, additional services and security load

**Files:**
- Create: `src/game/facilities/staffAreas.ts`
- Create: `src/game/facilities/mobility.ts`
- Create: `src/game/facilities/security.ts`
- Test: `src/game/facilities/security.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {requiredSecurityStaff} from './security';it('adds staff for events and vip load',()=>{expect(requiredSecurityStaff({base:1,eventGuests:300,vipLevel:2})).toBe(5);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/facilities/security.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/facilities/security.ts`:

```ts
export function requiredSecurityStaff(i:{base:number;eventGuests:number;vipLevel:number}){return i.base+Math.ceil(i.eventGuests/150)+i.vipLevel;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/facilities/security.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/facilities/mobility.ts src/game/facilities/security.test.ts src/game/facilities/security.ts src/game/facilities/staffAreas.ts
git commit -m "feat: add support facility systems"
```

---

### Task 11: Add classification and specialization rules

**Files:**
- Create: `src/game/classification/quality.ts`
- Create: `src/game/classification/specialization.ts`
- Test: `src/game/classification/quality.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {qualifies} from './quality';it('requires every mandatory quality standard',()=>{expect(qualifies({room:75,reception:60,maintenance:80},{room:70,reception:70,maintenance:70})).toBe(false);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/classification/quality.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/classification/quality.ts`:

```ts
export function qualifies(a:Record<string,number>,r:Record<string,number>){return Object.keys(r).every(k=>(a[k]??0)>=r[k]);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/classification/quality.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/classification/quality.test.ts src/game/classification/quality.ts src/game/classification/specialization.ts
git commit -m "feat: add hotel classification"
```

---

### Task 12: Expose deep facilities in snapshot, Pixi and management UI

**Files:**
- Modify: `src/game/domain/snapshot.ts`
- Create: `src/render/facilities/FacilityLayer.ts`
- Create: `src/ui/facilities/FacilitiesDashboard.tsx`
- Test: `src/ui/facilities/FacilitiesDashboard.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import {render,screen} from '@testing-library/react';import {FacilitiesDashboard} from './FacilitiesDashboard';it('shows bottleneck causes',()=>{render(<FacilitiesDashboard rows={[{id:'kitchen',name:'Kitchen',demand:90,capacity:60,cause:'staffed throughput'}]}/>);expect(screen.getByText(/staffed throughput/)).toBeTruthy();});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/facilities/FacilitiesDashboard.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/facilities/FacilitiesDashboard.tsx`:

```ts
export function FacilitiesDashboard({rows}:{rows:{id:string;name:string;demand:number;capacity:number;cause:string}[]}){return <section>{rows.map(r=><article key={r.id}><h3>{r.name}</h3><p>{r.demand}/{r.capacity}</p><p>{r.cause}</p></article>)}</section>}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/facilities/FacilitiesDashboard.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/domain/snapshot.ts src/render/facilities/FacilityLayer.ts src/ui/facilities/FacilitiesDashboard.test.tsx src/ui/facilities/FacilitiesDashboard.tsx
git commit -m "feat: expose hotel depth ui"
```

---

### Task 13: Migrate saves and prove cross-system facility synergies

**Files:**
- Create: `src/game/persistence/migrations/v1-to-v2.ts`
- Create: `src/game/simulation/hotelDepth.integration.test.ts`
- Create: `e2e/hotel-depth.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {expect,it} from 'vitest';import {runHotelDepthScenario} from '../test/hotelDepthScenario';it('propagates conference load into fnb housekeeping and elevators',()=>{const r=runHotelDepthScenario(180);expect(r.breakfastDemand).toBeGreaterThan(0);expect(r.housekeepingMinutes).toBeGreaterThan(0);expect(r.elevatorTrips).toBeGreaterThan(0);});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/hotelDepth.integration.test.ts && npm run test:e2e -- e2e/hotel-depth.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v1-to-v2.ts`:

```ts
export function migrateV1ToV2(s:Record<string,unknown>){return {...s,saveVersion:2,facilities:(s.facilities as unknown[]|undefined)??[]};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/hotelDepth.integration.test.ts && npm run test:e2e -- e2e/hotel-depth.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/hotel-depth.spec.ts src/game/persistence/migrations/v1-to-v2.ts src/game/simulation/hotelDepth.integration.test.ts
git commit -m "feat: integrate hotel depth"
```

---
## Plan self-review

### Spec coverage
- MASTER 10–12 room/building/reception — Tasks 1–3,11–12.
- MASTER 13–16 F&B/wellness/events/laundry — Tasks 4–8.
- MASTER 17–20 engineering/support/mobility/security — Tasks 9–10.
- MASTER 21 classification — Task 11.
- Persistence and causal integration — Task 13.

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

**Next plan after this gate:** Plan 03 – City Market & Competitors
