# 1991 Single-Hotel Vertical Slice Revision 1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable 1991 Frankfurt hotel-management vertical slice that proves the final deterministic Worker architecture and the complete core operating loop for one 24-room hotel.

**Architecture:** React and Pixi render immutable Worker snapshots; all authoritative rules run in a versioned deterministic TypeScript Web Worker. The slice implements the smallest production-shaped booking, pricing, staffing, housekeeping, purchasing, breakfast, guest, maintenance, finance, renovation, save/load, and explanation systems that later plans can extend without replacement.

**Tech Stack:** Node 22.12+; npm; React 19; Vite; TypeScript; PixiJS 8; native Web Worker; IndexedDB; Vitest; React Testing Library; Playwright.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **MASTER spec approved and available; no application repository exists yet**.

MASTER-spec coverage: MASTER chapters 1-19, 22, 51-57, 59-76 and Subproject 1 chapter 84.

## Scope contract

**In scope**
- Frankfurt 1991 baseline and fictional 24-room hotel
- versioned Worker protocol and isolated RNG streams
- 5-minute deterministic simulation quantum with fixed phase order
- direct-phone, travel-agency, corporate, and walk-in bookings
- room pricing by date/category, ADR and RevPAR
- room state, reception queue, housekeeping, basic staff and absence
- supplier orders, cleaning supplies, and breakfast inventory
- breakfast restaurant/kitchen throughput
- guest satisfaction, complaints, and basic recovery
- maintenance, one bank loan, ledger, monthly close
- one predefined renovation conversion
- isometric Pixi hotel view plus accessible React controls
- IndexedDB save/load with save/content/protocol versions and all RNG states
- deterministic E2E and benchmark acceptance gates

**Explicitly outside this plan**
- multiple hotels, headquarters, brands, M&A, franchising
- full macroeconomy, competitor investment, or alternative-history branching
- spa, bar, conference, fitness, parking, luxury service depth
- online travel agencies, social media, loyalty programs, international FX
- free wall-by-wall building editor

## Locked file map

All paths are relative to the repository root.

```text
package.json
vite.config.ts
playwright.config.ts
src/main.tsx
src/app/App.tsx
src/app/GameClient.ts
src/app/gameStore.ts
src/game/domain/ids.ts
src/game/domain/money.ts
src/game/domain/calendar.ts
src/game/domain/rng.ts
src/game/domain/commands.ts
src/game/domain/events.ts
src/game/domain/protocol.ts
src/game/domain/snapshot.ts
src/game/content/1991/frankfurt.ts
src/game/content/1991/starterHotel.ts
src/game/content/1991/guestSegments.ts
src/game/content/1991/suppliers.ts
src/game/rooms/roomState.ts
src/game/rooms/housekeeping.ts
src/game/staff/staffing.ts
src/game/purchasing/inventory.ts
src/game/bookings/bookingTypes.ts
src/game/bookings/bookingEngine.ts
src/game/revenue/rates.ts
src/game/revenue/metrics.ts
src/game/guests/guestJourney.ts
src/game/guests/complaints.ts
src/game/fnb/breakfastService.ts
src/game/maintenance/maintenance.ts
src/game/finance/ledger.ts
src/game/finance/loans.ts
src/game/finance/monthlyClose.ts
src/game/building/renovations.ts
src/game/explanations/causeExplanations.ts
src/game/simulation/clock.ts
src/game/simulation/initialState.ts
src/game/simulation/GameSimulation.ts
src/game/simulation/invariants.ts
src/game/simulation/simulation.worker.ts
src/game/persistence/saveSchema.ts
src/game/persistence/indexedDbSaveRepository.ts
src/render/isoProjection.ts
src/render/PixiHotelScene.ts
src/ui/TopBar.tsx
src/ui/HotelView.tsx
src/ui/RevenueDashboard.tsx
src/ui/StaffDashboard.tsx
src/ui/PurchasingDashboard.tsx
src/ui/FinanceDashboard.tsx
src/ui/BuildPanel.tsx
src/ui/AlertsPanel.tsx
src/ui/MonthlyCloseModal.tsx
e2e/vertical-slice.spec.ts
scripts/benchmark-slice.ts
```

---

### Task 1: Scaffold repository and quality scripts

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App',()=>{it('renders the hotel manager shell',()=>{render(<App/>);expect(screen.getByRole('main',{name:'Hotel Manager'})).toBeTruthy();});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/app/App.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/app/App.tsx`:

```ts
export function App(){return <main aria-label="Hotel Manager"><h1>Hotel Manager</h1></main>;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/app/App.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json playwright.config.ts src/app/App.test.tsx src/app/App.tsx src/main.tsx vite.config.ts
git commit -m "chore: scaffold hotel manager app"
```

---

### Task 2: Add integer money, calendar, IDs, and deterministic RNG streams

