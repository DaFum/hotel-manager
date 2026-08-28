# Visual QA and screenshot evidence

Use this reference when a task changes user-visible rendering, when a bug is visual/responsive, when the user asks for screenshots, or when browser evidence is required before completion.

## Contents

1. Visual QA contract
2. Screenshot modes
3. Trigger matrix
4. Evidence matrix
5. Browser and viewport selection
6. Stabilizing the rendered state
7. Capturing evidence
8. What to inspect
9. Responsive and state coverage
10. Visual regression baselines
11. Failure artifacts
12. Evidence reporting
13. Anti-patterns

## 1. Visual QA contract

Treat screenshot capture and visual inspection as separate operations.

A screenshot file by itself is not proof that the UI was visually verified. To claim visual QA:

1. render the affected UI in a real browser;
2. reach the user-visible state through deterministic setup/actions;
3. capture the relevant viewport, page, or component;
4. actually inspect the rendered browser view or screenshot image with an available visual/browser tool;
5. check the affected state against objective defect classes and any supplied design/reference;
6. fix defects and repeat the inspection;
7. report what was inspected and what was not.

If the environment can create screenshots but cannot display/inspect them, say that screenshots were captured but not visually inspected. Do not claim the visual QA gate passed.

## 2. Screenshot modes

Keep these three purposes distinct.

### A. Visual-QA evidence

Use `page.screenshot()` or `locator.screenshot()` to document and inspect the current rendered result. These screenshots are evidence for the current task, not necessarily committed golden baselines.

Use this for:

- UI implementation review;
- responsive/layout fixes;
- visual bug reproduction and confirmation;
- screenshot/design-reference implementation;
- final evidence after a frontend change.

### B. Visual regression

Use `expect(page).toHaveScreenshot()` or `expect(locator).toHaveScreenshot()` when appearance is a durable test contract. Golden snapshots belong in version control only when the repository intentionally uses visual regression testing.

### C. Failure diagnostics

Configure automatic screenshots for failing tests when useful. A broad, compatible baseline is `screenshot: 'only-on-failure'`. Combine with trace/video according to repository policy and installed Playwright support.

Do not substitute one mode for another. A failure screenshot is not automatically a reviewed visual-regression baseline, and a golden snapshot is not automatically proof that a human-meaningful visual defect was inspected.

## 3. Trigger matrix

Perform browser-based visual QA for changes that can alter user-visible rendering, including:

- CSS, Tailwind, CSS-in-JS, theme, typography, spacing, layout, positioning, stacking, or overflow;
- React component markup that changes visible structure;
- navigation shells, headers, sidebars, tabs, dialogs, drawers, popovers, tooltips, menus, toasts, tables, forms, cards, lists, charts, or empty/error/loading states;
- responsive breakpoints and mobile-specific behavior;
- animations/transitions when their start/end state or interaction affects usability;
- image, icon, font, canvas, SVG, or other rendering changes;
- frontend bug fixes whose symptom was visual;
- implementation from a screenshot, mockup, design system, or visual acceptance reference.

Visual QA is normally unnecessary for backend-only, data-only, or test-only changes that cannot affect rendering. If uncertain, trace the change to the rendered surface before deciding.

## 4. Evidence matrix

Before capturing, define the smallest matrix that proves the change:

`affected route/surface x relevant state x representative viewport`

Examples:

- dashboard x populated x desktop + mobile;
- modal x open + validation-error x desktop;
- navigation x collapsed + expanded x mobile;
- card component x default + long-content x component viewport.

Do not screenshot every page by default. Cover the states and viewports affected by the change.

For a visual bug, preserve reproduction evidence before the fix when practical, then capture the same state after the fix. Do not manufacture a "before" state if reproducing it would require destructive or misleading changes.

## 5. Browser and viewport selection

Prefer the repository's configured Playwright projects and product support matrix.

For responsive UI work, inspect at least one representative desktop and one representative mobile viewport unless:

- the product explicitly supports only one viewport class;
- the user scoped the task to a single viewport;
- the change cannot cross a responsive boundary.

Add tablet/intermediate coverage when the changed breakpoint logic makes it relevant.

Do not invent a large browser/device matrix merely for evidence. Use browser-engine diversity when rendering differences or support requirements make it material.

Use viewport screenshots, not only full-page screenshots, when sticky/fixed headers, overlays, viewport-height layouts, or clipping are part of the risk. Full-page screenshots are useful for overall composition but can hide viewport-specific behavior.

## 6. Stabilizing the rendered state

Reach a deterministic user-visible state before capture.

- Wait for semantic UI readiness, not arbitrary timeouts.
- Wait for the specific loading indicator to disappear or expected content to become visible.
- When font loading can alter layout, wait for `document.fonts.ready` when supported and relevant.
- Seed deterministic data through existing fixtures/APIs where appropriate.
- Freeze or mask truly non-contractual dynamic content such as generated timestamps only when it prevents meaningful comparison.
- For ad-hoc evidence screenshots, disable non-contractual animations when a stable endpoint is needed. Preserve animation behavior when motion itself is under test.
- Ensure image/assets relevant to the checked layout are loaded before capture.

