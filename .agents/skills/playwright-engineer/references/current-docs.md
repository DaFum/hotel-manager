# Current documentation checkpoints

Baseline checked: 2026-08-28.

This file is a freshness anchor, not a substitute for checking the installed repository version.

## Playwright

Authoritative documentation:

- Release notes: https://playwright.dev/docs/release-notes
- Best practices: https://playwright.dev/docs/best-practices
- Locators: https://playwright.dev/docs/locators
- Assertions: https://playwright.dev/docs/test-assertions
- Isolation: https://playwright.dev/docs/browser-contexts
- Authentication: https://playwright.dev/docs/auth
- Web server: https://playwright.dev/docs/test-webserver
- Component testing: https://playwright.dev/docs/test-components
- Screenshots: https://playwright.dev/docs/screenshots
- Visual comparisons: https://playwright.dev/docs/test-snapshots
- Test use options / failure screenshots: https://playwright.dev/docs/test-use-options
- Accessibility: https://playwright.dev/docs/accessibility-testing

At the baseline date, official release notes expose Playwright 1.62. The 1.62 release introduces the new built-in component stories/galleries model and adds WebP screenshot support. Always re-check release notes for future work and verify feature compatibility with the repository's installed version.

## Next.js

- Playwright guide: https://nextjs.org/docs/app/guides/testing/playwright
- Testing overview: https://nextjs.org/docs/app/guides/testing

The current guide recommends testing against production code when practical. The testing overview recommends E2E over unit testing for async Server Components where tooling support is incomplete.

## Vite

- Static deployment / local build preview: https://vite.dev/guide/static-deploy.html
- CLI: https://vite.dev/guide/cli
- Server options: https://vite.dev/config/server-options.html
- Preview options: https://vite.dev/config/preview-options.html

Vite documents `vite preview` as a local preview of built output, not a production server. Use a strict/fixed port when a deterministic Playwright base URL depends on it.

## Freshness rule

When implementing version-sensitive behavior:

1. detect installed versions;
2. prefer installed-version documentation when available;
3. consult current official docs/Context7 for changed APIs;
4. do not copy an example across major behavior changes without compatibility verification.
