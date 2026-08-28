# CI, performance, projects, and reporting

## Baseline CI principles

- use the lockfile-native clean install;
- install Playwright browser binaries compatible with the locked package version;
- fail on accidental `.only` via `forbidOnly`;
- keep useful failure artifacts;
- use CI retries sparingly and never to normalize flaky tests;
- keep the browser matrix aligned with product support.

## Workers and parallelism

Playwright parallelism assumes isolated tests. Do not set workers to one as a default cure for state leakage. Reduce workers only for measured resource constraints or an explicit environment limitation.

Use `fullyParallel` only when suite structure and fixtures are safe for it. Serial mode should be exceptional.

## Sharding

Shard when suite wall-clock time and CI capacity justify it. Keep tests independent so shard placement cannot change outcomes.

For GitHub Actions or other multi-job CI, Playwright blob reports are appropriate when each shard produces an artifact that is merged into one final report with `playwright merge-reports`.

## Projects

Projects can represent:

- supported browser engines/channels;
- desktop/mobile device classes;
- authenticated/unauthenticated state;
- setup dependencies;
- environment-specific variants.

Avoid combinatorial matrices without product value. A fast Chromium PR gate plus broader scheduled/browser coverage may be more useful than every combination on every commit, depending on risk.

## Artifacts

Choose screenshot/video/trace policy to maximize diagnostic value per storage/runtime cost. A common baseline is trace on first retry and `screenshot: 'only-on-failure'`; use repository conventions and installed-version support when present.

Keep failure screenshots distinct from visual-QA evidence and committed visual-regression baselines. Preserve screenshot/report artifacts needed to diagnose a failed CI run, but do not upload every passing screenshot unless the workflow benefits from it.

Never upload auth-state files, secrets, or screenshots containing sensitive test data as generic artifacts.

## Performance

Optimize after measuring:

- API-based setup instead of repeated UI setup;
- safe parallelism;
- worker-scoped expensive immutable setup;
- sharding;
- fewer redundant browser projects on fast gates;
- avoiding duplicated E2E coverage already proven at lower layers.

Do not sacrifice determinism for speed.
