# Test design and coverage strategy

## Prove behavior, not implementation

A strong Playwright test states a user-meaningful outcome and interacts through public browser behavior. Avoid assertions on React internals, CSS class implementation, hook state, private API calls, or incidental DOM nesting.

## Layer selection

| Need | Preferred layer |
| --- | --- |
| Critical multi-page user journey | E2E |
| Browser/server routing, auth, redirects | E2E |
| Next.js async Server Component behavior | E2E |
| Isolated interactive component in a real browser | Component testing when supported |
| Seed/cleanup or direct backend contract | APIRequestContext/integration |
| Pixel/layout regression | Visual assertion |
| Semantic structure contract | Role assertions / ARIA snapshot |
| Detect common accessibility violations | axe scan + semantic assertions |

Do not maximize E2E count. Cover high-value journeys and boundaries; leave pure business logic to cheaper unit tests when available.

## Journey design

A useful E2E test usually has:

1. deterministic precondition;
2. user action(s);
3. one or more observable outcome assertions;
4. cleanup when durable state escapes test isolation.

Split unrelated outcomes into separate tests. Keep one test cohesive enough that a failure has diagnostic meaning.

## Test data

Prefer, in order:

1. isolated seeded environments or repository factories;
2. API/database test helpers for preconditions;
3. unique per-test identifiers for shared environments;
4. UI setup only when the setup UI is itself under test.

Do not share a mutable global user between parallel tests if tests change server-side state. Use worker-scoped identities or per-test entities.

## Page objects and fixtures

Create a page/domain object when the same stable interaction surface appears across multiple tests and the abstraction reduces duplication without hiding assertions. Prefer task-oriented methods (`createProject`, `openSettings`) over giant "god" page objects.

Use fixtures for lifecycle-managed capabilities: authenticated roles, seeded records, test tenants, page/domain objects, API clients. Keep fixtures composable and minimize hidden side effects.

## Negative paths

Test failure behavior deliberately when it matters: validation, permission denial, server errors, retries, offline/slow states. Control the boundary precisely. Do not make the entire suite run against random network failures.