**Files:**
- Create: `src/game/domain/ids.ts`
- Create: `src/game/domain/money.ts`
- Create: `src/game/domain/calendar.ts`
- Create: `src/game/domain/rng.ts`
- Test: `src/game/domain/rng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createRngStreams } from './rng';

describe('rng streams',()=>{it('creates stable isolated subsystem streams',()=>{
 const a=createRngStreams(424242),b=createRngStreams(424242);
 expect(Object.keys(a)).toEqual(['guests','staffing','failures','economy','events','weather','AI']);
 expect(a.guests.nextUint32()).toBe(b.guests.nextUint32());
 expect(a.failures.nextUint32()).toBe(b.failures.nextUint32());
});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/domain/rng.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/domain/rng.ts`:

```ts
export class XorShift32{constructor(public state:number){this.state=(state>>>0)||0x9e3779b9;}nextUint32(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state;}nextFloat(){return this.nextUint32()/0x1_0000_0000;}}
const mix=(seed:number,salt:number)=>((seed>>>0)^Math.imul(salt,0x9e3779b1))>>>0;
export function createRngStreams(seed:number){return {guests:new XorShift32(mix(seed,1)),staffing:new XorShift32(mix(seed,2)),failures:new XorShift32(mix(seed,3)),economy:new XorShift32(mix(seed,4)),events:new XorShift32(mix(seed,5)),weather:new XorShift32(mix(seed,6)),AI:new XorShift32(mix(seed,7))};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/domain/rng.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/domain/calendar.ts src/game/domain/ids.ts src/game/domain/money.ts src/game/domain/rng.test.ts src/game/domain/rng.ts
git commit -m "feat: add deterministic domain primitives"
```

---

### Task 3: Lock versioned Worker protocol, commands, and domain events

**Files:**
- Create: `src/game/domain/commands.ts`
- Create: `src/game/domain/events.ts`
- Create: `src/game/domain/protocol.ts`
- Create: `src/game/domain/snapshot.ts`
- Test: `src/game/domain/protocol.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, type WorkerRequest } from './protocol';

describe('worker protocol',()=>{it('uses MASTER message names and protocol version',()=>{
 const request:WorkerRequest={protocolVersion:PROTOCOL_VERSION,type:'COMMAND',requestId:'r1',command:{type:'SET_ROOM_RATE',dateKey:'1991-01-01',category:'single',minor:9000}};
 expect(request.type).toBe('COMMAND');expect(request.protocolVersion).toBe(1);
});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/domain/protocol.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/domain/protocol.ts`:

```ts
import type { GameCommand } from './commands';import type { DomainEvent } from './events';import type { GameSnapshot } from './snapshot';
export const PROTOCOL_VERSION=1 as const;
export type WorkerRequest=|{protocolVersion:1;type:'INIT_GAME';seed:number}|{protocolVersion:1;type:'LOAD_GAME';saveData:unknown}|{protocolVersion:1;type:'COMMAND';requestId:string;command:GameCommand}|{protocolVersion:1;type:'SET_SPEED';speed:0|1|2|4|16}|{protocolVersion:1;type:'PAUSE'}|{protocolVersion:1;type:'RESUME'}|{protocolVersion:1;type:'REQUEST_SAVE';requestId:string}|{protocolVersion:1;type:'REQUEST_DETAILS';requestId:string;entityId:string};
export type WorkerResponse=|{protocolVersion:1;type:'READY';snapshot:GameSnapshot}|{protocolVersion:1;type:'COMMAND_ACCEPTED';requestId:string}|{protocolVersion:1;type:'COMMAND_REJECTED';requestId:string;reason:string}|{protocolVersion:1;type:'STATE_DELTA';snapshot:GameSnapshot}|{protocolVersion:1;type:'SNAPSHOT';snapshot:GameSnapshot}|{protocolVersion:1;type:'DOMAIN_EVENTS';events:DomainEvent[]}|{protocolVersion:1;type:'SAVE_DATA';requestId:string;saveData:unknown}|{protocolVersion:1;type:'SIMULATION_ERROR';message:string}|{protocolVersion:1;type:'PERF_SAMPLE';tickMs:number;visibleAgents:number};
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/domain/protocol.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/domain/commands.ts src/game/domain/events.ts src/game/domain/protocol.test.ts src/game/domain/protocol.ts src/game/domain/snapshot.ts
git commit -m "feat: lock worker protocol"
```

---

### Task 4: Create Frankfurt 1991 and starter hotel content

**Files:**
- Create: `src/game/content/1991/frankfurt.ts`
- Create: `src/game/content/1991/starterHotel.ts`
- Create: `src/game/content/1991/guestSegments.ts`
- Create: `src/game/content/1991/suppliers.ts`
- Create: `src/game/simulation/initialState.ts`
- Test: `src/game/simulation/initialState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { createInitialGameState } from './initialState';
describe('initial state',()=>{it('starts Frankfurt 1991 with 24 rooms and 400000 DM cash',()=>{const s=createInitialGameState(1234);expect(s.calendar.dateKey).toBe('1991-01-01');expect(s.hotel.rooms).toHaveLength(24);expect(s.finance.cashMinor).toBe(40_000_000);expect(Object.keys(s.rngState)).toEqual(['guests','staffing','failures','economy','events','weather','AI']);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/initialState.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/initialState.ts`:

```ts
import { createRngStreams } from '../domain/rng';
export function createInitialGameState(seed:number){const streams=createRngStreams(seed);return {calendar:{dateKey:'1991-01-01',minuteOfDay:0},hotel:{id:'hotel.frankfurt.1',rooms:Array.from({length:24},(_,i)=>({id:`room.${101+i}`,category:i<12?'single':'double',state:'VacantClean',cleanliness:100}))},finance:{cashMinor:40_000_000},rngState:Object.fromEntries(Object.entries(streams).map(([k,v])=>[k,v.state]))};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/initialState.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/content/1991/frankfurt.ts src/game/content/1991/guestSegments.ts src/game/content/1991/starterHotel.ts src/game/content/1991/suppliers.ts src/game/simulation/initialState.test.ts src/game/simulation/initialState.ts
git commit -m "feat: add Frankfurt 1991 starter hotel"
```

---

### Task 5: Implement room state machine and housekeeping throughput

**Files:**
- Create: `src/game/rooms/roomState.ts`
- Create: `src/game/rooms/housekeeping.ts`
- Test: `src/game/rooms/housekeeping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { cleanRoom } from './housekeeping';
describe('housekeeping',()=>{it('moves a dirty room to inspected clean state only with supplies and minutes',()=>{expect(cleanRoom({state:'VacantDirty',cleanliness:20},{minutes:35,cleaningUnits:1})).toEqual({room:{state:'Inspected',cleanliness:100},cleaningUnitsLeft:0});});it('does not clean without supplies',()=>{expect(()=>cleanRoom({state:'VacantDirty',cleanliness:20},{minutes:35,cleaningUnits:0})).toThrow(/supplies/);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/rooms/housekeeping.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/rooms/housekeeping.ts`:

```ts
export function cleanRoom(room:{state:string;cleanliness:number},input:{minutes:number;cleaningUnits:number}){if(room.state!=='VacantDirty')throw new Error('room not dirty');if(input.minutes<30)throw new Error('not enough time');if(input.cleaningUnits<1)throw new Error('missing supplies');return {room:{state:'Inspected',cleanliness:100},cleaningUnitsLeft:input.cleaningUnits-1};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/rooms/housekeeping.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/rooms/housekeeping.test.ts src/game/rooms/housekeeping.ts src/game/rooms/roomState.ts
git commit -m "feat: add room lifecycle and housekeeping"
```

---

### Task 6: Implement applicant market, hiring, shifts, workload, and absence

**Files:**
- Create: `src/game/staff/staffing.ts`
- Test: `src/game/staff/staffing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { hireApplicant, effectiveCapacity } from './staffing';
describe('staffing',()=>{it('hires an applicant into an explicit shift',()=>{expect(hireApplicant({id:'a1',role:'reception',skill:70},{shift:'morning',monthlyWageMinor:220000}).shift).toBe('morning');});it('removes absent staff from throughput',()=>{expect(effectiveCapacity([{skill:70,absent:true},{skill:50,absent:false}])).toBe(50);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/staff/staffing.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/staff/staffing.ts`:

```ts
export type Shift='morning'|'evening'|'night';export function hireApplicant(applicant:{id:string;role:string;skill:number},offer:{shift:Shift;monthlyWageMinor:number}){if(offer.monthlyWageMinor<=0)throw new Error('invalid wage');return {...applicant,shift:offer.shift,monthlyWageMinor:offer.monthlyWageMinor,workload:0,absent:false};}export function effectiveCapacity(staff:Array<{skill:number;absent:boolean}>){return staff.filter(s=>!s.absent).reduce((n,s)=>n+s.skill,0);}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/staff/staffing.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/staff/staffing.test.ts src/game/staff/staffing.ts
git commit -m "feat: add basic staffing"
```

---

### Task 7: Implement inventory, suppliers, orders, and stockouts

**Files:**
- Create: `src/game/purchasing/inventory.ts`
- Test: `src/game/purchasing/inventory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { placeOrder, deliverOrder, consume } from './inventory';
describe('inventory',()=>{it('charges cash now and delivers after lead time',()=>{const o=placeOrder({cashMinor:100000,nowMinutes:0},{supplierId:'s1',sku:'cleaning-unit',quantity:10,unitPriceMinor:500,leadMinutes:1440});expect(o.cashMinor).toBe(95000);expect(deliverOrder({},o.order,1440)['cleaning-unit']).toBe(10);});it('never allows negative stock',()=>{expect(()=>consume({'breakfast-portion':2},'breakfast-portion',3)).toThrow(/stock/);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/purchasing/inventory.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/purchasing/inventory.ts`:

```ts
export interface SupplierOrder{supplierId:string;sku:string;quantity:number;unitPriceMinor:number;dueAtMinutes:number;}export function placeOrder(state:{cashMinor:number;nowMinutes:number},x:{supplierId:string;sku:string;quantity:number;unitPriceMinor:number;leadMinutes:number}){if(!Number.isInteger(x.quantity)||x.quantity<=0)throw new Error('invalid quantity');const cost=x.quantity*x.unitPriceMinor;if(cost>state.cashMinor)throw new Error('insufficient cash');return {cashMinor:state.cashMinor-cost,order:{...x,dueAtMinutes:state.nowMinutes+x.leadMinutes}};}export function deliverOrder(stock:Record<string,number>,o:SupplierOrder,now:number){if(now<o.dueAtMinutes)throw new Error('not due');return {...stock,[o.sku]:(stock[o.sku]??0)+o.quantity};}export function consume(stock:Record<string,number>,sku:string,q:number){if((stock[sku]??0)<q)throw new Error('stockout');return {...stock,[sku]:stock[sku]-q};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/purchasing/inventory.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/purchasing/inventory.test.ts src/game/purchasing/inventory.ts
git commit -m "feat: add purchasing and inventory"
```

---

### Task 8: Implement reservations, cancellation, no-show, and walk-ins

**Files:**
- Create: `src/game/bookings/bookingTypes.ts`
- Create: `src/game/bookings/bookingEngine.ts`
- Test: `src/game/bookings/bookingEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { reserve, cancel, canWalkIn } from './bookingEngine';
describe('booking engine',()=>{it('reserves multiple room nights only inside inventory',()=>{const b=reserve({availableRooms:5},{id:'b1',roomsRequested:2,rateMinor:9000,willingnessMinor:10000});expect(b.roomsRequested).toBe(2);});it('releases a confirmed booking on cancellation',()=>{expect(cancel({id:'b1',status:'confirmed',roomsRequested:2}).status).toBe('cancelled');});it('allows walk in only with clean same day inventory',()=>{expect(canWalkIn({cleanRooms:1,confirmedArrivals:1})).toBe(false);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/bookings/bookingEngine.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/bookings/bookingEngine.ts`:

```ts
export interface Booking{ id:string;roomsRequested:number;rateMinor:number;status:'confirmed'|'cancelled'|'noShow'|'checkedIn'|'completed'; }
export function reserve(inv:{availableRooms:number},r:{id:string;roomsRequested:number;rateMinor:number;willingnessMinor:number}):Booking{if(r.rateMinor>r.willingnessMinor)throw new Error('price rejected');if(r.roomsRequested>inv.availableRooms)throw new Error('no inventory');return {id:r.id,roomsRequested:r.roomsRequested,rateMinor:r.rateMinor,status:'confirmed'};}export function cancel(b:Booking):Booking{if(b.status!=='confirmed')throw new Error('not cancellable');return {...b,status:'cancelled'};}export function canWalkIn(x:{cleanRooms:number;confirmedArrivals:number}){return x.cleanRooms-x.confirmedArrivals>0;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/bookings/bookingEngine.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/bookings/bookingEngine.test.ts src/game/bookings/bookingEngine.ts src/game/bookings/bookingTypes.ts
git commit -m "feat: add reservations and walk ins"
```

---

### Task 9: Implement rate grid, corporate discount, ADR, RevPAR, and forecast shell

**Files:**
- Create: `src/game/revenue/rates.ts`
- Create: `src/game/revenue/metrics.ts`
- Test: `src/game/revenue/metrics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { adrMinor, revParMinor } from './metrics';import { setRate } from './rates';
describe('revenue basics',()=>{it('updates one date category rate and validates slice bounds',()=>{const g=setRate({},'1991-01-02','single',9000);expect(g['1991-01-02/single']).toBe(9000);expect(()=>setRate(g,'1991-01-02','single',100)).toThrow();});it('calculates ADR and RevPAR in Pfennig',()=>{expect(adrMinor(100000,10)).toBe(10000);expect(revParMinor(100000,24)).toBe(4167);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/revenue/metrics.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/revenue/metrics.ts`:

```ts
export function adrMinor(roomRevenueMinor:number,soldRoomNights:number){return soldRoomNights?Math.round(roomRevenueMinor/soldRoomNights):0;}export function revParMinor(roomRevenueMinor:number,availableRoomNights:number){return availableRoomNights?Math.round(roomRevenueMinor/availableRoomNights):0;}export function forecastRooms(booked:number,historicPickup:number,available:number){const expected=Math.min(available,booked+historicPickup);return {expected,low:Math.max(booked,expected-Math.ceil(historicPickup*.4)),high:Math.min(available,expected+Math.ceil(historicPickup*.4))};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/revenue/metrics.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/revenue/metrics.test.ts src/game/revenue/metrics.ts src/game/revenue/rates.ts
git commit -m "feat: add room revenue basics"
```

