# Multi-Hotel Company & Brands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the verified single-hotel game into a multi-property hotel group with ownership models, brands, development, delegated managers, treasury, acquisitions, and portfolio control.

**Architecture:** Keep each hotel as an independent operating unit and add a corporate layer above it. Corporate actions remain typed simulation commands in the authoritative Worker; hotels publish standardized operating results upward, while budgets, brands, ownership contracts, and manager authority flow downward.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-04 completed and green**.

MASTER-spec coverage: MASTER chapters 22-28 and 40-44, including the audited Plan 01-02 depth completion delta; implementation decomposition chapters 88 and 91. See `2026-08-09-MASTER-spec-coverage-audit.md`.

## Implementation fidelity rule

Code fragments in this plan demonstrate the first red/green increment only. They are not
the completion definition. A task is complete only when its full scope and MASTER
completion contract are implemented, integrated into commands/events/snapshots and
persistence where applicable, and all focused plus final gates pass. Do not commit the
illustrative minimum as the finished task.

## Scope contract

**In scope**
- multiple player-owned or operated hotels in one company portfolio
- owned, leased, management-contract, and franchise operating models
- brand definitions, brand standards, audits, and rebranding
- hotel development pipeline from feasibility through opening and ramp-up
- regional structure, headquarters, shared services, and hotel budgets
- manager authority limits and escalation
- treasury, internal funding, and portfolio currency exposure
- acquisition valuation, due diligence, and atomic transactions
- portfolio UI with drill-down to an individual hotel

**Explicitly outside this plan**
- dynamic rival personalities and narrative event chains (Plan 06)
- large-scale content editing tools (Plan 07)
- final accessibility/audio/localization polish (Plan 08)
- final long-run scale optimization (Plan 09)

## Locked file map

All paths are relative to the repository root.

```text
src/game/company/portfolio.ts
src/game/company/legalEntities.ts
src/game/ownership/models.ts
src/game/brands/brandTypes.ts
src/game/brands/brandAudit.ts
src/game/development/feasibility.ts
src/game/development/preOpening.ts
src/game/development/rampUp.ts
src/game/company/sharedServices.ts
src/game/company/budgets.ts
src/game/management/managerAuthority.ts
src/game/management/escalation.ts
src/game/treasury/treasury.ts
src/game/treasury/internalFunding.ts
src/game/ma/valuation.ts
src/game/ma/dueDiligence.ts
src/game/ma/acquisition.ts
src/ui/company/PortfolioDashboard.tsx
src/ui/company/BrandDashboard.tsx
src/ui/company/DevelopmentDashboard.tsx
src/ui/company/ManagerGovernancePanel.tsx
src/game/persistence/migrations/v4-to-v5.ts
e2e/multi-hotel.spec.ts
```

---

### Task 1: Create portfolio and legal-entity model

**Files:**
- Create: `src/game/company/portfolio.ts`
- Create: `src/game/company/legalEntities.ts`
- Test: `src/game/company/portfolio.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createPortfolio, addHotelToPortfolio } from './portfolio';

describe('company portfolio', () => {
  it('keeps hotels as separate operating units under one company', () => {
    const base = createPortfolio('company.player');
    const next = addHotelToPortfolio(base, { hotelId: 'hotel.frankfurt.1', legalEntityId: 'entity.de.1' });
    expect(next.hotelIds).toEqual(['hotel.frankfurt.1']);
    expect(next.hotelLegalEntity['hotel.frankfurt.1']).toBe('entity.de.1');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/company/portfolio.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/company/portfolio.ts`:

```ts
export interface CompanyPortfolio {
  companyId: string;
  hotelIds: string[];
  hotelLegalEntity: Record<string, string>;
}

export function createPortfolio(companyId: string): CompanyPortfolio {
  return { companyId, hotelIds: [], hotelLegalEntity: {} };
}

export function addHotelToPortfolio(
  portfolio: CompanyPortfolio,
  input: { hotelId: string; legalEntityId: string },
): CompanyPortfolio {
  if (portfolio.hotelIds.includes(input.hotelId)) throw new Error('hotel already in portfolio');
  return {
    ...portfolio,
    hotelIds: [...portfolio.hotelIds, input.hotelId],
    hotelLegalEntity: { ...portfolio.hotelLegalEntity, [input.hotelId]: input.legalEntityId },
  };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/company/portfolio.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/company/legalEntities.ts src/game/company/portfolio.test.ts src/game/company/portfolio.ts
git commit -m "feat: add company portfolio model"
```

