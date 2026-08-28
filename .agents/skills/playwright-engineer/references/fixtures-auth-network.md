# Fixtures, authentication, API setup, and network control

## Fixtures

Use test fixtures to create reusable, lifecycle-managed capabilities. Pick scope deliberately:

- test-scoped: mutable entities, pages, per-test users, isolated state;
- worker-scoped: expensive immutable/shared infrastructure or one account per worker when server-side state permits it.

Avoid `beforeAll` browser state that makes tests order-dependent.

## Authentication

For reusable authenticated state:

- prefer a setup project/dependency or an explicit fixture;
- store state under a dedicated path such as `playwright/.auth/`;
- gitignore that path before creating state files;
- assume storage state can contain impersonation-capable cookies/headers;
- use dedicated test identities, never a developer's personal session.

One shared account is safe only when tests do not mutate conflicting server-side state. Otherwise use per-worker or per-test accounts.

Use API login when it is a supported stable boundary and login UI is not the subject under test. Keep at least focused browser coverage for the login flow itself.

## APIRequestContext

Use it for:

- seeding entities;
- cleanup;
- backend preconditions;
- verifying UI actions through backend state when that adds real value;
- API-focused integration tests.

Check response success explicitly. Keep creation and cleanup symmetric where durable state persists.

## Network control

Register `page.route()` before navigation/action that can emit the request. Match narrowly enough to avoid intercepting unrelated traffic.

Good uses:

- deterministic third-party boundary;
- explicit 4xx/5xx/slow response state;
- immutable fixture payload;
- offline/error UX.

Avoid mocking the application's own backend for every E2E test; that can convert E2E into a UI-only simulation and hide integration defects.

HAR replay is useful for stable, larger HTTP fixtures, but keep recordings reviewable and refresh intentionally. Do not record secrets into HAR files.

If a service worker intercepts requests and prevents Playwright routing from observing them, decide explicitly whether to disable/block the service worker for that test configuration or test the service-worker behavior itself.