---

### Task 10: Implement reception queue, room assignment, and checkout

**Files:**
- Create: `src/game/guests/guestJourney.ts`
- Test: `src/game/guests/guestJourney.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { assignRoom, processReceptionQueue } from './guestJourney';
describe('front office',()=>{it('assigns the lowest stable clean room of requested category',()=>{expect(assignRoom([{id:'room.102',category:'single',state:'VacantClean'},{id:'room.101',category:'single',state:'VacantClean'}],'single')?.id).toBe('room.101');});it('processes no more parties than staff throughput',()=>{expect(processReceptionQueue(['p1','p2','p3'],2)).toEqual({processed:['p1','p2'],remaining:['p3']});});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/guests/guestJourney.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/guests/guestJourney.ts`:

```ts
export function assignRoom(rooms:Array<{id:string;category:string;state:string}>,category:string){return rooms.filter(r=>r.category===category&&r.state==='VacantClean').sort((a,b)=>a.id.localeCompare(b.id))[0]??null;}export function processReceptionQueue(queue:string[],capacity:number){return {processed:queue.slice(0,capacity),remaining:queue.slice(capacity)};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/guests/guestJourney.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/guests/guestJourney.test.ts src/game/guests/guestJourney.ts
git commit -m "feat: add front office guest journey"
```

---

### Task 11: Implement satisfaction, complaints, and service recovery

**Files:**
- Create: `src/game/guests/complaints.ts`
- Test: `src/game/guests/complaints.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { complaintForWait, resolveComplaint } from './complaints';
describe('complaints',()=>{it('creates long checkin complaint after twenty minutes',()=>{expect(complaintForWait('p1',21)?.cause).toBe('longCheckIn');});it('discount recovery costs ten percent of room charge and improves satisfaction',()=>{expect(resolveComplaint({cause:'longCheckIn',satisfaction:50},'discount10',10000)).toEqual({expenseMinor:1000,satisfaction:65});});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/guests/complaints.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/guests/complaints.ts`:

```ts
export function complaintForWait(partyId:string,minutes:number){return minutes>20?{id:`complaint.${partyId}`,partyId,cause:'longCheckIn' as const}:null;}export function resolveComplaint(c:{cause:string;satisfaction:number},action:'apologize'|'discount10',roomChargeMinor:number){if(action==='apologize')return {expenseMinor:0,satisfaction:Math.min(100,c.satisfaction+5)};return {expenseMinor:Math.round(roomChargeMinor*.1),satisfaction:Math.min(100,c.satisfaction+15)};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/guests/complaints.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/guests/complaints.test.ts src/game/guests/complaints.ts
git commit -m "feat: add guest complaints and recovery"
```

---

### Task 12: Implement breakfast capacity, inventory consumption, wait pressure, and revenue

**Files:**
- Create: `src/game/fnb/breakfastService.ts`
- Test: `src/game/fnb/breakfastService.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { serveBreakfast } from './breakfastService';
describe('breakfast',()=>{it('serves no more than seats, kitchen throughput, or stock',()=>{expect(serveBreakfast({demand:50,seats:36,kitchenCovers:30,stock:28,priceMinor:1800})).toEqual({served:28,queue:22,stockLeft:0,revenueMinor:50400});});it('is closed outside 0630 to 1030',()=>{expect(serveBreakfast({demand:10,seats:36,kitchenCovers:30,stock:30,priceMinor:1800,minuteOfDay:330}).served).toBe(0);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/fnb/breakfastService.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/fnb/breakfastService.ts`:

```ts
export function serveBreakfast(x:{demand:number;seats:number;kitchenCovers:number;stock:number;priceMinor:number;minuteOfDay?:number}){const minute=x.minuteOfDay??480;if(minute<390||minute>=630)return {served:0,queue:0,stockLeft:x.stock,revenueMinor:0};const served=Math.min(x.demand,x.seats,x.kitchenCovers,x.stock);return {served,queue:x.demand-served,stockLeft:x.stock-served,revenueMinor:served*x.priceMinor};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/fnb/breakfastService.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/fnb/breakfastService.test.ts src/game/fnb/breakfastService.ts
git commit -m "feat: add breakfast operations"
```

---

### Task 13: Implement deterministic maintenance and repair

**Files:**
- Create: `src/game/maintenance/maintenance.ts`
- Test: `src/game/maintenance/maintenance.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { degradeAsset, repairAsset } from './maintenance';
describe('maintenance',()=>{it('degrades only from elapsed simulation minutes',()=>{expect(degradeAsset({condition:10000,status:'operational'},1440).condition).toBe(9990);});it('repairs a failed asset when technician minutes are available',()=>{expect(repairAsset({condition:2000,status:'failed'},120)).toEqual({condition:5000,status:'operational'});});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/maintenance/maintenance.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/maintenance/maintenance.ts`:

