# Emergent Campaign & Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a simulation-driven career narrative with milestones, named rivals, key staff careers, changing media reach, prestige, strategic opportunities, and a durable company/world chronicle.

**Architecture:** Narrative systems observe domain events and world state; they do not bypass economic rules. Narrative definitions are deterministic conditions plus choices, while consequences are expressed as ordinary commands, reputation changes, contracts, costs, demand modifiers, or relationship changes.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-05 completed and green**.

MASTER-spec coverage: MASTER chapters 33.9-33.11 and 45-50; implementation decomposition chapter 89.

## Scope contract

**In scope**
- condition-driven narrative events and deterministic event selection
- career milestone detection without a linear mission chain
- named rivals with personality, strategy, and relationship memory
- long-lived key staff careers
- media evolution from local print to later digital amplification
- personal/company prestige and access effects
- company and world chronicle
- long-tail strategic opportunities with delayed consequences
- choice framing without a global good/evil meter

**Explicitly outside this plan**
- new macroeconomic engines (Plan 04)
- new ownership mechanics (Plan 05)
- mass content editing and authoring workflow (Plan 07)

## Locked file map

All paths are relative to `/mnt/data/hotel-manager`.

```text
src/game/narrative/eventTypes.ts
src/game/narrative/eventEngine.ts
src/game/narrative/outcomes.ts
src/game/milestones/milestoneEngine.ts
src/game/rivals/rivalState.ts
src/game/rivals/relationships.ts
src/game/people/careerProgression.ts
src/game/media/mediaLandscape.ts
src/game/prestige/prestige.ts
src/game/chronicle/chronicle.ts
src/game/narrative/strategicOpportunities.ts
src/ui/story/StoryInbox.tsx
src/ui/story/ChronicleView.tsx
src/ui/story/MilestoneToast.tsx
src/game/persistence/migrations/v5-to-v6.ts
e2e/campaign.spec.ts
```

---

### Task 1: Define condition-driven narrative events

**Files:**
- Create: `src/game/narrative/eventTypes.ts`
- Create: `src/game/narrative/eventEngine.ts`
- Test: `src/game/narrative/eventEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { eligibleEvents } from './eventEngine';

describe('narrative event eligibility', () => {
  it('requires all declared conditions before an event can fire', () => {
    const defs = [{ id:'overbooking-scandal', conditions:[{ key:'displacedGuests', min:3 }, { key:'mediaReach', min:20 }] }];
    expect(eligibleEvents(defs, { displacedGuests:4, mediaReach:10 })).toEqual([]);
    expect(eligibleEvents(defs, { displacedGuests:4, mediaReach:30 }).map(e => e.id)).toEqual(['overbooking-scandal']);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/narrative/eventEngine.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/narrative/eventEngine.ts`:

```ts
export interface NarrativeCondition { key: string; min: number; }
export interface NarrativeDefinition { id: string; conditions: NarrativeCondition[]; }
export function eligibleEvents(defs: NarrativeDefinition[], facts: Record<string,number>): NarrativeDefinition[] {
  return defs.filter(def => def.conditions.every(c => (facts[c.key] ?? 0) >= c.min));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/narrative/eventEngine.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/narrative/eventEngine.test.ts src/game/narrative/eventEngine.ts src/game/narrative/eventTypes.ts
git commit -m "feat: add narrative event eligibility"
```

---

### Task 2: Route narrative outcomes through domain systems

**Files:**
- Create: `src/game/narrative/outcomes.ts`
- Test: `src/game/narrative/outcomes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { commandsForNarrativeChoice } from './outcomes';

describe('narrative outcomes', () => {
  it('translates compensation into normal finance and reputation commands', () => {
    expect(commandsForNarrativeChoice({ kind:'compensate-displaced-guests', costMinor:200_000, reputationDelta:5 })).toEqual([
      { type:'POST_EXPENSE', amountMinor:200_000, category:'guest-recovery' },
      { type:'ADJUST_REPUTATION', dimension:'hotel', delta:5 },
    ]);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/narrative/outcomes.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/narrative/outcomes.ts`:

```ts
export type NarrativeChoice = { kind:'compensate-displaced-guests'; costMinor:number; reputationDelta:number };
export function commandsForNarrativeChoice(choice: NarrativeChoice) {
  return [
    { type:'POST_EXPENSE' as const, amountMinor:choice.costMinor, category:'guest-recovery' },
    { type:'ADJUST_REPUTATION' as const, dimension:'hotel', delta:choice.reputationDelta },
  ];
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/narrative/outcomes.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/narrative/outcomes.test.ts src/game/narrative/outcomes.ts
git commit -m "feat: route story outcomes through domain rules"
```

---

### Task 3: Add career milestones

**Files:**
- Create: `src/game/milestones/milestoneEngine.ts`
- Test: `src/game/milestones/milestoneEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { detectMilestones } from './milestoneEngine';

describe('milestones', () => {
  it('detects first profitable year exactly once', () => {
    expect(detectMilestones({ annualProfitMinor:1, achieved:[] })).toEqual(['first-profitable-year']);
    expect(detectMilestones({ annualProfitMinor:1, achieved:['first-profitable-year'] })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/milestones/milestoneEngine.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/milestones/milestoneEngine.ts`:

```ts
export function detectMilestones(input: { annualProfitMinor:number; achieved:string[] }): string[] {
  const found:string[]=[];
  if (input.annualProfitMinor > 0 && !input.achieved.includes('first-profitable-year')) found.push('first-profitable-year');
  return found;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/milestones/milestoneEngine.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/milestones/milestoneEngine.test.ts src/game/milestones/milestoneEngine.ts
git commit -m "feat: add career milestones"
```

---

### Task 4: Create named rival state and relationship memory

**Files:**
- Create: `src/game/rivals/rivalState.ts`
- Create: `src/game/rivals/relationships.ts`
- Test: `src/game/rivals/relationships.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { applyRivalInteraction } from './relationships';

describe('rival memory', () => {
  it('remembers hostile land competition without scripting immunity', () => {
    const next = applyRivalInteraction({ trust:0, rivalry:0, memories:[] }, { kind:'outbid-property', year:1997 });
    expect(next.rivalry).toBeGreaterThan(0);
    expect(next.memories[0]).toEqual({ kind:'outbid-property', year:1997 });
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/rivals/relationships.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/rivals/relationships.ts`:

```ts
export interface RivalRelationship { trust:number; rivalry:number; memories:Array<{kind:string; year:number}>; }
export function applyRivalInteraction(state:RivalRelationship, event:{kind:string; year:number}):RivalRelationship {
  const hostile = event.kind === 'outbid-property' || event.kind === 'poach-staff' || event.kind === 'price-war';
  return { ...state, rivalry:state.rivalry+(hostile?10:0), trust:state.trust-(hostile?5:0), memories:[...state.memories,event] };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/rivals/relationships.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/rivals/relationships.test.ts src/game/rivals/relationships.ts src/game/rivals/rivalState.ts
git commit -m "feat: add rival relationship memory"
```

---

### Task 5: Add long-lived key staff career progression

**Files:**
- Create: `src/game/people/careerProgression.ts`
- Test: `src/game/people/careerProgression.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { eligiblePromotions } from './careerProgression';

describe('key staff careers', () => {
  it('allows an experienced receptionist to become front office manager', () => {
    expect(eligiblePromotions({ role:'receptionist', experience:80, leadership:65 })).toContain('front-office-manager');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/people/careerProgression.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/people/careerProgression.ts`:

```ts
export function eligiblePromotions(person:{role:string; experience:number; leadership:number}):string[] {
  const out:string[]=[];
  if (person.role==='receptionist' && person.experience>=70 && person.leadership>=60) out.push('front-office-manager');
  if (person.role==='front-office-manager' && person.experience>=85 && person.leadership>=75) out.push('hotel-director');
  return out;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/people/careerProgression.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/people/careerProgression.test.ts src/game/people/careerProgression.ts
git commit -m "feat: add key staff career paths"
```

---

### Task 6: Model media-era reach and amplification

**Files:**
- Create: `src/game/media/mediaLandscape.ts`
- Test: `src/game/media/mediaLandscape.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { incidentReach } from './mediaLandscape';

describe('media reach', () => {
  it('amplifies the same incident when digital media adoption is high', () => {
    expect(incidentReach({ localPress:6000, reviewSites:0, socialMedia:0 }, 20)).toBeLessThan(
      incidentReach({ localPress:6000, reviewSites:8000, socialMedia:8000 }, 20),
    );
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/media/mediaLandscape.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/media/mediaLandscape.ts`:

