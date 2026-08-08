# Content & Authoring Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn all game content into validated, versioned data packs with stable IDs and provide internal authoring tools for cities, facilities, technologies, guests, events, recipes, suppliers, rivals, and brands.

**Architecture:** Introduce schema-first content packages validated with Zod at build and load time. Runtime simulation consumes normalized registries rather than raw JSON, while an internal React authoring app edits the same schemas and exports deterministic content packs.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm. Zod for runtime/schema validation.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-06 completed and green**.

MASTER-spec coverage: MASTER chapters 70-72 and implementation decomposition chapter 90.

## Scope contract

**In scope**
- versioned content-pack envelope and schema versions
- stable IDs and cross-reference validation
- explicit units and central defaults
- schemas for all major content families
- build-time content validation CLI
- content compatibility rules for saves
- browser-based internal content editor
- content pack import/export and schema snapshots
- expanded core content using the validated pipeline

**Explicitly outside this plan**
- gameplay changes unrelated to content representation
- final player-facing localization polish (Plan 08)
- long-run performance tuning (Plan 09)

## Locked file map

All paths are relative to `/mnt/data/hotel-manager`.

```text
src/content-schema/common.ts
src/content-schema/contentPack.ts
src/content-schema/city.ts
src/content-schema/facility.ts
src/content-schema/technology.ts
src/content-schema/guestSegment.ts
src/content-schema/event.ts
src/content-schema/recipe.ts
src/content-schema/supplier.ts
src/content-schema/rival.ts
src/content-schema/brand.ts
src/game/content/registry.ts
src/game/content/validateReferences.ts
src/game/persistence/contentCompatibility.ts
src/content/core/core-pack.json
scripts/validate-content.ts
scripts/content-migrate.ts
src/tools/content-editor/ContentEditorApp.tsx
src/tools/content-editor/ValidationSummary.tsx
src/tools/content-editor/editors/
docs/content-authoring/README.md
e2e/content-editor.spec.ts
```

---

### Task 1: Install Zod and define the versioned content-pack envelope

**Files:**
- Modify: `package.json`
- Create: `src/content-schema/contentPack.ts`
- Test: `src/content-schema/contentPack.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { ContentPackSchema } from './contentPack';

describe('ContentPackSchema', () => {
  it('requires stable pack id and positive schema version', () => {
    expect(ContentPackSchema.parse({packId:'core',schemaVersion:1,contentVersion:'1991.1',entries:{}}).packId).toBe('core');
    expect(() => ContentPackSchema.parse({packId:'',schemaVersion:0,contentVersion:'x',entries:{}})).toThrow();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm install zod && npm run test:run -- src/content-schema/contentPack.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/content-schema/contentPack.ts`:

```ts
import { z } from 'zod';
export const ContentPackSchema=z.object({
  packId:z.string().min(1).regex(/^[a-z0-9.-]+$/),
  schemaVersion:z.number().int().positive(),
  contentVersion:z.string().min(1),
  entries:z.record(z.string(),z.unknown()),
});
export type ContentPack=z.infer<typeof ContentPackSchema>;
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm install zod && npm run test:run -- src/content-schema/contentPack.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json src/content-schema/contentPack.test.ts src/content-schema/contentPack.ts
git commit -m "feat: add content pack schema"
```

---

### Task 2: Create stable content IDs and registry

**Files:**
- Create: `src/content-schema/common.ts`
- Create: `src/game/content/registry.ts`
- Test: `src/game/content/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { ContentRegistry } from './registry';

describe('ContentRegistry', () => {
  it('rejects duplicate stable ids', () => {
    const registry=new ContentRegistry();
    registry.add({id:'city.frankfurt.de',kind:'city'});
    expect(()=>registry.add({id:'city.frankfurt.de',kind:'city'})).toThrow(/duplicate/i);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/content/registry.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/content/registry.ts`:

```ts
export interface ContentRecord { id:string; kind:string; }
export class ContentRegistry {
  private readonly records=new Map<string,ContentRecord>();
  add(record:ContentRecord):void { if(this.records.has(record.id)) throw new Error(`duplicate content id: ${record.id}`); this.records.set(record.id,record); }
  get<T extends ContentRecord>(id:string):T { const value=this.records.get(id); if(!value) throw new Error(`unknown content id: ${id}`); return value as T; }
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/content/registry.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/common.ts src/game/content/registry.test.ts src/game/content/registry.ts
git commit -m "feat: add stable content registry"
```