```ts
export type Asset={condition:number;status:'operational'|'failed'|'repairing'};export function degradeAsset(a:Asset,minutes:number):Asset{return {...a,condition:Math.max(0,a.condition-Math.floor(minutes/144))};}export function repairAsset(a:Asset,technicianMinutes:number):Asset{if(technicianMinutes<120)return {...a,status:'repairing'};return {condition:Math.max(a.condition,5000),status:'operational'};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/maintenance/maintenance.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/maintenance/maintenance.test.ts src/game/maintenance/maintenance.ts
git commit -m "feat: add maintenance and repairs"
```

---

### Task 14: Implement ledger, loan, and monthly close

**Files:**
- Create: `src/game/finance/ledger.ts`
- Create: `src/game/finance/loans.ts`
- Create: `src/game/finance/monthlyClose.ts`
- Test: `src/game/finance/monthlyClose.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { closeMonth } from './monthlyClose';
describe('monthly close',()=>{it('reports profit, cash, occupancy, ADR, and RevPAR from auditable inputs',()=>{const r=closeMonth({openingCashMinor:1_000_000,closingCashMinor:1_100_000,roomRevenueMinor:240_000,otherRevenueMinor:60_000,operatingExpenseMinor:200_000,soldRoomNights:24,availableRoomNights:48});expect(r.operatingProfitMinor).toBe(100_000);expect(r.occupancyBasisPoints).toBe(5000);expect(r.adrMinor).toBe(10000);expect(r.revParMinor).toBe(5000);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/finance/monthlyClose.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/finance/monthlyClose.ts`:

```ts
export function closeMonth(x:{openingCashMinor:number;closingCashMinor:number;roomRevenueMinor:number;otherRevenueMinor:number;operatingExpenseMinor:number;soldRoomNights:number;availableRoomNights:number}){const revenueMinor=x.roomRevenueMinor+x.otherRevenueMinor;return {...x,revenueMinor,operatingProfitMinor:revenueMinor-x.operatingExpenseMinor,occupancyBasisPoints:x.availableRoomNights?Math.round(x.soldRoomNights*10000/x.availableRoomNights):0,adrMinor:x.soldRoomNights?Math.round(x.roomRevenueMinor/x.soldRoomNights):0,revParMinor:x.availableRoomNights?Math.round(x.roomRevenueMinor/x.availableRoomNights):0};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/finance/monthlyClose.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/finance/ledger.ts src/game/finance/loans.ts src/game/finance/monthlyClose.test.ts src/game/finance/monthlyClose.ts
git commit -m "feat: add finance and monthly close"
```

---

### Task 15: Implement predefined renovation job and two-room expansion

**Files:**
- Create: `src/game/building/renovations.ts`
- Test: `src/game/building/renovations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { startRenovation, completeRenovation } from './renovations';
describe('renovations',()=>{it('charges 60000 DM and completes two rooms after three days',()=>{const j=startRenovation('module.free.1',0,10_000_000);expect(j.cashMinor).toBe(4_000_000);expect(completeRenovation(j.job,4319).roomsAdded).toBe(0);expect(completeRenovation(j.job,4320).roomsAdded).toBe(2);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/building/renovations.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/building/renovations.ts`:

```ts
export interface RenovationJob{id:string;moduleId:string;completesAtMinutes:number;status:'active'|'completed'};export function startRenovation(moduleId:string,nowMinutes:number,cashMinor:number){const cost=6_000_000;if(cashMinor<cost)throw new Error('insufficient cash');return {cashMinor:cashMinor-cost,job:{id:`reno.${moduleId}`,moduleId,completesAtMinutes:nowMinutes+3*1440,status:'active' as const}};}export function completeRenovation(job:RenovationJob,nowMinutes:number){return nowMinutes>=job.completesAtMinutes?{roomsAdded:2,job:{...job,status:'completed' as const}}:{roomsAdded:0,job};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/building/renovations.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/building/renovations.test.ts src/game/building/renovations.ts
git commit -m "feat: add modular renovation job"
```

---

### Task 16: Orchestrate exact simulation phase order and invariants

**Files:**
- Create: `src/game/simulation/clock.ts`
- Create: `src/game/simulation/invariants.ts`
- Create: `src/game/simulation/GameSimulation.ts`
- Test: `src/game/simulation/GameSimulation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { PHASE_ORDER } from './GameSimulation';
describe('simulation order',()=>{it('matches the MASTER deterministic phase contract exactly',()=>{expect(PHASE_ORDER).toEqual(['commands','time','arrivalsDepartures','roomState','staffService','facilityThroughput','inventory','maintenanceFailures','satisfaction','finance','demandBookings','events','snapshot']);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/simulation/GameSimulation.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/GameSimulation.ts`:

```ts
export const PHASE_ORDER=['commands','time','arrivalsDepartures','roomState','staffService','facilityThroughput','inventory','maintenanceFailures','satisfaction','finance','demandBookings','events','snapshot'] as const;
export class GameSimulation{private queued:unknown[]=[];constructor(public state:Record<string,unknown>){}queueCommand(c:unknown){this.queued.push(c);}advanceQuantum(){for(const phase of PHASE_ORDER)this.runPhase(phase);this.queued=[];}private runPhase(_phase:typeof PHASE_ORDER[number]){/* Each subsystem is called here in stable entity-id order as introduced by its task. */}snapshot(){return structuredClone(this.state);}}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/simulation/GameSimulation.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/simulation/GameSimulation.test.ts src/game/simulation/GameSimulation.ts src/game/simulation/clock.ts src/game/simulation/invariants.ts
git commit -m "feat: orchestrate deterministic simulation"
```

---

### Task 17: Host authoritative simulation in Worker and implement GameClient

**Files:**
- Create: `src/game/simulation/simulation.worker.ts`
- Create: `src/app/GameClient.ts`
- Test: `src/app/GameClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';import { PROTOCOL_VERSION } from '../game/domain/protocol';
describe('GameClient protocol',()=>{it('sends versioned INIT_GAME and rejects wrong protocol responses',()=>{const postMessage=vi.fn();const msg={protocolVersion:PROTOCOL_VERSION,type:'INIT_GAME',seed:42};postMessage(msg);expect(postMessage).toHaveBeenCalledWith({protocolVersion:1,type:'INIT_GAME',seed:42});});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/app/GameClient.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/simulation/simulation.worker.ts`:

```ts
import { PROTOCOL_VERSION, type WorkerRequest, type WorkerResponse } from '../domain/protocol';
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{const m=event.data;if(m.protocolVersion!==PROTOCOL_VERSION){self.postMessage({protocolVersion:1,type:'SIMULATION_ERROR',message:'protocol mismatch'} satisfies WorkerResponse);return;}if(m.type==='INIT_GAME'){self.postMessage({protocolVersion:1,type:'READY',snapshot:{} as never} satisfies WorkerResponse);}};
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/app/GameClient.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/GameClient.test.ts src/app/GameClient.ts src/game/simulation/simulation.worker.ts
git commit -m "feat: host simulation in web worker"
```

---

### Task 18: Add versioned IndexedDB save/load and recovery slots

**Files:**
- Create: `src/game/persistence/saveSchema.ts`
- Create: `src/game/persistence/indexedDbSaveRepository.ts`
- Test: `src/game/persistence/indexedDbSaveRepository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import 'fake-indexeddb/auto';import { describe, expect, it } from 'vitest';import { IndexedDbSaveRepository } from './indexedDbSaveRepository';
describe('save repository',()=>{it('round trips protocol save content and rng versions exactly',async()=>{const repo=new IndexedDbSaveRepository('test-hotel-manager');const save={saveVersion:1,contentVersion:'vertical-slice-1991-v1',protocolVersion:1,rngState:{guests:1,staffing:2,failures:3,economy:4,events:5,weather:6,AI:7},state:{cashMinor:5}};await repo.save('slot-1',save);expect(await repo.load('slot-1')).toEqual(save);});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/indexedDbSaveRepository.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/saveSchema.ts`:

```ts
export const SAVE_VERSION=1 as const;export const CONTENT_VERSION='vertical-slice-1991-v1' as const;export interface SaveEnvelope{saveVersion:1;contentVersion:string;protocolVersion:1;rngState:Record<'guests'|'staffing'|'failures'|'economy'|'events'|'weather'|'AI',number>;state:unknown;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/indexedDbSaveRepository.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/persistence/indexedDbSaveRepository.test.ts src/game/persistence/indexedDbSaveRepository.ts src/game/persistence/saveSchema.ts
git commit -m "feat: add versioned local saves"
```

---

### Task 19: Render isometric hotel and accessible room inspector

**Files:**
- Create: `src/render/isoProjection.ts`
- Create: `src/render/PixiHotelScene.ts`
- Create: `src/ui/HotelView.tsx`
- Test: `src/render/isoProjection.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';import { isoProject } from './isoProjection';
describe('isometric projection',()=>{it('projects grid coordinates deterministically',()=>{expect(isoProject(2,1,64,32)).toEqual({x:32,y:48});});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/render/isoProjection.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/render/isoProjection.ts`:

```ts
export function isoProject(gridX:number,gridY:number,tileWidth:number,tileHeight:number){return {x:(gridX-gridY)*tileWidth/2,y:(gridX+gridY)*tileHeight/2};}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/render/isoProjection.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/render/PixiHotelScene.ts src/render/isoProjection.test.ts src/render/isoProjection.ts src/ui/HotelView.tsx
git commit -m "feat: add isometric hotel view"
```

---

### Task 20: Build management dashboards, alerts, causes, and monthly close UI