```ts
export interface MediaLandscape { localPress:number; reviewSites:number; socialMedia:number; }
export function incidentReach(media:MediaLandscape, severity:number):number {
  const multiplier = media.localPress + Math.trunc(media.reviewSites*1.5) + Math.trunc(media.socialMedia*2);
  return Math.trunc(severity * multiplier / 10_000);
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/media/mediaLandscape.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/media/mediaLandscape.test.ts src/game/media/mediaLandscape.ts
git commit -m "feat: add evolving media reach"
```

---

### Task 7: Add prestige as access modifier rather than victory score

**Files:**
- Create: `src/game/prestige/prestige.ts`
- Test: `src/game/prestige/prestige.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { financingAccessBonusBasisPoints } from './prestige';

describe('prestige', () => {
  it('improves access but cannot create cash or profit by itself', () => {
    expect(financingAccessBonusBasisPoints(80)).toBeGreaterThan(0);
    expect(financingAccessBonusBasisPoints(100)).toBeLessThanOrEqual(1000);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/prestige/prestige.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/prestige/prestige.ts`:

```ts
export function financingAccessBonusBasisPoints(prestige:number):number {
  const clamped=Math.max(0,Math.min(100,prestige));
  return Math.trunc(clamped*10);
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/prestige/prestige.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/prestige/prestige.test.ts src/game/prestige/prestige.ts
git commit -m "feat: add prestige access effects"
```

---

### Task 8: Record company and world chronicle entries

**Files:**
- Create: `src/game/chronicle/chronicle.ts`
- Test: `src/game/chronicle/chronicle.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { appendChronicleEntry } from './chronicle';

describe('chronicle', () => {
  it('stores stable dated history entries in order', () => {
    const next = appendChronicleEntry([], { id:'evt-1', date:'1997-04-05', scope:'company', textKey:'chronicle.secondHotel' });
    expect(next).toEqual([{ id:'evt-1', date:'1997-04-05', scope:'company', textKey:'chronicle.secondHotel' }]);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/chronicle/chronicle.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/chronicle/chronicle.ts`:

```ts
export interface ChronicleEntry { id:string; date:string; scope:'company'|'world'; textKey:string; }
export function appendChronicleEntry(entries:ChronicleEntry[], entry:ChronicleEntry):ChronicleEntry[] {
  if (entries.some(e=>e.id===entry.id)) return entries;
  return [...entries,entry].sort((a,b)=>a.date.localeCompare(b.date));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/chronicle/chronicle.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/chronicle/chronicle.test.ts src/game/chronicle/chronicle.ts
git commit -m "feat: add company world chronicle"
```

---

### Task 9: Create delayed strategic opportunities

**Files:**
- Create: `src/game/narrative/strategicOpportunities.ts`
- Test: `src/game/narrative/strategicOpportunities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { resolveInvestmentOutcome } from './strategicOpportunities';

describe('long tail opportunity', () => {
  it('resolves from stored investment and simulated company outcome, not a fixed right answer', () => {
    expect(resolveInvestmentOutcome({ investedMinor:2_000_000, companyValueMultiplierBasisPoints:0 })).toBe(-2_000_000);
    expect(resolveInvestmentOutcome({ investedMinor:2_000_000, companyValueMultiplierBasisPoints:30_000 })).toBe(4_000_000);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/narrative/strategicOpportunities.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/narrative/strategicOpportunities.ts`:

```ts
export function resolveInvestmentOutcome(input:{investedMinor:number; companyValueMultiplierBasisPoints:number}):number {
  const value=Math.trunc(input.investedMinor*input.companyValueMultiplierBasisPoints/10_000);
  return value-input.investedMinor;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/narrative/strategicOpportunities.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/narrative/strategicOpportunities.test.ts src/game/narrative/strategicOpportunities.ts
git commit -m "feat: add delayed strategic opportunities"
```

---

### Task 10: Enforce strategic choices without a morality meter