---

### Task 3: Define units and central defaults

**Files:**
- Create: `src/content-schema/common.ts`
- Test: `src/content-schema/common.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { BasisPointsSchema, MinutesSchema } from './common';

describe('content units', () => {
  it('validates bounded basis points and non-negative minutes', () => {
    expect(BasisPointsSchema.parse(7500)).toBe(7500);
    expect(()=>BasisPointsSchema.parse(10001)).toThrow();
    expect(()=>MinutesSchema.parse(-1)).toThrow();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/content-schema/common.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/content-schema/common.ts`:

```ts
import { z } from 'zod';
export const StableIdSchema=z.string().regex(/^[a-z][a-z0-9.-]+$/);
export const BasisPointsSchema=z.number().int().min(0).max(10_000);
export const MinorCurrencySchema=z.number().int();
export const MinutesSchema=z.number().int().nonnegative();
export const SquareMetersSchema=z.number().positive();
export const CONTENT_DEFAULTS={ maintenanceCondition:10_000, availabilityBasisPoints:10_000 } as const;
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/content-schema/common.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/common.test.ts src/content-schema/common.ts
git commit -m "feat: define content units and defaults"
```

---

### Task 4: Add city, facility, and room-product schemas

**Files:**
- Create: `src/content-schema/city.ts`
- Create: `src/content-schema/facility.ts`
- Test: `src/content-schema/facility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { FacilitySchema } from './facility';

describe('FacilitySchema', () => {
  it('requires explicit area, capacity, and operating cost units', () => {
    const f=FacilitySchema.parse({id:'facility.breakfast_room',kind:'facility',areaSquareMeters:80,capacity:50,monthlyFixedCostMinor:200000});
    expect(f.capacity).toBe(50);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/content-schema/facility.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/content-schema/facility.ts`:

```ts
import { z } from 'zod';
import { MinorCurrencySchema, SquareMetersSchema, StableIdSchema } from './common';
export const FacilitySchema=z.object({
  id:StableIdSchema, kind:z.literal('facility'), areaSquareMeters:SquareMetersSchema,
  capacity:z.number().int().nonnegative(), monthlyFixedCostMinor:MinorCurrencySchema,
  requiredTechnologyIds:z.array(StableIdSchema).default([]),
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/content-schema/facility.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/city.ts src/content-schema/facility.test.ts src/content-schema/facility.ts
git commit -m "feat: add city and facility content schemas"
```

---

### Task 5: Add technology, guest-segment, and trend schemas

**Files:**
- Create: `src/content-schema/technology.ts`
- Create: `src/content-schema/guestSegment.ts`
- Test: `src/content-schema/technology.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { TechnologySchema } from './technology';

describe('TechnologySchema', () => {
  it('supports prerequisite ids and adoption thresholds without a fixed invention year', () => {
    const t=TechnologySchema.parse({id:'tech.wifi',kind:'technology',prerequisiteIds:['tech.internet'],emergenceThreshold:6500});
    expect(t.prerequisiteIds).toEqual(['tech.internet']);
    expect('fixedYear' in t).toBe(false);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/content-schema/technology.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/content-schema/technology.ts`:

```ts
import { z } from 'zod';
import { BasisPointsSchema, StableIdSchema } from './common';
export const TechnologySchema=z.object({
  id:StableIdSchema, kind:z.literal('technology'), prerequisiteIds:z.array(StableIdSchema).default([]),
  emergenceThreshold:BasisPointsSchema, competingStandardIds:z.array(StableIdSchema).default([]),
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/content-schema/technology.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/guestSegment.ts src/content-schema/technology.test.ts src/content-schema/technology.ts
git commit -m "feat: add technology and guest schemas"
```

---

### Task 6: Add event, recipe, supplier, rival, and brand schemas

**Files:**
- Create: `src/content-schema/event.ts`
- Create: `src/content-schema/recipe.ts`
- Create: `src/content-schema/supplier.ts`
- Create: `src/content-schema/rival.ts`
- Create: `src/content-schema/brand.ts`
- Test: `src/content-schema/recipe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { RecipeSchema } from './recipe';

describe('RecipeSchema', () => {
  it('requires ingredient quantities and preparation minutes', () => {
    const r=RecipeSchema.parse({id:'recipe.breakfast.basic',kind:'recipe',ingredients:[{itemId:'item.egg',quantity:2}],prepMinutes:6});
    expect(r.ingredients[0].quantity).toBe(2);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/content-schema/recipe.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/content-schema/recipe.ts`:

```ts
import { z } from 'zod';
import { MinutesSchema, StableIdSchema } from './common';
export const RecipeSchema=z.object({
  id:StableIdSchema, kind:z.literal('recipe'),
  ingredients:z.array(z.object({itemId:StableIdSchema,quantity:z.number().positive()})).min(1),
  prepMinutes:MinutesSchema,
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/content-schema/recipe.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/brand.ts src/content-schema/event.ts src/content-schema/recipe.test.ts src/content-schema/recipe.ts src/content-schema/rival.ts src/content-schema/supplier.ts
git commit -m "feat: add business content schemas"
```

---

### Task 7: Validate cross references and technology dependencies

**Files:**
- Create: `src/game/content/validateReferences.ts`
- Test: `src/game/content/validateReferences.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { validateReferences } from './validateReferences';

describe('content references', () => {
  it('reports a missing technology referenced by a facility', () => {
    expect(validateReferences([{id:'facility.smart',kind:'facility',requiredTechnologyIds:['tech.missing']}])).toEqual([
      {sourceId:'facility.smart',targetId:'tech.missing',field:'requiredTechnologyIds'},
    ]);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/content/validateReferences.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/content/validateReferences.ts`:

```ts
export interface ReferenceRecord { id:string; kind:string; requiredTechnologyIds?:string[]; prerequisiteIds?:string[]; }
export function validateReferences(records:ReferenceRecord[]) {
  const ids=new Set(records.map(r=>r.id)); const errors:Array<{sourceId:string;targetId:string;field:string}>=[];
  for(const r of records) for(const [field,targets] of [['requiredTechnologyIds',r.requiredTechnologyIds],['prerequisiteIds',r.prerequisiteIds]] as const)
    for(const target of targets??[]) if(!ids.has(target)) errors.push({sourceId:r.id,targetId:target,field});
  return errors;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/content/validateReferences.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/content/validateReferences.test.ts src/game/content/validateReferences.ts
git commit -m "feat: validate content references"
```

---

### Task 8: Add build-time content validation CLI

**Files:**
- Create: `scripts/validate-content.ts`
- Modify: `package.json`
- Create: `src/content/core/core-pack.json`
- Test: `src/game/content/corePack.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import corePack from '../../content/core/core-pack.json';
import { ContentPackSchema } from '../../content-schema/contentPack';

describe('core content pack', () => {
  it('parses through the canonical content pack schema', () => {
    expect(ContentPackSchema.parse(corePack).packId).toBe('core');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run content:validate && npm run test:run -- src/game/content/corePack.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`scripts/validate-content.ts`:

```ts
import corePack from '../src/content/core/core-pack.json' with { type:'json' };
import { ContentPackSchema } from '../src/content-schema/contentPack';
const parsed=ContentPackSchema.safeParse(corePack);
if(!parsed.success){ console.error(parsed.error.format()); process.exit(1); }
console.log(`content-ok ${parsed.data.packId}@${parsed.data.contentVersion}`);
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run content:validate && npm run test:run -- src/game/content/corePack.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/validate-content.ts src/content/core/core-pack.json src/game/content/corePack.test.ts
git commit -m "build: validate content packs"
```

---

### Task 9: Define save/content compatibility policy and migration hook

**Files:**
- Create: `src/game/persistence/contentCompatibility.ts`
- Create: `scripts/content-migrate.ts`
- Test: `src/game/persistence/contentCompatibility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { compatibility } from './contentCompatibility';

