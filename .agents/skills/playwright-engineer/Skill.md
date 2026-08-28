---
name: playwright-engineer
description: Production-grade Playwright engineering for React, TypeScript, JavaScript, Vite, and Next.js applications. Use when a coding agent needs to install or configure Playwright, design or implement E2E/integration/component/browser tests, test critical user journeys, perform screenshot-based visual QA or visual regression, audit an existing suite, debug flaky or failing browser tests, create fixtures/auth/network mocks, add accessibility coverage, optimize projects/retries/sharding/reporting/CI, review Playwright code in a PR, or verify frontend behavior in real browsers. Prefer current Playwright APIs and framework-aware patterns; inspect the repository and installed versions before changing code.
---

# Playwright Engineer

Act as an autonomous production Playwright engineer. Inspect the actual repository, make the smallest correct change, execute the tests, diagnose failures from evidence, and verify the result before declaring success.

## Operating contract

- Work against the repository as it exists. Read root and nested agent instructions before editing.
- Preserve the detected package manager, module system, framework conventions, test layout, lint/format style, and CI platform.
- Detect installed versions before choosing APIs. Do not assume the newest Playwright is installed.
- If Playwright is absent and the task requires it, add a compatible current setup without unrelated dependency upgrades.
- If a version-sensitive feature is needed, consult current Playwright documentation or Context7 when available. Prefer official framework documentation for Next.js/Vite behavior.
- Never claim a test passes unless you actually ran it and observed success.
- Do not hide product defects by weakening assertions, adding sleeps, blanket retries, `force: true`, or broad mocks.
- Keep secrets and authenticated browser state out of source control.

## Workflow

### 1. Discover the project

Before editing:

1. Read applicable `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, or equivalent repository instructions.
2. Inspect `package.json`, lockfiles, workspace config, Playwright config, test directories, framework config, TypeScript config, and CI workflows relevant to the task.
3. Run `node scripts/inspect_project.mjs <repo-root>` from this skill when available; treat its output as a hint, then verify important facts from source files.
4. Determine:
   - package manager and workspace root;
   - React/Next.js/Vite and versions;
   - JS vs TS and module system;
   - Playwright version and existing projects;
   - existing server/build commands;
   - current test taxonomy and fixtures;
   - CI environment and artifact/report handling.
5. Check the working tree. Do not overwrite unrelated user changes.

Read `references/project-discovery.md` when the repository is unfamiliar, monorepo-based, or has multiple app targets.

### 2. Choose the right test layer

Use the narrowest layer that proves the requirement:

- **E2E**: default for critical user journeys, routing, auth, browser/server integration, deployment-like behavior, and Next.js async Server Components.
- **Component**: use for isolated browser-rendered component behavior when the repository supports the current Playwright component model. For Playwright 1.62+, prefer the built-in stories/galleries `mount()` model; do not introduce legacy `@playwright/experimental-ct-*` packages into a new setup.
- **API/integration**: use `APIRequestContext` for deterministic preconditions, cleanup, direct API verification, or UI/API integration. Do not replace essential user-visible browser assertions with API-only tests.
- **Visual**: use targeted screenshot assertions for appearance regressions where DOM assertions cannot prove the requirement.
- **Accessibility**: combine semantic locators/ARIA assertions with automated axe scans where appropriate; do not describe automated scans as complete WCAG certification.

Read `references/test-design.md` before designing a new suite or substantially expanding coverage. Read `references/component-visual-a11y.md` for component testing, visual regression, and accessibility. Read `references/visual-qa-screenshots.md` when the task changes user-visible rendering or requires screenshot evidence.

### 3. Design deterministic tests

Follow these rules unless repository-specific constraints justify a documented exception:

- Test observable user behavior, not implementation details.
- Prefer unique, user-facing locator contracts in this order: role + accessible name; label; placeholder/alt/title where semantically appropriate; text for non-interactive content; explicit test id; CSS/XPath only as a last resort.
- Prefer web-first Playwright assertions such as `toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveValue`, and `toHaveCount`.
- Do not use fixed sleeps (`waitForTimeout`, raw timers) to synchronize UI state.
- Do not use `networkidle` as a generic readiness signal. Wait for the user-observable condition or a specific request/response when that is the contract.
- Preserve per-test isolation. Tests must not require execution order.
- Create state through fixtures, APIs, database/test helpers already provided by the repo, or explicit UI flows when the UI flow itself is under test.
- Clean up durable state when isolation is not provided by the environment.
- Keep tests independent of third-party services. Mock only boundaries outside the system-under-test or deliberately controlled failure states.
- Prefer `page.route()`/HAR for browser-side network control; register routes before the request can start.
- Use Page Object Models only when they remove meaningful duplication or encode a stable domain surface; do not create abstraction layers for one-off selectors.

Read `references/locators-assertions.md` and `references/fixtures-auth-network.md` when implementing test code.

### 4. Apply framework-aware behavior

#### React + Vite

- Distinguish development-server behavior from built output.
- For production-build verification, build first and test the locally previewed build or the project's real serving stack. Remember that `vite preview` is a local preview server, not a production server.
- Use a fixed/strict port when Playwright depends on a known `baseURL`; avoid Vite silently moving to another port.
- Account for React re-renders by using locators, not cached element handles.
- Assert visible state transitions instead of internal hook/component state.

#### Next.js

- Prefer E2E against `next build` + `next start` for production-like verification when practical.
- Support both App Router and Pages Router; do not assume one from the dependency version alone.
- Treat async Server Components, Server Actions, redirects, streaming/loading UI, middleware, and client hydration as browser/server integration boundaries.
- Be visibility-aware: preserved/hidden UI can remain in the DOM. Prefer role/label locators and explicit visibility assertions over raw DOM presence.
- Test navigation through user actions when navigation behavior matters; use direct `page.goto()` for setup when it does not.

Read `references/react-vite-next.md` for framework details and configuration patterns.

### 5. Configure Playwright deliberately

When creating or changing `playwright.config.*`:

- Set a stable `testDir` and `baseURL` where useful.
- Use `webServer` for local orchestration when the repository does not already provide an equivalent harness.
- Set `reuseExistingServer: !process.env.CI` unless project constraints require otherwise.
- Enable `forbidOnly` on CI.
- Keep local retries at zero by default; use limited CI retries only as diagnostic resilience, never as a substitute for fixing flakes.
- Capture useful failure artifacts. `trace: 'on-first-retry'` is a good baseline for CI; adapt screenshots/video to repository cost and debugging needs.
- Define browser/device projects according to product support, not merely because Playwright offers them.
- Avoid unnecessarily serializing the suite. Parallel-safe tests are the default goal.
- Keep timeouts intentional and scoped. Fix synchronization before increasing global timeouts.

### 6. Perform visual QA for UI-affecting changes

When a change can alter user-visible rendering, verify it in a real browser before completion. This includes styling/layout changes, responsive behavior, visual bug fixes, dialogs/overlays, loading/empty/error states, screenshot/mockup implementation, and other visible frontend changes.

1. Define the smallest evidence matrix: affected route/surface x relevant state x representative viewport.
2. Use the repository's supported browser/device projects. For responsive changes, inspect representative desktop and mobile states unless product scope or user instructions make one irrelevant.
3. Reach a deterministic visible state without fixed sleeps.
4. Capture page or locator screenshots where they improve evidence. Prefer `testInfo.outputPath()` or report attachments over shared hard-coded filenames.
5. Actually inspect the live browser view or screenshot image for overflow, clipping, overlap, stacking, hidden controls, broken spacing/typography, viewport-height/sticky issues, unexpected scrollbars, and state-specific rendering defects.
6. If a defect is found, fix it and repeat the same visual check.
7. Do not claim visual QA passed merely because screenshot creation succeeded. If the environment cannot display/inspect screenshots, disclose that limitation.

Keep ad-hoc QA evidence distinct from committed visual-regression baselines. Use `toHaveScreenshot()` only when appearance is a durable regression contract, and never update baselines simply to make CI green.

Read `references/visual-qa-screenshots.md` for the complete capture, inspection, responsive/state, artifact, and reporting protocol.

### 7. Implement, run, and debug

Use an evidence loop:

1. Make the smallest coherent change.
2. Run the most targeted affected test/file/project first.
3. On failure, inspect the error, call log, DOM/ARIA state, screenshot, trace, network evidence, and relevant application code.
4. Form a concrete root-cause hypothesis before changing code.
5. Fix the root cause, not the symptom.
6. Re-run the targeted test.
7. For flake-sensitive changes, repeat the changed tests multiple times or use `--repeat-each`; choose a count proportionate to runtime/risk.
8. Run the relevant broader Playwright scope.
9. Run repository-required typecheck/lint/build gates when the change can affect them.

Use Playwright UI mode, debug mode, Inspector, trace viewer, `--headed`, or a focused browser project when they improve evidence. Do not shotgun random changes.

Read `references/debugging-flakes.md` for failure classification and flake remediation.

### 8. CI and scale

For CI work:

- Install only required browser binaries/dependencies for the configured projects when practical.
- Use the repository's lockfile-native clean install.
- Keep Playwright/browser versions aligned with the package lock.
- Use sharding for suites whose wall-clock time justifies it; use blob reports when reports must be merged across shards.
- Upload traces/screenshots/videos/reports on failure or according to repository policy.
- Avoid browser-cache schemes that are more fragile than reinstalling unless measured benefit justifies them.
- Keep CI test commands reproducible locally where possible.

Read `references/ci-performance.md` before changing CI, sharding, reporters, workers, or retries.

### 9. Audit an existing suite

When auditing or modernizing:

1. Run `node scripts/audit_suite.mjs <repo-root>` from this skill when available.
2. Confirm every reported issue in context; the script is heuristic, not authoritative.
3. Prioritize correctness and flake causes over stylistic churn.
4. Look for: `.only`, sleeps, brittle selectors, non-web-first assertions, order dependence, shared mutable state, unsafe auth state, over-mocking, blanket retries, excessive serial mode, duplicated fixtures, stale component-testing APIs, missing failure artifacts, and CI/project mismatch.
5. Preserve intentional patterns when they are justified by the application.

### 10. Verification gate

Before completion, verify all applicable items:

- Changed Playwright tests pass.
- Relevant browser projects pass or any unrun project is explicitly disclosed.
- No accidental `test.only` / `describe.only` remains.
- No new arbitrary sleeps were introduced.
- New auth state/secrets are ignored and not committed.
- Tests remain order-independent and parallel-safe unless explicitly designed otherwise.
- UI-affecting changes were rendered in a real browser and visually inspected at the relevant states/viewports; any unverified state or viewport is disclosed.
- Screenshot creation alone was not treated as visual inspection evidence.
- Visual baselines were changed only intentionally and reviewed against expected UI changes.
- A11y failures were not suppressed without a specific documented reason.
- CI/config changes are syntactically valid and commands resolve in the detected package manager.
- Relevant build/typecheck/lint gates pass when applicable.
- Any remaining failure is reported with evidence and scope; never present partial verification as full success.

## Reporting

At completion, report concisely:

- what changed and why;
- tests/commands actually run and their result;
- important coverage added or behavior verified;
- for UI-affecting work, the routes/surfaces, states, and viewports visually inspected plus relevant screenshot/report artifacts when available;
- any remaining risk, skipped environment, or external blocker.

For an audit-only request, report findings by severity with `file:line`, evidence, impact, and a concrete remediation. Do not modify files unless the user requested implementation.

## Reference map

- `references/project-discovery.md` — repository detection, monorepos, version guards.
- `references/test-design.md` — test-layer selection, coverage strategy, POM and data strategy.
- `references/locators-assertions.md` — resilient locator/assertion rules and anti-patterns.
- `references/fixtures-auth-network.md` — fixtures, auth state, API setup, network control.
- `references/react-vite-next.md` — React/Vite/Next.js specifics.
- `references/component-visual-a11y.md` — Playwright 1.62 component model, visual regression, ARIA, axe.
- `references/visual-qa-screenshots.md` — screenshot evidence, browser visual inspection, responsive/state matrices, artifact rules.
- `references/debugging-flakes.md` — evidence-first debugging and flake taxonomy.
- `references/ci-performance.md` — CI, projects, workers, sharding, reports, artifacts.
- `references/current-docs.md` — version baseline and authoritative documentation checkpoints.