---

### Task 2: Model ownership and operating contracts

**Files:**
- Create: `src/game/ownership/models.ts`
- Test: `src/game/ownership/models.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { monthlyOwnershipCashFlows } from './models';

describe('ownership models', () => {
  it('charges lease rent and franchise fees through explicit contract rules', () => {
    expect(monthlyOwnershipCashFlows({ kind: 'lease', monthlyRentMinor: 1_000_000 }, 8_000_000)).toEqual([-1_000_000]);
    expect(monthlyOwnershipCashFlows({ kind: 'franchise', royaltyBasisPoints: 500 }, 8_000_000)).toEqual([-400_000]);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/ownership/models.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/ownership/models.ts`:

```ts
export type OperatingModel =
  | { kind: 'owned' }
  | { kind: 'lease'; monthlyRentMinor: number }
  | { kind: 'management'; managementFeeBasisPoints: number }
  | { kind: 'franchise'; royaltyBasisPoints: number };

export function monthlyOwnershipCashFlows(model: OperatingModel, roomRevenueMinor: number): number[] {
  switch (model.kind) {
    case 'owned': return [];
    case 'lease': return [-model.monthlyRentMinor];
    case 'management': return [Math.trunc(roomRevenueMinor * model.managementFeeBasisPoints / 10_000)];
    case 'franchise': return [-Math.trunc(roomRevenueMinor * model.royaltyBasisPoints / 10_000)];
  }
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/ownership/models.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/ownership/models.test.ts src/game/ownership/models.ts
git commit -m "feat: add hotel operating models"
```

---

### Task 3: Define brands, standards, and brand audits

**Files:**
- Create: `src/game/brands/brandTypes.ts`
- Create: `src/game/brands/brandAudit.ts`
- Test: `src/game/brands/brandAudit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { auditBrand } from './brandAudit';

describe('brand audit', () => {
  it('reports concrete failed standards instead of a single XP score', () => {
    const result = auditBrand(
      { minRoomQuality: 70, requiredFacilities: ['facility.breakfast_room'] },
      { roomQuality: 65, facilities: [] },
    );
    expect(result.compliant).toBe(false);
    expect(result.failures).toEqual(['room-quality', 'facility.breakfast_room']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/brands/brandAudit.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/brands/brandAudit.ts`:

```ts
export interface BrandStandard {
  minRoomQuality: number;
  requiredFacilities: string[];
}

export interface BrandAuditInput {
  roomQuality: number;
  facilities: string[];
}

export function auditBrand(standard: BrandStandard, hotel: BrandAuditInput) {
  const failures: string[] = [];
  if (hotel.roomQuality < standard.minRoomQuality) failures.push('room-quality');
  for (const id of standard.requiredFacilities) if (!hotel.facilities.includes(id)) failures.push(id);
  return { compliant: failures.length === 0, failures };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/brands/brandAudit.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/brands/brandAudit.test.ts src/game/brands/brandAudit.ts src/game/brands/brandTypes.ts
git commit -m "feat: add brand standards and audits"
```

---

### Task 4: Add feasibility analysis for new hotel development

**Files:**
- Create: `src/game/development/feasibility.ts`
- Test: `src/game/development/feasibility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { calculateFeasibility } from './feasibility';

describe('development feasibility', () => {
  it('returns base, downside, and upside values instead of perfect certainty', () => {
    const result = calculateFeasibility({ expectedAdrMinor: 18_000, rooms: 120, occupancyBasisPoints: 7000, uncertaintyBasisPoints: 1200 });
    expect(result.downsideAnnualRoomRevenueMinor).toBeLessThan(result.baseAnnualRoomRevenueMinor);
    expect(result.upsideAnnualRoomRevenueMinor).toBeGreaterThan(result.baseAnnualRoomRevenueMinor);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/development/feasibility.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/development/feasibility.ts`:

