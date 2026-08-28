# Component testing, visual regression, and accessibility

## Component testing version guard

Playwright 1.62 introduced a new built-in component-testing model based on stories and a gallery page. Tests use `@playwright/test` and the built-in `mount()` fixture to mount story ids. There is no dedicated component-testing runtime/bundler package in this model.

For a new Playwright 1.62+ setup:

- prefer the stories/galleries model;
- keep scenario props/data/providers in stories;
- use the returned root locator for assertions and screenshots;
- register `page.route()` before `mount()` because mounting navigates;
- make story state observable for callback/state assertions without coupling Node test code to in-browser callback internals.

Do not add legacy `@playwright/experimental-ct-react` to a fresh modern setup. If an existing repository deliberately uses the older experimental model on an older Playwright version, do not rewrite it blindly; treat migration as a separate compatibility change.

## Visual regression

Visual regression is different from one-off visual QA evidence. For browser-based inspection after UI changes, responsive/state screenshot matrices, and evidence reporting, read `visual-qa-screenshots.md`.

Use `toHaveScreenshot()` for appearance contracts that semantic DOM assertions cannot prove. Prefer component/region screenshots over full-page snapshots when the requirement is local.

Stabilize before snapshotting:

- deterministic data and viewport;
- deterministic fonts/assets;
- disable or wait through non-contractual animation only when necessary;
- mask truly dynamic non-essential regions rather than accepting large thresholds;
- keep OS/browser rendering environment consistent between baseline creation and CI.

Do not update snapshots merely to make CI green. Review the diff and verify the UI change is intended.

## ARIA snapshots

Use `toMatchAriaSnapshot()` when a stable semantic accessibility tree is itself the contract. Keep templates focused; avoid snapshotting an entire large page when only one region matters.

ARIA snapshots complement, not replace, behavioral assertions or accessibility audits.

## Accessibility with axe

Use `@axe-core/playwright` for automatically detectable violations. Scope scans when necessary to isolate a component or known region.

Axe cannot prove full WCAG conformance. Combine it with:

- semantic locator coverage;
- keyboard/focus workflows for important interactions;
- visible focus and dialog/modal behavior where relevant;
- manual or specialized assessment for criteria automation cannot verify.

Do not globally exclude rules without a documented, reviewed reason.