describe('content compatibility', () => {
  it('requires migration when a save references a different schema version', () => {
    expect(compatibility({saveSchemaVersion:2,currentSchemaVersion:3,saveContentVersion:'1',currentContentVersion:'2'})).toBe('migrate-schema');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/contentCompatibility.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/contentCompatibility.ts`:

```ts
export type ContentCompatibility='compatible'|'migrate-schema'|'rebalance-only';
export function compatibility(v:{saveSchemaVersion:number;currentSchemaVersion:number;saveContentVersion:string;currentContentVersion:string}):ContentCompatibility {
  if(v.saveSchemaVersion!==v.currentSchemaVersion) return 'migrate-schema';
  if(v.saveContentVersion!==v.currentContentVersion) return 'rebalance-only';
  return 'compatible';
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/contentCompatibility.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add scripts/content-migrate.ts src/game/persistence/contentCompatibility.test.ts src/game/persistence/contentCompatibility.ts
git commit -m "feat: add content compatibility policy"
```

---

### Task 10: Build content-editor shell and validation summary

**Files:**
- Create: `src/tools/content-editor/ContentEditorApp.tsx`
- Create: `src/tools/content-editor/ValidationSummary.tsx`
- Test: `src/tools/content-editor/ValidationSummary.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValidationSummary } from './ValidationSummary';

describe('ValidationSummary', () => {
  it('shows blocking reference errors with source and target ids', () => {
    render(<ValidationSummary errors={[{sourceId:'facility.smart',targetId:'tech.none',field:'requiredTechnologyIds'}]} />);
    expect(screen.getByText(/facility.smart/)).toBeTruthy();
    expect(screen.getByText(/tech.none/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/tools/content-editor/ValidationSummary.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/tools/content-editor/ValidationSummary.tsx`:

```ts
export function ValidationSummary(props:{errors:Array<{sourceId:string;targetId:string;field:string}>}) {
  return <section aria-label="Content validation"><h2>Validation</h2>{props.errors.map((e,i)=><p key={i}>{e.sourceId} -> {e.targetId} ({e.field})</p>)}</section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/tools/content-editor/ValidationSummary.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/content-editor/ContentEditorApp.tsx src/tools/content-editor/ValidationSummary.test.tsx src/tools/content-editor/ValidationSummary.tsx
git commit -m "feat: add content editor shell"
```

---

### Task 11: Add city, facility, and technology editors

**Files:**
- Create: `src/tools/content-editor/editors/CityEditor.tsx`
- Create: `src/tools/content-editor/editors/FacilityEditor.tsx`
- Create: `src/tools/content-editor/editors/TechnologyEditor.tsx`
- Test: `src/tools/content-editor/editors/TechnologyEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TechnologyEditor } from './TechnologyEditor';

describe('TechnologyEditor', () => {
  it('edits emergence threshold as basis points', () => {
    const onChange=vi.fn(); render(<TechnologyEditor value={{id:'tech.wifi',emergenceThreshold:5000}} onChange={onChange}/>);
    fireEvent.change(screen.getByLabelText('Emergence threshold'),{target:{value:'6500'}});
    expect(onChange).toHaveBeenCalledWith({id:'tech.wifi',emergenceThreshold:6500});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/tools/content-editor/editors/TechnologyEditor.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/tools/content-editor/editors/TechnologyEditor.tsx`:

```ts
export function TechnologyEditor(props:{value:{id:string;emergenceThreshold:number};onChange:(v:{id:string;emergenceThreshold:number})=>void}) {
  return <label>Emergence threshold<input aria-label="Emergence threshold" type="number" value={props.value.emergenceThreshold} onChange={e=>props.onChange({...props.value,emergenceThreshold:Number(e.target.value)})}/></label>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/tools/content-editor/editors/TechnologyEditor.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/content-editor/editors/CityEditor.tsx src/tools/content-editor/editors/FacilityEditor.tsx src/tools/content-editor/editors/TechnologyEditor.test.tsx src/tools/content-editor/editors/TechnologyEditor.tsx
git commit -m "feat: add core content editors"
```

---

### Task 12: Add guest, event, recipe, supplier, rival, and brand editors

**Files:**
- Create: `src/tools/content-editor/editors/GuestSegmentEditor.tsx`
- Create: `src/tools/content-editor/editors/EventEditor.tsx`
- Create: `src/tools/content-editor/editors/RecipeEditor.tsx`
- Create: `src/tools/content-editor/editors/SupplierEditor.tsx`
- Create: `src/tools/content-editor/editors/RivalEditor.tsx`
- Create: `src/tools/content-editor/editors/BrandEditor.tsx`
- Test: `src/tools/content-editor/editors/RecipeEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecipeEditor } from './RecipeEditor';

describe('RecipeEditor', () => {
  it('shows ingredient ids and quantities explicitly', () => {
    render(<RecipeEditor value={{id:'recipe.breakfast.basic',ingredients:[{itemId:'item.egg',quantity:2}]}} />);
    expect(screen.getByDisplayValue('item.egg')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/tools/content-editor/editors/RecipeEditor.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/tools/content-editor/editors/RecipeEditor.tsx`:

```ts
export function RecipeEditor(props:{value:{id:string;ingredients:Array<{itemId:string;quantity:number}>}}) {
  return <section aria-label="Recipe editor">{props.value.ingredients.map((x,i)=><div key={i}><input aria-label={`Ingredient ${i+1}`} value={x.itemId} readOnly/><input aria-label={`Quantity ${i+1}`} value={x.quantity} readOnly/></div>)}</section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/tools/content-editor/editors/RecipeEditor.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/content-editor/editors/BrandEditor.tsx src/tools/content-editor/editors/EventEditor.tsx src/tools/content-editor/editors/GuestSegmentEditor.tsx src/tools/content-editor/editors/RecipeEditor.test.tsx src/tools/content-editor/editors/RecipeEditor.tsx src/tools/content-editor/editors/RivalEditor.tsx src/tools/content-editor/editors/SupplierEditor.tsx
git commit -m "feat: add business content editors"
```

---

### Task 13: Add content-pack import/export and schema snapshots

**Files:**
- Create: `src/tools/content-editor/contentFileIO.ts`
- Create: `src/content-schema/__snapshots__/schemaVersion1.json`
- Test: `src/tools/content-editor/contentFileIO.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { exportContentPack, importContentPack } from './contentFileIO';

describe('content file IO', () => {
  it('round trips a validated pack without changing ids', () => {
    const pack={packId:'test',schemaVersion:1,contentVersion:'1',entries:{}};
    expect(importContentPack(exportContentPack(pack))).toEqual(pack);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/tools/content-editor/contentFileIO.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/tools/content-editor/contentFileIO.ts`:

```ts
import { ContentPackSchema, type ContentPack } from '../../content-schema/contentPack';
export function exportContentPack(pack:ContentPack):string { return JSON.stringify(ContentPackSchema.parse(pack),null,2); }
export function importContentPack(text:string):ContentPack { return ContentPackSchema.parse(JSON.parse(text)); }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/tools/content-editor/contentFileIO.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/content-schema/__snapshots__/schemaVersion1.json src/tools/content-editor/contentFileIO.test.ts src/tools/content-editor/contentFileIO.ts
git commit -m "feat: add content pack import export"
```

---

### Task 14: Expand validated core pack and authoring documentation

**Files:**
- Modify: `src/content/core/core-pack.json`
- Create: `docs/content-authoring/README.md`
- Create: `e2e/content-editor.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('content editor rejects an invalid cross reference', async ({ page }) => {
  await page.goto('/tools/content-editor');
  await page.getByRole('button',{name:'Add facility'}).click();
  await page.getByLabel('Required technology').fill('tech.missing');
  await expect(page.getByText(/tech.missing/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Export pack'})).toBeDisabled();
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run content:validate && npm run test:e2e -- e2e/content-editor.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`docs/content-authoring/README.md`:

```ts
# Content authoring

1. Edit content only through schema-valid fields or reviewed JSON changes.
2. Every object uses a stable dotted ID.
3. Run `npm run content:validate` before commit.
4. Cross-reference errors are release-blocking.
5. Increment `contentVersion` for balance/content changes and `schemaVersion` for structural changes.
6. Never reuse a removed stable ID for a different semantic object.
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run content:validate && npm run test:e2e -- e2e/content-editor.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add docs/content-authoring/README.md e2e/content-editor.spec.ts src/content/core/core-pack.json
git commit -m "docs: finish content authoring pipeline"
```

---

## Plan self-review

### Spec coverage
- Content pack versioning -> Task 1.
- Stable IDs and registry -> Task 2.
- Units/defaults -> Task 3.
- Major schemas -> Tasks 4-6.
- Cross references and build validation -> Tasks 7-8.
- Save/content compatibility -> Task 9.
- Authoring UI -> Tasks 10-12.
- Import/export and schema snapshots -> Task 13.
- Validated core content and documentation -> Task 14.

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
```

Expected: every command exits 0. Do not start the next plan while any gate fails.

**Next plan after this gate:** Plan 08 - Accessibility, Localization & Audio