```ts
export interface FeasibilityInput {
  expectedAdrMinor: number;
  rooms: number;
  occupancyBasisPoints: number;
  uncertaintyBasisPoints: number;
}

export function calculateFeasibility(input: FeasibilityInput) {
  const base = Math.trunc(input.expectedAdrMinor * input.rooms * 365 * input.occupancyBasisPoints / 10_000);
  const spread = Math.trunc(base * input.uncertaintyBasisPoints / 10_000);
  return {
    downsideAnnualRoomRevenueMinor: base - spread,
    baseAnnualRoomRevenueMinor: base,
    upsideAnnualRoomRevenueMinor: base + spread,
  };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/development/feasibility.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/development/feasibility.test.ts src/game/development/feasibility.ts
git commit -m "feat: add hotel feasibility analysis"
```

---

### Task 5: Implement pre-opening checklist and opening gate

**Files:**
- Create: `src/game/development/preOpening.ts`
- Test: `src/game/development/preOpening.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateOpeningReadiness } from './preOpening';

describe('pre-opening', () => {
  it('blocks opening until staff, suppliers, inventory, technology, and sales are ready', () => {
    const result = evaluateOpeningReadiness({ staffReady: true, suppliersReady: true, inventoryReady: false, technologyReady: true, salesOpen: true });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(['inventory']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/development/preOpening.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/development/preOpening.ts`:

```ts
export interface OpeningReadiness {
  staffReady: boolean;
  suppliersReady: boolean;
  inventoryReady: boolean;
  technologyReady: boolean;
  salesOpen: boolean;
}

export function evaluateOpeningReadiness(input: OpeningReadiness) {
  const missing: string[] = [];
  if (!input.staffReady) missing.push('staff');
  if (!input.suppliersReady) missing.push('suppliers');
  if (!input.inventoryReady) missing.push('inventory');
  if (!input.technologyReady) missing.push('technology');
  if (!input.salesOpen) missing.push('sales');
  return { ready: missing.length === 0, missing };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/development/preOpening.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/development/preOpening.test.ts src/game/development/preOpening.ts
git commit -m "feat: add pre opening gate"
```

---

### Task 6: Model new-hotel ramp-up

**Files:**
- Create: `src/game/development/rampUp.ts`
- Test: `src/game/development/rampUp.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { rampUpDemandFactorBasisPoints } from './rampUp';

describe('hotel ramp up', () => {
  it('increases market capture gradually after opening', () => {
    expect(rampUpDemandFactorBasisPoints(0)).toBe(3500);
    expect(rampUpDemandFactorBasisPoints(12)).toBeGreaterThan(rampUpDemandFactorBasisPoints(1));
    expect(rampUpDemandFactorBasisPoints(36)).toBe(10_000);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/development/rampUp.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/development/rampUp.ts`:

```ts
export function rampUpDemandFactorBasisPoints(monthsOpen: number): number {
  if (monthsOpen <= 0) return 3500;
  if (monthsOpen >= 36) return 10_000;
  return Math.min(10_000, 3500 + Math.trunc(monthsOpen * 6500 / 36));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/development/rampUp.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/development/rampUp.test.ts src/game/development/rampUp.ts
git commit -m "feat: model hotel ramp up"
```

---

### Task 7: Add headquarters shared services

**Files:**
- Create: `src/game/company/sharedServices.ts`
- Test: `src/game/company/sharedServices.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { purchasingDiscountBasisPoints } from './sharedServices';

describe('shared services', () => {
  it('adds scale benefit with a capped purchasing discount', () => {
    expect(purchasingDiscountBasisPoints(1)).toBe(0);
    expect(purchasingDiscountBasisPoints(10)).toBeGreaterThan(0);
    expect(purchasingDiscountBasisPoints(100)).toBeLessThanOrEqual(1200);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/company/sharedServices.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/company/sharedServices.ts`:

```ts
export function purchasingDiscountBasisPoints(hotelCount: number): number {
  if (hotelCount <= 1) return 0;
  return Math.min(1200, Math.trunc(Math.log2(hotelCount) * 250));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/company/sharedServices.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/company/sharedServices.test.ts src/game/company/sharedServices.ts
git commit -m "feat: add corporate shared services"
```

---

### Task 8: Add hotel budgets and corporate targets