Example font readiness:

```ts
await page.evaluate(async () => {
  if ('fonts' in document) await document.fonts.ready;
});
```

Do not add `waitForTimeout()` to make screenshots "settle".

## 7. Capturing evidence

### Page evidence

Use a full-page capture for overall page composition when appropriate:

```ts
await page.screenshot({
  path: testInfo.outputPath('dashboard-desktop.png'),
  fullPage: true,
  animations: 'disabled',
});
```

Use a viewport capture when fixed/sticky/overlay behavior matters:

```ts
await page.screenshot({
  path: testInfo.outputPath('dashboard-viewport.png'),
  animations: 'disabled',
});
```

### Region/component evidence

Prefer a locator screenshot when the change is local:

```ts
await page
  .getByRole('dialog', { name: 'Account settings' })
  .screenshot({ path: testInfo.outputPath('account-settings-dialog.png') });
```

### Attach to the Playwright report

Use attachments when the artifact should travel with the test report:

```ts
const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
await testInfo.attach('visual-qa-dashboard', {
  body: image,
  contentType: 'image/png',
});
```

Prefer `testInfo.outputPath()` or report attachments over hard-coded shared filenames so parallel workers do not overwrite each other.

When Playwright 1.62+ is installed, PNG remains appropriate for lossless QA evidence; lossless WebP is also available if the repository wants smaller artifacts. Do not introduce a new image format without repository benefit.

## 8. What to inspect

Inspect the rendered result for the classes relevant to the change, including:

- unexpected horizontal or vertical overflow;
- clipped, truncated, or inaccessible content;
- overlapping elements and collision at breakpoints;
- broken z-index/stacking, overlays, backdrops, dropdowns, or modals;
- hidden or off-screen controls;
- inconsistent alignment, spacing, sizing, and grid rhythm;
- broken typography, font fallback, wrapping, or line-height;
- stretched, cropped, missing, or low-quality images/icons;
- accidental layout shifts after content/assets load;
- sticky/fixed elements covering content;
- incorrect viewport-height behavior;
- empty/loading/error/disabled states that collapse or overflow;
- long labels, realistic data lengths, and localization-sensitive wrapping when applicable;
- unexpected scrollbars;
- contrast or visible-focus defects that can be seen in the checked state;
- mismatch against a supplied screenshot/mockup/reference.

Do not call subjective aesthetic preference a bug unless the user/design system defines that expectation. Separate objective rendering defects from optional polish suggestions.

## 9. Responsive and state coverage

For each affected surface, prioritize boundary states over many redundant screenshots.

Useful state categories:

- initial/loading;
- populated/success;
- empty;
- validation/error;
- expanded/collapsed;
- open/closed overlay;
- disabled/enabled;
- long-content/extreme-but-valid data;
- focus/keyboard state when visually relevant.

For responsive work, inspect around the breakpoint that changed, not only a very wide desktop and very narrow phone. If a defect occurs only near a boundary, add a viewport close to that boundary.

## 10. Visual regression baselines

Use screenshot assertions for stable visual contracts:

```ts
await expect(page.getByRole('main')).toHaveScreenshot('dashboard-main.png', {
  animations: 'disabled',
});
```

Keep thresholds tight and justified. Prefer masking a genuinely non-contractual dynamic region over accepting large global pixel differences.

Review actual/expected/diff output before updating a baseline. Never run snapshot update commands as a generic fix for a failing visual test.

When a baseline must change:

1. verify the application change is intended;
2. inspect the rendered result and diff;
3. update only the affected snapshots;
4. re-run the visual test;
5. include the baseline change in review evidence.

## 11. Failure artifacts

A useful baseline config is:

```ts
use: {
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
}
```

Adapt this to the installed Playwright version and repository cost constraints. Do not force video/screenshots/traces for every passing test when storage/runtime cost outweighs value.

Failure artifacts support diagnosis. Inspect them together with:

- the assertion error and call log;
- DOM/ARIA state;
- console errors;
- network failures;
- application logs when available.

## 12. Evidence reporting

For UI-affecting work, report the evidence actually inspected, for example:

- route/surface;
- state;
- viewport/device/project;
- screenshot/report artifact path if available;
- visual result;
- any unverified state or environment.

Good completion language:

`Visually inspected /settings in the open-dialog state at 1440x900 and the configured mobile project; no overlap, clipping, or horizontal overflow observed. Failure screenshots remain enabled in test-results.`

If screenshot capture succeeded but inspection was unavailable, say so explicitly.

## 13. Anti-patterns

Do not:

- claim visual verification from a successful screenshot API call alone;
- capture only full-page screenshots for sticky/fixed viewport defects;
- use fixed sleeps for screenshot stability;
- mask the element that contains the defect;
- increase visual-diff tolerance until a regression disappears;
- blindly update all baselines;
- overwrite one shared screenshot path from parallel tests;
- commit ad-hoc evidence screenshots unless repository/user workflow requires them;
- expose secrets, tokens, personal data, or auth state in screenshots/reports;
- treat one viewport as sufficient evidence for a responsive change without justification.
