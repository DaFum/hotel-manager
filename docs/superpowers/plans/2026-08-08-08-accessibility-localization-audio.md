# Accessibility, Localization & Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the game usable across keyboard, motion/contrast/text preferences and locales, add guided onboarding and notification controls, and build an accessible audio/ambience system without coupling presentation to simulation state.

**Architecture:** Player-facing strings and formatting move behind locale services; accessibility settings alter presentation only and never game rules. Pixi remains visual while an equivalent semantic DOM view exposes interactive hotel state, and audio consumes domain/UI events through dedicated buses with text or visual alternatives for meaningful cues.

**Tech Stack:** Existing React + TypeScript + Vite app; deterministic TypeScript Worker simulation; PixiJS 8; IndexedDB; Vitest; React Testing Library; Playwright; npm. i18next, react-i18next, @axe-core/playwright, Web Audio API.

---

## Source of truth

Canonical design: `docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

This plan depends on: **Plans 01-07 completed and green**.

MASTER-spec coverage: MASTER chapters 51-58 and 78; implementation decomposition chapter 90. Cross-plan ownership is recorded in `2026-08-09-MASTER-spec-coverage-audit.md`.

## Implementation fidelity rule

Code fragments in this plan demonstrate the first red/green increment only. They are not
the completion definition. A task is complete only when its full scope and MASTER
completion contract are implemented, integrated into commands/events/snapshots and
persistence where applicable, and all focused plus final gates pass. Do not commit the
illustrative minimum as the finished task.

## Scope contract

**In scope**
- German and English localization infrastructure with locale-safe number/date/currency formatting
- keyboard navigation and focus management across management UI
- semantic DOM alternative for the isometric hotel scene
- text scaling, high contrast, reduced motion, and non-color-only state cues
- guided onboarding and contextual help
- notification filters, severity preferences, and auto-pause rules
- audio buses, dynamic ambience, semantic cues, and persistent volume settings
- automated accessibility and localization E2E checks

**Explicitly outside this plan**
- new gameplay simulation rules
- new languages beyond de/en content seed
- voice acting or streamed licensed music
- platform-specific native accessibility APIs outside browser standards

## Locked file map

All paths are relative to the repository root.

```text
src/i18n/index.ts
src/i18n/resources/de.ts
src/i18n/resources/en.ts
src/i18n/formatters.ts
src/game/settings/playerPreferences.ts
src/ui/accessibility/FocusManager.tsx
src/ui/accessibility/SemanticHotelTree.tsx
src/ui/accessibility/AccessibilityPreferences.tsx
src/ui/onboarding/tutorialState.ts
src/ui/onboarding/TutorialCoach.tsx
src/ui/help/ContextHelp.tsx
src/ui/notifications/notificationPreferences.ts
src/ui/notifications/NotificationCenter.tsx
src/audio/audioEngine.ts
src/audio/ambience.ts
src/audio/cues.ts
src/ui/settings/AudioSettings.tsx
src/game/persistence/migrations/v6-to-v7.ts
e2e/accessibility.spec.ts
e2e/localization.spec.ts
```

---

### Task 1: Install and initialize localization infrastructure

**Files:**
- Modify: `package.json`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/resources/de.ts`
- Create: `src/i18n/resources/en.ts`
- Test: `src/i18n/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createGameI18n } from './index';

describe('i18n', () => {
  it('renders the same semantic key in German and English', async () => {
    const i18n=createGameI18n('de');
    expect(i18n.t('topbar.cash')).toBe('Bargeld');
    await i18n.changeLanguage('en');
    expect(i18n.t('topbar.cash')).toBe('Cash');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm install i18next react-i18next && npm run test:run -- src/i18n/index.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/i18n/index.ts`:

```ts
import i18next from 'i18next';
import { de } from './resources/de';
import { en } from './resources/en';
export function createGameI18n(language:'de'|'en') {
  const instance=i18next.createInstance();
  void instance.init({lng:language,fallbackLng:'en',resources:{de:{translation:de},en:{translation:en}},interpolation:{escapeValue:false}});
  return instance;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm install i18next react-i18next && npm run test:run -- src/i18n/index.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add package.json src/i18n/index.test.ts src/i18n/index.ts src/i18n/resources/de.ts src/i18n/resources/en.ts
git commit -m "feat: add localization infrastructure"
```