**Files:**
- Create: `src/game/company/budgets.ts`
- Test: `src/game/company/budgets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { canSpendCapex } from './budgets';

describe('hotel budgets', () => {
  it('rejects local capex above the assigned hotel budget', () => {
    expect(canSpendCapex({ capexBudgetMinor: 5_000_000, capexSpentMinor: 4_500_000 }, 600_000)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/company/budgets.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/company/budgets.ts`:

```ts
export interface HotelBudget { capexBudgetMinor: number; capexSpentMinor: number; }
export function canSpendCapex(budget: HotelBudget, amountMinor: number): boolean {
  return amountMinor >= 0 && budget.capexSpentMinor + amountMinor <= budget.capexBudgetMinor;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/company/budgets.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/company/budgets.test.ts src/game/company/budgets.ts
git commit -m "feat: add hotel budgets"
```

---

### Task 9: Implement manager authority and escalation

**Files:**
- Create: `src/game/management/managerAuthority.ts`
- Create: `src/game/management/escalation.ts`
- Test: `src/game/management/escalation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { decideEscalation } from './escalation';

describe('manager escalation', () => {
  it('escalates spending above the manager limit', () => {
    expect(decideEscalation({ repairLimitMinor: 5_000_000 }, { kind: 'repair', amountMinor: 5_000_001 })).toBe('escalate');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/management/escalation.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/management/escalation.ts`:

```ts
export interface ManagerAuthority { repairLimitMinor: number; }
export type LocalDecision = { kind: 'repair'; amountMinor: number } | { kind: 'sell-hotel' };
export function decideEscalation(authority: ManagerAuthority, decision: LocalDecision): 'allow' | 'escalate' {
  if (decision.kind === 'sell-hotel') return 'escalate';
  return decision.amountMinor <= authority.repairLimitMinor ? 'allow' : 'escalate';
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/management/escalation.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/management/escalation.test.ts src/game/management/escalation.ts src/game/management/managerAuthority.ts
git commit -m "feat: add manager authority limits"
```

---

### Task 10: Add treasury and internal funding

**Files:**
- Create: `src/game/treasury/treasury.ts`
- Create: `src/game/treasury/internalFunding.ts`
- Test: `src/game/treasury/internalFunding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { transferInternalFunding } from './internalFunding';

describe('internal funding', () => {
  it('moves cash without changing consolidated group cash', () => {
    const result = transferInternalFunding({ hqMinor: 10_000_000, hotelMinor: 1_000_000 }, 2_000_000);
    expect(result).toEqual({ hqMinor: 8_000_000, hotelMinor: 3_000_000 });
    expect(result.hqMinor + result.hotelMinor).toBe(11_000_000);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/treasury/internalFunding.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/treasury/internalFunding.ts`:

```ts
export function transferInternalFunding(
  balances: { hqMinor: number; hotelMinor: number },
  amountMinor: number,
) {
  if (amountMinor < 0 || amountMinor > balances.hqMinor) throw new Error('invalid transfer');
  return { hqMinor: balances.hqMinor - amountMinor, hotelMinor: balances.hotelMinor + amountMinor };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/treasury/internalFunding.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/treasury/internalFunding.test.ts src/game/treasury/internalFunding.ts src/game/treasury/treasury.ts
git commit -m "feat: add internal funding"
```

---

### Task 11: Add acquisition valuation and due diligence

**Files:**
- Create: `src/game/ma/valuation.ts`
- Create: `src/game/ma/dueDiligence.ts`
- Test: `src/game/ma/valuation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { valueHotel } from './valuation';

describe('hotel valuation', () => {
  it('reduces value for required renovation and debt assumed', () => {
    const value = valueHotel({ annualGopMinor: 20_000_000, multipleBasisPoints: 80000, renovationNeedMinor: 15_000_000, debtAssumedMinor: 30_000_000 });
    expect(value.enterpriseValueMinor).toBe(160_000_000);
    expect(value.equityValueMinor).toBe(115_000_000);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/ma/valuation.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/ma/valuation.ts`:

```ts
export interface HotelValuationInput {
  annualGopMinor: number;
  multipleBasisPoints: number;
  renovationNeedMinor: number;
  debtAssumedMinor: number;
}
export function valueHotel(input: HotelValuationInput) {
  const enterpriseValueMinor = Math.trunc(input.annualGopMinor * input.multipleBasisPoints / 10_000);
  return { enterpriseValueMinor, equityValueMinor: enterpriseValueMinor - input.renovationNeedMinor - input.debtAssumedMinor };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/ma/valuation.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/ma/dueDiligence.ts src/game/ma/valuation.test.ts src/game/ma/valuation.ts
git commit -m "feat: add acquisition valuation"
```

---

### Task 12: Process acquisitions atomically in the simulation

**Files:**
- Create: `src/game/ma/acquisition.ts`
- Test: `src/game/ma/acquisition.test.ts`
- Modify: `src/game/simulation/GameSimulation.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { executeAcquisition } from './acquisition';

describe('acquisition transaction', () => {
  it('leaves state unchanged when cash is insufficient', () => {
    const state = { cashMinor: 1_000_000, hotelIds: ['hotel.a'] };
    expect(() => executeAcquisition(state, { hotelId: 'hotel.b', priceMinor: 2_000_000 })).toThrow();
    expect(state).toEqual({ cashMinor: 1_000_000, hotelIds: ['hotel.a'] });
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/ma/acquisition.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/ma/acquisition.ts`:

```ts
export interface AcquisitionState { cashMinor: number; hotelIds: string[]; }
export function executeAcquisition(state: AcquisitionState, deal: { hotelId: string; priceMinor: number }): AcquisitionState {
  if (deal.priceMinor > state.cashMinor) throw new Error('insufficient cash');
  if (state.hotelIds.includes(deal.hotelId)) throw new Error('already owned');
  return { cashMinor: state.cashMinor - deal.priceMinor, hotelIds: [...state.hotelIds, deal.hotelId] };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/ma/acquisition.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/ma/acquisition.test.ts src/game/ma/acquisition.ts src/game/simulation/GameSimulation.ts
git commit -m "feat: add atomic hotel acquisitions"
```

---

### Task 13: Build portfolio, brand, development, and governance UI

**Files:**
- Create: `src/ui/company/PortfolioDashboard.tsx`
- Create: `src/ui/company/BrandDashboard.tsx`
- Create: `src/ui/company/DevelopmentDashboard.tsx`
- Create: `src/ui/company/ManagerGovernancePanel.tsx`
- Test: `src/ui/company/PortfolioDashboard.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PortfolioDashboard } from './PortfolioDashboard';

describe('PortfolioDashboard', () => {
  it('shows each hotel with occupancy, profit, warning count, and manager', () => {
    render(<PortfolioDashboard hotels={[{ id:'h1', name:'Frankfurt Central', occupancyBasisPoints:7800, monthlyProfitMinor:7100000, warnings:1, managerName:'Anna Keller' }]} onOpenHotel={() => {}} />);
    expect(screen.getByText('Frankfurt Central')).toBeTruthy();
    expect(screen.getByText(/78%/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /open frankfurt central/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/company/PortfolioDashboard.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/company/PortfolioDashboard.tsx`:

```ts
export function PortfolioDashboard(props: {
  hotels: Array<{ id:string; name:string; occupancyBasisPoints:number; monthlyProfitMinor:number; warnings:number; managerName:string }>;
  onOpenHotel: (id:string) => void;
}) {
  return <section aria-label="Hotel portfolio">{props.hotels.map(h => <article key={h.id}>
    <h3>{h.name}</h3><p>{Math.round(h.occupancyBasisPoints/100)}% occupancy</p>
    <p>{h.warnings} warnings - Manager: {h.managerName}</p>
    <button onClick={() => props.onOpenHotel(h.id)} aria-label={`Open ${h.name}`}>Open hotel</button>
  </article>)}</section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/company/PortfolioDashboard.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/company/BrandDashboard.tsx src/ui/company/DevelopmentDashboard.tsx src/ui/company/ManagerGovernancePanel.tsx src/ui/company/PortfolioDashboard.test.tsx src/ui/company/PortfolioDashboard.tsx
git commit -m "feat: add corporate portfolio ui"
```

---

### Task 14: Migrate saves and prove second-hotel expansion end to end