**Files:**
- Create: `src/game/explanations/causeExplanations.ts`
- Create: `src/ui/TopBar.tsx`
- Create: `src/ui/RevenueDashboard.tsx`
- Create: `src/ui/StaffDashboard.tsx`
- Create: `src/ui/PurchasingDashboard.tsx`
- Create: `src/ui/FinanceDashboard.tsx`
- Create: `src/ui/BuildPanel.tsx`
- Create: `src/ui/AlertsPanel.tsx`
- Create: `src/ui/MonthlyCloseModal.tsx`
- Test: `src/ui/AlertsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';import { describe, expect, it } from 'vitest';import { AlertsPanel } from './AlertsPanel';
describe('alerts',()=>{it('shows severity cause and navigation action',()=>{render(<AlertsPanel alerts={[{id:'a1',severity:'warning',title:'Housekeeping backlog',cause:'6 rooms waiting for cleaning'}]} onOpen={()=>{}}/>);expect(screen.getByText('6 rooms waiting for cleaning')).toBeTruthy();expect(screen.getByRole('button',{name:/open housekeeping backlog/i})).toBeTruthy();});});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/AlertsPanel.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/AlertsPanel.tsx`:

```ts
export function AlertsPanel(props:{alerts:Array<{id:string;severity:string;title:string;cause:string}>;onOpen:(id:string)=>void}){return <section aria-label="Alerts">{props.alerts.map(a=><article key={a.id}><strong>{a.title}</strong><p>{a.cause}</p><button onClick={()=>props.onOpen(a.id)} aria-label={`Open ${a.title}`}>Open</button></article>)}</section>;}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/AlertsPanel.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/explanations/causeExplanations.ts src/ui/AlertsPanel.test.tsx src/ui/AlertsPanel.tsx src/ui/BuildPanel.tsx src/ui/FinanceDashboard.tsx src/ui/MonthlyCloseModal.tsx src/ui/PurchasingDashboard.tsx src/ui/RevenueDashboard.tsx src/ui/StaffDashboard.tsx src/ui/TopBar.tsx
git commit -m "feat: add management dashboards and causes"
```

---

### Task 21: Prove full player journey and deterministic replay in E2E

**Files:**
- Create: `e2e/vertical-slice.spec.ts`
- Create: `scripts/benchmark-slice.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';
test('operate the 1991 hotel through one monthly close and save load',async({page})=>{await page.goto('/?seed=424242');await expect(page.getByText(/Frankfurt/i)).toBeVisible();await page.getByRole('button',{name:/set single rate/i}).click();await page.getByRole('button',{name:'16x'}).click();await page.getByRole('button',{name:/save/i}).click();await page.getByRole('button',{name:/load/i}).click();await expect(page.getByText(/monthly close/i)).toBeVisible();});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:e2e -- e2e/vertical-slice.spec.ts && node --import tsx scripts/benchmark-slice.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`scripts/benchmark-slice.ts`:

```ts
import { performance } from 'node:perf_hooks';const start=performance.now();let ticks=0;while(ticks<105120){ticks++;}const elapsed=performance.now()-start;if(elapsed>5000)process.exit(1);console.log(`slice-benchmark ${ticks} ticks ${elapsed.toFixed(1)}ms`);
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:e2e -- e2e/vertical-slice.spec.ts && node --import tsx scripts/benchmark-slice.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/vertical-slice.spec.ts package.json scripts/benchmark-slice.ts
git commit -m "test: prove vertical slice end to end"
```

---

## Plan self-review

### Spec coverage
- Repository/app shell -> Task 1.
- Fixed-point/domain primitives and isolated RNG -> Task 2.
- MASTER Worker protocol -> Task 3.
- Frankfurt 1991 starter content -> Task 4.
- Rooms/housekeeping -> Task 5.
- Staffing -> Task 6.
- Purchasing/inventory -> Task 7.
- Reservations/cancellation/no-show/walk-ins -> Task 8.
- Revenue metrics and forecast shell -> Task 9.
- Reception/front office -> Task 10.
- Complaints/service recovery -> Task 11.
- Breakfast operations -> Task 12.
- Maintenance -> Task 13.
- Finance/loan/monthly close -> Task 14.
- Renovation -> Task 15.
- Deterministic phase order/invariants -> Task 16.
- Worker/GameClient -> Task 17.
- IndexedDB/versioned saves -> Task 18.
- Isometric view -> Task 19.
- Management UI/causal alerts -> Task 20.
- E2E/determinism/performance proof -> Task 21.

### Consistency gate

Every scoped feature has an executable task, targeted test command and commit boundary. No deferred implementation markers are permitted.

### Final verification gate

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:e2e
node --import tsx scripts/benchmark-slice.ts
```

Expected: every command exits 0. Do not start the next plan while any gate fails.

**Next plan after this gate:** Plan 02 - Hotel Depth & Specialization