---

### Task 2: Add locale-safe date, number, percent, and currency formatting

**Files:**
- Create: `src/i18n/formatters.ts`
- Test: `src/i18n/formatters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { formatMinorCurrency, formatPercentBasisPoints } from './formatters';

describe('locale formatters', () => {
  it('formats DEM minor units without changing stored integer value', () => {
    expect(formatMinorCurrency(12_345,'DEM','de-DE')).toContain('123');
    expect(formatPercentBasisPoints(7850,'de-DE')).toContain('78');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/i18n/formatters.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/i18n/formatters.ts`:

```ts
export function formatMinorCurrency(minor:number,currency:string,locale:string):string {
  const digits=currency==='JPY'?0:2;
  return new Intl.NumberFormat(locale,{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}).format(minor/10**digits);
}
export function formatPercentBasisPoints(bp:number,locale:string):string {
  return new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(bp/10_000);
}
export function formatGameDate(iso:string,locale:string):string {
  return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`));
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/i18n/formatters.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/formatters.test.ts src/i18n/formatters.ts
git commit -m "feat: add locale aware formatters"
```

---

### Task 3: Add keyboard navigation and focus management

**Files:**
- Create: `src/ui/accessibility/FocusManager.tsx`
- Test: `src/ui/accessibility/FocusManager.test.tsx`
- Modify: `src/ui/ManagementShell.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FocusManager } from './FocusManager';