**Files:**
- Create: `src/game/persistence/migrations/v4-to-v5.ts`
- Test: `src/game/persistence/migrations/v4-to-v5.test.ts`
- Create: `e2e/multi-hotel.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { migrateV4ToV5 } from './v4-to-v5';

describe('v4 to v5 migration', () => {
  it('wraps the original hotel in a player portfolio without changing its id', () => {
    const migrated = migrateV4ToV5({ saveVersion:4, hotel:{ id:'hotel.frankfurt.1' } });
    expect(migrated.saveVersion).toBe(5);
    expect(migrated.company.portfolio.hotelIds).toEqual(['hotel.frankfurt.1']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/migrations/v4-to-v5.test.ts && npm run test:e2e -- e2e/multi-hotel.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v4-to-v5.ts`:

```ts
export function migrateV4ToV5(oldSave: { saveVersion:4; hotel:{ id:string } }) {
  return {
    ...oldSave,
    saveVersion: 5 as const,
    company: { portfolio: { hotelIds: [oldSave.hotel.id] } },
  };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/migrations/v4-to-v5.test.ts && npm run test:e2e -- e2e/multi-hotel.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/multi-hotel.spec.ts src/game/persistence/migrations/v4-to-v5.test.ts src/game/persistence/migrations/v4-to-v5.ts
git commit -m "test: cover multi hotel expansion"
```

---

### Tasks 15-21: Close the audited hotel, commercial, and presentation depth delta

These tasks are release-blocking. They extend the same v4-to-v5 migration and the
multi-hotel E2E; they do not create an intermediate save version.

#### Task 15: Complete accounting, risk, insurance, and utilities

**Files:** Create `src/game/finance/statements.ts`, `src/game/risk/insurance.ts`,
`src/game/utilities/consumption.ts`; add colocated tests; modify the ledger, company
snapshot, `v4-to-v5.ts`, and `e2e/multi-hotel.spec.ts`.

**MASTER completion contract:** P&L, cash flow, and balance sheet reconcile while
keeping CapEx/OpEx, depreciation, receivables/payables, tax abstraction, debt schedules,
rates, amortization, credit, collateral, insolvency, restructuring, internal funding,
and treasury distinct. Insurance includes coverage, limit, deductible, premium,
exclusions, underinsurance, evidence, delay, settlement, and ledger effects. Energy,
water, waste, contracts, outages, efficiency investment, and consequences remain
separate; there is no universal green score.

- [ ] Write failing invariant tests for P&L, cash flow, balance sheet, depreciation,
  receivables/payables, tax abstraction, debt schedules, collateral, insolvency and
  restructuring; add deterministic policy/claim/underinsurance tests and metered
  energy, water, outage, waste, sustainability, and supply-contract tests.
- [ ] Run `npm run test:run -- src/game/finance src/game/risk src/game/utilities` and
  confirm the new contracts fail.
- [ ] Implement integer-minor-unit postings and fixed-point rates. Claims and outages
  consume isolated RNG streams; sustainability has operational causes, not one score.
  Persist all authoritative schedules and contracts in the v4-to-v5 migration.
- [ ] Run the focused suites, finance invariants, migration test, multi-hotel E2E, and
  `npm run typecheck`.
- [ ] Commit as `feat: complete finance risk and utilities`.

#### Task 16: Complete Sales, Marketing, CRM, Loyalty, and reputation

**Files:** Create `src/game/commercial/{campaigns,salesPipeline,crm,loyalty}.ts`,
`src/game/reputation/dimensions.ts`, colocated tests, and management UI under
`src/ui/company/`; modify snapshots, commands, migration, and E2E.

**MASTER completion contract:** Campaigns declare objective, target, channel, duration,
budget, creative quality, reach/frequency, uncertainty, and lagged attribution. Sales
tracks leads, negotiated contracts, expected volume, rates, concessions, validity,
renewal, and profitability. CRM respects consent and stores relevant history/preferences;
loyalty models earn, burn, tiers, benefits, liability, breakage, and cross-hotel cost.
Hotel, brand, group, employer, media, channel reputation, and personal prestige remain
separate with scoped causes, decay/repair, and effects.

- [ ] Write failing causal tests for early/late channel availability, campaign target,
  duration, budget, attribution uncertainty, negotiated accounts, CRM consent/data,
  loyalty earn/burn/liability, and separate hotel/brand/group/employer/media/channel
  reputations. Reputation dimensions must not collapse into prestige.
