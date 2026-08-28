# React, Vite, and Next.js patterns

## React

- Use locators so re-renders do not stale the test target.
- Assert UI that users observe rather than component state or hook internals.
- For Suspense/loading flows, assert the expected transition if it matters instead of sleeping for the final state.
- Test portals/modals by accessible role/name; do not assume DOM ancestry under the triggering component.
- For virtualized lists, interact with visible rendered items and scroll intentionally; do not assert hidden/unmounted rows as if all data must exist in the DOM.

## Vite

Vite dev server defaults to port 5173 and can choose another port when occupied unless strict port behavior is enabled. Playwright `baseURL` needs a predictable origin.

For built-output verification:

1. run the repository build command;
2. serve the built output using the repository's actual server or `vite preview` for local verification;
3. set a fixed port/`--strictPort` when the test config depends on it.

`vite preview` previews the production build locally but is not itself a production server. Do not claim it validates server infrastructure that Vite does not provide.

Example shape for a simple Vite app (adapt package manager/scripts/port):

```ts
webServer: {
  command: 'npm run build && npm run preview -- --port 4173 --strictPort',
  url: 'http://127.0.0.1:4173',
  reuseExistingServer: !process.env.CI,
},
use: { baseURL: 'http://127.0.0.1:4173' },
```

Use dev server instead when testing development-only behavior is intentional.

## Next.js

Current Next.js guidance recommends Playwright E2E against production code when practical: build with `next build`, serve with `next start`, then test. `webServer` can orchestrate this.

Account for:

- App Router and Pages Router;
- Server and Client Components;
- async Server Components: prefer E2E when unit tooling cannot represent their runtime behavior;
- Server Actions/forms and redirects;
- middleware/auth redirects;
- streaming and loading UI;
- hydration/client navigation;
- route preservation/cached hidden UI.

Hidden/preserved UI can remain in the DOM. Avoid raw presence assertions that accidentally match hidden state; use user-facing locators plus `toBeVisible()` or an assertion appropriate to the intended state.

For navigation, prefer clicking the real link/button when testing routing behavior. Direct navigation is efficient for preconditions when routing behavior is irrelevant.

For environment variables, never expose server-only secrets to browser test code. Provide test-safe server env through the orchestrated server process/CI secret mechanism.