describe('FocusManager', () => {
  it('moves focus through registered tabs with arrow keys', () => {
    render(<FocusManager labels={['Hotel','Staff','Finance']} />);
    const hotel=screen.getByRole('tab',{name:'Hotel'}); hotel.focus(); fireEvent.keyDown(hotel,{key:'ArrowRight'});
    expect(screen.getByRole('tab',{name:'Staff'})).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/accessibility/FocusManager.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/accessibility/FocusManager.tsx`:

```ts
import { useRef } from 'react';
export function FocusManager({labels}:{labels:string[]}) {
  const refs=useRef<Array<HTMLButtonElement|null>>([]);
  return <div role="tablist">{labels.map((label,index)=><button key={label} role="tab" ref={el=>{refs.current[index]=el}} onKeyDown={e=>{
    if(e.key==='ArrowRight') refs.current[(index+1)%labels.length]?.focus();
    if(e.key==='ArrowLeft') refs.current[(index-1+labels.length)%labels.length]?.focus();
  }}>{label}</button>)}</div>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/accessibility/FocusManager.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/ManagementShell.tsx src/ui/accessibility/FocusManager.test.tsx src/ui/accessibility/FocusManager.tsx
git commit -m "feat: add keyboard focus management"
```

---

### Task 4: Expose an accessible semantic hotel tree alongside Pixi

**Files:**
- Create: `src/ui/accessibility/SemanticHotelTree.tsx`
- Test: `src/ui/accessibility/SemanticHotelTree.test.tsx`
- Modify: `src/ui/HotelView.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SemanticHotelTree } from './SemanticHotelTree';

describe('SemanticHotelTree', () => {
  it('exposes room state and an inspect action without relying on canvas pixels', () => {
    render(<SemanticHotelTree rooms={[{id:'101',label:'Room 101',state:'VacantDirty'}]} onInspect={()=>{}}/>);
    expect(screen.getByText(/vacant dirty/i)).toBeTruthy();
    expect(screen.getByRole('button',{name:/inspect room 101/i})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/accessibility/SemanticHotelTree.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/accessibility/SemanticHotelTree.tsx`:

```ts
export function SemanticHotelTree(props:{rooms:Array<{id:string;label:string;state:string}>;onInspect:(id:string)=>void}) {
  return <section aria-label="Hotel status"><ul>{props.rooms.map(room=><li key={room.id}><span>{room.label}: {room.state.replace(/([A-Z])/g,' $1').trim()}</span><button onClick={()=>props.onInspect(room.id)} aria-label={`Inspect ${room.label}`}>Inspect</button></li>)}</ul></section>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/accessibility/SemanticHotelTree.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/HotelView.tsx src/ui/accessibility/SemanticHotelTree.test.tsx src/ui/accessibility/SemanticHotelTree.tsx
git commit -m "feat: add semantic hotel alternative"
```

---

### Task 5: Persist text scale, contrast, and reduced-motion preferences

**Files:**
- Create: `src/game/settings/playerPreferences.ts`
- Create: `src/ui/accessibility/AccessibilityPreferences.tsx`
- Test: `src/game/settings/playerPreferences.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeAccessibilityPreferences } from './playerPreferences';

describe('accessibility preferences', () => {
  it('clamps text scale and keeps explicit reduced motion', () => {
    expect(normalizeAccessibilityPreferences({textScale:3,highContrast:true,reducedMotion:true})).toEqual({textScale:1.5,highContrast:true,reducedMotion:true});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/settings/playerPreferences.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/settings/playerPreferences.ts`:

```ts
export interface AccessibilityPreferences { textScale:number; highContrast:boolean; reducedMotion:boolean; }
export function normalizeAccessibilityPreferences(input:AccessibilityPreferences):AccessibilityPreferences {
  return {...input,textScale:Math.max(0.85,Math.min(1.5,input.textScale))};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/settings/playerPreferences.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/settings/playerPreferences.test.ts src/game/settings/playerPreferences.ts src/ui/accessibility/AccessibilityPreferences.tsx
git commit -m "feat: add accessibility preferences"
```

---

### Task 6: Add guided onboarding state and coach

**Files:**
- Create: `src/ui/onboarding/tutorialState.ts`
- Create: `src/ui/onboarding/TutorialCoach.tsx`
- Test: `src/ui/onboarding/tutorialState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { completeTutorialStep } from './tutorialState';

describe('tutorial state', () => {
  it('advances only when the expected gameplay action is observed', () => {
    const state={step:'set-room-price' as const,completed:[] as string[]};
    expect(completeTutorialStep(state,'HIRE_EMPLOYEE').step).toBe('set-room-price');
    expect(completeTutorialStep(state,'SET_ROOM_RATE').step).toBe('inspect-bookings');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/onboarding/tutorialState.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/onboarding/tutorialState.ts`:

```ts
export type TutorialStep='set-room-price'|'inspect-bookings'|'hire-housekeeping'|'complete';
export interface TutorialState { step:TutorialStep; completed:string[]; }
export function completeTutorialStep(state:TutorialState,commandType:string):TutorialState {
  const expected:Record<TutorialStep,string|null>={'set-room-price':'SET_ROOM_RATE','inspect-bookings':'OPEN_BOOKINGS','hire-housekeeping':'HIRE_EMPLOYEE','complete':null};
  if(expected[state.step]!==commandType) return state;
  const next:Record<TutorialStep,TutorialStep>={'set-room-price':'inspect-bookings','inspect-bookings':'hire-housekeeping','hire-housekeeping':'complete','complete':'complete'};
  return {step:next[state.step],completed:[...state.completed,state.step]};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/onboarding/tutorialState.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/onboarding/TutorialCoach.tsx src/ui/onboarding/tutorialState.test.ts src/ui/onboarding/tutorialState.ts
git commit -m "feat: add guided onboarding"
```

---

### Task 7: Link contextual help to causal explanations

**Files:**
- Create: `src/ui/help/ContextHelp.tsx`
- Test: `src/ui/help/ContextHelp.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContextHelp } from './ContextHelp';

describe('ContextHelp', () => {
  it('explains a metric using its driver list', () => {
    render(<ContextHelp title="Occupancy" drivers={['Business demand -12%','New supply +240 rooms']} />);
    expect(screen.getByText('Business demand -12%')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/help/ContextHelp.test.tsx
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/ui/help/ContextHelp.tsx`:

```ts
export function ContextHelp(props:{title:string;drivers:string[]}) {
  return <aside aria-label={`${props.title} help`}><h2>Why?</h2><ul>{props.drivers.map(x=><li key={x}>{x}</li>)}</ul></aside>;
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/help/ContextHelp.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/help/ContextHelp.test.tsx src/ui/help/ContextHelp.tsx
git commit -m "feat: add causal context help"
```

---

### Task 8: Add notification filters and auto-pause preferences

**Files:**
- Create: `src/ui/notifications/notificationPreferences.ts`
- Create: `src/ui/notifications/NotificationCenter.tsx`
- Test: `src/ui/notifications/notificationPreferences.test.ts`

**MASTER completion contract:**

- Notifications carry stable category/type, source hotel/region/company, severity, time,
  causes, delegate, action target, read/acknowledged state, and grouping identity.
- Filters cover category, severity, hotel, region, and delegated responsibility.
- Auto-pause is configured by type/severity, uses the typed Worker control protocol, and
  cannot race or falsely appear applied. Delegated items summarize while critical
  exceptions escalate; repeated low-value alerts group for mature portfolios.
- Severity has text/icon and accessible live-region semantics; sound is never sole signal.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { shouldPauseForAlert } from './notificationPreferences';

describe('notification preferences', () => {
  it('pauses only at or above the configured severity', () => {
    expect(shouldPauseForAlert('warning','critical')).toBe(false);
    expect(shouldPauseForAlert('critical','critical')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/ui/notifications/notificationPreferences.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

Implement the full notification record and preference schema from the completion
contract, deterministic grouping/deduplication, delegated summaries/escalations, and a
protocol-level pause request with pending/accepted/rejected presentation. The severity
comparison from the first unit test is only one pure leaf rule.

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/ui/notifications/notificationPreferences.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/notifications/NotificationCenter.tsx src/ui/notifications/notificationPreferences.test.ts src/ui/notifications/notificationPreferences.ts
git commit -m "feat: add notification preferences"
```

---

### Task 9: Create Web Audio buses and volume preferences

**Files:**
- Create: `src/audio/audioEngine.ts`
- Create: `src/ui/settings/AudioSettings.tsx`
- Test: `src/audio/audioEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeAudioSettings } from './audioEngine';

describe('audio settings', () => {
  it('clamps master, music, ambience, and ui buses independently', () => {
    expect(normalizeAudioSettings({master:2,music:.5,ambience:-1,ui:.25})).toEqual({master:1,music:.5,ambience:0,ui:.25});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/audio/audioEngine.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/audio/audioEngine.ts`:

```ts
export interface AudioSettings { master:number; music:number; ambience:number; ui:number; }
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function normalizeAudioSettings(v:AudioSettings):AudioSettings { return {master:clamp(v.master),music:clamp(v.music),ambience:clamp(v.ambience),ui:clamp(v.ui)}; }
export type AudioBus='music'|'ambience'|'ui';
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/audio/audioEngine.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/audio/audioEngine.test.ts src/audio/audioEngine.ts src/ui/settings/AudioSettings.tsx
git commit -m "feat: add audio buses"
```

---

### Task 10: Drive hotel ambience from visible operating state

**Files:**
- Create: `src/audio/ambience.ts`
- Test: `src/audio/ambience.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { ambienceMix } from './ambience';

describe('hotel ambience', () => {
  it('raises lobby activity with visible guests and queues', () => {
    expect(ambienceMix({visibleGuests:80,receptionQueue:15,restaurantGuests:30}).lobby).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/audio/ambience.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/audio/ambience.ts`:

```ts
export function ambienceMix(input:{visibleGuests:number;receptionQueue:number;restaurantGuests:number}) {
  const clamp=(v:number)=>Math.max(0,Math.min(1,v));
  return { lobby:clamp(input.visibleGuests/120+input.receptionQueue/50), restaurant:clamp(input.restaurantGuests/80) };
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/audio/ambience.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/audio/ambience.test.ts src/audio/ambience.ts
git commit -m "feat: add dynamic hotel ambience"
```

---

### Task 11: Add semantic audio cues with visual/live-region alternatives

**Files:**
- Create: `src/audio/cues.ts`
- Test: `src/audio/cues.test.ts`
- Modify: `src/ui/notifications/NotificationCenter.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { cueForEvent } from './cues';

describe('audio cues', () => {
  it('maps a critical cash alert to a non-speech semantic cue and label', () => {
    expect(cueForEvent('LIQUIDITY_CRITICAL')).toEqual({sound:'alert-critical',labelKey:'alerts.liquidityCritical'});
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/audio/cues.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/audio/cues.ts`:

```ts
export interface SemanticCue { sound:string; labelKey:string; }
const cues:Record<string,SemanticCue>={LIQUIDITY_CRITICAL:{sound:'alert-critical',labelKey:'alerts.liquidityCritical'},GUEST_CHECKIN:{sound:'checkin',labelKey:'events.guestCheckin'}};
export function cueForEvent(type:string):SemanticCue|null { return cues[type]??null; }
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/audio/cues.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/audio/cues.test.ts src/audio/cues.ts src/ui/notifications/NotificationCenter.tsx
git commit -m "feat: add semantic audio cues"
```

---

### Task 12: Migrate and persist player presentation preferences

**Files:**
- Create: `src/game/persistence/migrations/v6-to-v7.ts`
- Test: `src/game/persistence/migrations/v6-to-v7.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { migrateV6ToV7 } from './v6-to-v7';

describe('v6 to v7 migration', () => {
  it('adds locale, accessibility, notification, and audio defaults', () => {
    const next=migrateV6ToV7({saveVersion:6});
    expect(next.saveVersion).toBe(7);
    expect(next.preferences.locale).toBe('de-DE');
    expect(next.preferences.accessibility.reducedMotion).toBe(false);
  });
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm run test:run -- src/game/persistence/migrations/v6-to-v7.test.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`src/game/persistence/migrations/v6-to-v7.ts`:

```ts
export function migrateV6ToV7<T extends {saveVersion:6}>(oldSave:T) {
  return {...oldSave,saveVersion:7 as const,preferences:{locale:'de-DE',accessibility:{textScale:1,highContrast:false,reducedMotion:false},notifications:{autoPauseAt:'critical'},audio:{master:1,music:.7,ambience:.8,ui:.8}}};
}
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm run test:run -- src/game/persistence/migrations/v6-to-v7.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/persistence/migrations/v6-to-v7.test.ts src/game/persistence/migrations/v6-to-v7.ts
git commit -m "feat: persist player presentation preferences"
```

---

### Task 13: Add automated accessibility and localization browser gates

**Files:**
- Modify: `package.json`
- Create: `e2e/accessibility.spec.ts`
- Create: `e2e/localization.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('main management screen has no serious axe violations', async ({page}) => {
  await page.goto('/');
  const result=await new AxeBuilder({page}).analyze();
  expect(result.violations.filter(v=>['serious','critical'].includes(v.impact??''))).toEqual([]);
});
```

- [ ] **Step 2: Run the targeted test and verify the expected failure**

```bash
npm install -D @axe-core/playwright && npm run test:e2e -- e2e/accessibility.spec.ts e2e/localization.spec.ts
```

Expected: FAIL because the new contract or behavior is not implemented yet.

- [ ] **Step 3: Implement the smallest production-shaped change**

`e2e/localization.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('locale can switch without changing simulation values', async ({page}) => {
  await page.goto('/');
  const cashBefore=await page.getByTestId('cash-value').getAttribute('data-minor');
  await page.getByRole('button',{name:/language/i}).click();
  await page.getByRole('option',{name:'English'}).click();
  await expect(page.getByText('Cash')).toBeVisible();
  expect(await page.getByTestId('cash-value').getAttribute('data-minor')).toBe(cashBefore);
});
```

- [ ] **Step 4: Run targeted tests plus typecheck**

```bash
npm install -D @axe-core/playwright && npm run test:e2e -- e2e/accessibility.spec.ts e2e/localization.spec.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add e2e/accessibility.spec.ts e2e/localization.spec.ts package.json
git commit -m "test: add accessibility localization gates"
```

---

## Plan self-review

### Spec coverage
- Localization resources and formatters -> Tasks 1-2.
- Keyboard and semantic canvas alternative -> Tasks 3-4.
- Text/contrast/motion preferences -> Task 5.
- Onboarding and contextual help -> Tasks 6-7.
- Notification management -> Task 8.
- Audio buses, ambience, and semantic cues -> Tasks 9-11.
- Persistent preferences -> Task 12.
- Automated accessibility/localization acceptance -> Task 13.

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

**Next plan after this gate:** Plan 09 - Scale, Performance & Long-Run Balancing