- [ ] Run `npm run test:run -- src/game/commercial src/game/reputation` and confirm fail.
- [ ] Implement typed commands, domain events, ledger postings, explainable demand and
  access effects, and automation limits. Persist balances and histories in v4-to-v5.
- [ ] Run focused tests, migration, E2E, `npm run typecheck`, and `npm run lint`.
- [ ] Commit as `feat: add commercial lifecycle and reputation dimensions`.

#### Task 17: Complete employee and supplier lifecycles

**Files:** Create `src/game/staff/employeeLifecycle.ts` and
`src/game/purchasing/contracts.ts`; add tests; modify shared-services and governance UI.

- [ ] Write failing tests for contracts, overtime, sickness, leave, training,
  promotion, resignation/dismissal, employer reputation, supplier terms, lead time,
  spoilage, reorder rules, stockouts, and central-purchasing trade-offs.
- [ ] Run the two focused suites and confirm the expected failures.
- [ ] Implement stable-ID processing and shared hotel/company primitives; manager
  automation obeys budgets and authority limits and never receives hidden inventory.
- [ ] Run focused/system tests, migration, E2E, and typecheck.
- [ ] Commit as `feat: complete people and procurement lifecycles`.

#### Task 18: Complete guest, complaint, and service-recovery depth

**Files:** Create `src/game/guests/partyLifecycle.ts` and
`src/game/guests/recoveryAuthority.ts`; add tests; modify CRM/reputation integration.

**MASTER completion contract:** Parties have stable identity/membership, segment, needs,
budget, preferences, tolerance, loyalty, and booking context. Search/comparison uses
price, location, fit, availability, reputations, channel visibility, loyalty, and
uncertainty. Front office covers early/late handling, assignment, room changes, luggage,
concierge, inspection, Lost & Found, and delayed release. Satisfaction and complaints
retain stage-specific contributors, cause, severity, response, authority, recovery cost,
and outcome; recovery may mitigate but never erase the original failure.

- [ ] Write failing journey tests for party composition, needs, comparison, arrival,
  stay, complaints, authority-bounded recovery, checkout, review, loyalty, and CRM.
- [ ] Implement all mutations through commands/events and expose causal contributors;
  recovery costs post to the ledger and rejected authority actions are atomic.
- [ ] Run guest/commercial/finance tests, migration, E2E, and typecheck.
- [ ] Commit as `feat: complete guest journey and recovery`.

#### Task 19: Complete lobby, shops, outdoor areas, and operator models

**Files:** Create `src/game/facilities/lobbyAutomation.ts`,
`src/game/facilities/commercialSpaces.ts`, and tests; extend facility snapshot, DOM/Pixi,
classification, brand audit, and `e2e/multi-hotel.spec.ts`.

**MASTER completion contract:** Lobby demand includes arrival, orientation, waiting,
reception, checkout, baggage, and concierge. Capacity expansions and adoption-gated
self/mobile/digital-key options change staffing and failure modes. Parking, mobility,
shops, concessions/leases, outdoor areas, and security declare capacity, hours, price or
contract economics, staffing, maintenance, fit, and visible effects. Classification is
an auditable requirement result, never XP; specialization is a dependency/fit trade-off.

- [ ] Write failing capacity/economic tests for lobby/reception automation, parking and
  mobility dependencies, shops with self-operation/lease/concession economics, outdoor
  areas, security load, and classification/specialization effects.
- [ ] Implement via generic facility throughput and shared ownership/contract rules;
  all critical actions retain a semantic DOM path.
- [ ] Run facility/classification/ownership tests, visual E2E assertions, typecheck,
  lint, and build.
- [ ] Commit as `feat: close remaining hotel facility depth`.

#### Task 20: Close F&B, wellness, events, laundry, and engineering edge contracts

**Files:** Extend existing Plan 02 systems/tests, facility snapshot, ledger integration,
`v4-to-v5.ts`, and `e2e/multi-hotel.spec.ts`.

- [ ] Write a failing matrix for concepts/hours, reservations/waitlists, external guests,
  recipes/stations, breakfast/board plans, mise-en-place, allergies, menu engineering,
  waste, bar/lounge, and room-service transport/elevator load.