**Files:**
- Create: `src/game/narrative/choiceConsequences.ts`
- Test: `src/game/narrative/choiceConsequences.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { consequencesForClosure } from './choiceConsequences';

describe('strategic choice framing', () => {
  it('returns economic and stakeholder consequences without good or evil points', () => {
    const result = consequencesForClosure({ employees:40, monthlyLossMinor:8_000_000 });
    expect(result).toEqual({ monthlyCashImprovementMinor:8_000_000, jobsLost:40, localReputationDelta:-12 });
    expect('morality' in result).toBe(false);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/narrative/choiceConsequences.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/narrative/choiceConsequences.ts`:

```ts
export function consequencesForClosure(input:{employees:number; monthlyLossMinor:number}) {
  return { monthlyCashImprovementMinor:Math.max(0,input.monthlyLossMinor), jobsLost:input.employees, localReputationDelta:-12 };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/narrative/choiceConsequences.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/narrative/choiceConsequences.test.ts src/game/narrative/choiceConsequences.ts
git commit -m "feat: model neutral strategic tradeoffs"
```

---

### Task 11: Build story inbox, milestone, and chronicle UI

**Files:**
- Create: `src/ui/story/StoryInbox.tsx`
- Create: `src/ui/story/ChronicleView.tsx`
- Create: `src/ui/story/MilestoneToast.tsx`
- Test: `src/ui/story/ChronicleView.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChronicleView } from './ChronicleView';

describe('ChronicleView', () => {
  it('renders dated company history in chronological order', () => {
    render(<ChronicleView entries={[{id:'1',date:'1994-12-31',text:'First profitable year'}]} />);
    expect(screen.getByText('1994-12-31')).toBeTruthy();
    expect(screen.getByText('First profitable year')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/story/ChronicleView.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/story/ChronicleView.tsx`:

```ts
export function ChronicleView(props:{entries:Array<{id:string;date:string;text:string}>}) {
  return <section aria-label="Company chronicle">{props.entries.map(e=><article key={e.id}><time>{e.date}</time><p>{e.text}</p></article>)}</section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/story/ChronicleView.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/story/ChronicleView.test.tsx src/ui/story/ChronicleView.tsx src/ui/story/MilestoneToast.tsx src/ui/story/StoryInbox.tsx
git commit -m "feat: add narrative ui"
```

---

### Task 12: Migrate narrative state and prove deterministic campaign replay

**Files:**
- Create: `src/game/persistence/migrations/v5-to-v6.ts`
- Test: `src/game/persistence/migrations/v5-to-v6.test.ts`
- Create: `e2e/campaign.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { migrateV5ToV6 } from './v5-to-v6';

describe('v5 to v6 migration', () => {
  it('adds empty narrative collections without changing hotel state', () => {
    const old={saveVersion:5,hotels:{h1:{cashMinor:5}}};
    const next=migrateV5ToV6(old);
    expect(next.saveVersion).toBe(6);
    expect(next.hotels).toEqual(old.hotels);
    expect(next.narrative).toEqual({chronicle:[],activeEvents:[],achievedMilestones:[]});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/migrations/v5-to-v6.test.ts && npm run test:e2e -- e2e/campaign.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v5-to-v6.ts`:

```ts
export function migrateV5ToV6<T extends {saveVersion:5}>(oldSave:T) {
  return {...oldSave,saveVersion:6 as const,narrative:{chronicle:[],activeEvents:[],achievedMilestones:[]}};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/migrations/v5-to-v6.test.ts && npm run test:e2e -- e2e/campaign.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/campaign.spec.ts src/game/persistence/migrations/v5-to-v6.test.ts src/game/persistence/migrations/v5-to-v6.ts
git commit -m "test: cover emergent campaign"
```

---

## Plan self-review

### Spec coverage
- Condition-driven narrative events and normal economic outcomes -> Tasks 1-2.
- Career milestones -> Task 3.
- Rivals and remembered relationships -> Task 4.
- Key staff careers -> Task 5.
- Media evolution -> Task 6.
- Prestige -> Task 7.
- World/company chronicle -> Task 8.
- Delayed opportunities -> Task 9.
- No good/evil meter -> Task 10.
- Narrative UI -> Task 11.
- Persistence and deterministic campaign acceptance -> Task 12.

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

**Next plan after this gate:** Plan 07 - Content & Authoring Pipeline