- [ ] Add failing contracts for wellness resource/specialist/maintenance load and slots;
  event negotiation, deposits, cancellation, blocks, technology, execution peaks, and
  delayed city effect; laundry floor stock/internal-external trade-offs; and engineering
  safety, revenue, and follow-on-damage priorities.
- [ ] Implement through shared capacity, inventory, staffing, maintenance, demand, and
  ledger primitives while preserving hotel-day/opening-hour boundaries.
- [ ] Run `npm run test:run -- src/game/fnb src/game/wellness src/game/eventsales src/game/laundry src/game/engineering`, migration, E2E, typecheck, and determinism.
- [ ] Commit as `feat: complete deep hotel operating contracts`.

#### Task 21: Complete the operational isometric-world contract

**Files:** Extend `src/render/`, snapshot/protocol, semantic DOM, renderer/navigation
tests, and `e2e/multi-hotel.spec.ts`.

- [ ] Write failures for pan/zoom and room/person/problem focus; floor selection, cutaway,
  service highlighting; stable click/touch targets; navigation via doors, corridors,
  stairs, elevators, and closures; elevator capacity/time/queue/failure; real queues; all
  room/facility states; day/night; and zoom LOD.
- [ ] Keep visible agents as bounded materializations of authoritative aggregates.
  Animation/pathfinding consumes snapshots and never owns economic rules.
- [ ] Preserve keyboard and semantic-DOM paths for critical selection/action, with
  non-color-only state semantics.
- [ ] Run render, protocol, facilities, determinism, browser, typecheck, lint, and build.
- [ ] Commit as `feat: complete operational isometric world`.

### Completion-delta command matrix

The prose steps above use these exact focused gates before their stated commit. Each task
also runs `npm run typecheck`; tasks touching UI run `npm run lint` and the named E2E.

```bash
# Task 15
npm run test:run -- src/game/finance src/game/risk src/game/utilities src/game/persistence/migrations/v4-to-v5.test.ts
# Task 16
npm run test:run -- src/game/commercial src/game/reputation src/game/finance
# Task 17
npm run test:run -- src/game/staff src/game/purchasing src/game/management
# Task 18
npm run test:run -- src/game/guests src/game/bookings src/game/revenue src/game/reputation
# Task 19
npm run test:run -- src/game/facilities src/game/classification src/game/ownership
# Task 20
npm run test:run -- src/game/fnb src/game/wellness src/game/eventsales src/game/laundry src/game/engineering
# Task 21
npm run test:run -- src/render src/game/domain/protocol.test.ts src/game/simulation
npm run test:e2e -- e2e/multi-hotel.spec.ts
npm run typecheck
npm run lint
npm run build
```

For every task that changes persisted state, also run the v4-to-v5 fixture and a save/load
round trip. For every task that adds RNG draws, run the same-seed replay twice and compare
state plus event hashes. A broad directory command is supplementary to—not a replacement
for—the new failing test named in that task.

---
## Plan self-review

### Spec coverage
- Portfolio/legal entities -> Tasks 1 and 14.
- Ownership/lease/management/franchise -> Task 2.
- Brands and audits -> Task 3.
- Feasibility, pre-opening, ramp-up -> Tasks 4-6.
- Headquarters/shared services/budgets -> Tasks 7-8.
- Manager governance -> Task 9.
- Treasury/internal funding -> Task 10.
- Valuation/due diligence/acquisition -> Tasks 11-12.
- Late-game portfolio drill-down -> Task 13.
- Persistence and multi-hotel acceptance -> Task 14.
- Full accounting, insurance, compliance cost, and utilities -> Task 15.
- Sales, Marketing, CRM, Loyalty, and multidimensional reputation -> Task 16.
- Complete employee and supplier lifecycles -> Task 17.
- Complete guest journey and service-recovery authority -> Task 18.
- Remaining lobby/commercial/outdoor facility depth -> Task 19.
- F&B, wellness, events, laundry, and engineering edge contracts -> Task 20.
- MASTER 55 operational isometric-world contract -> Task 21.

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

**Next plan after this gate:** Plan 06 - Emergent Campaign & Narrative
