# Locators and assertions

## Locator priority

1. `getByRole(role, { name })` for interactive and semantic elements.
2. `getByLabel()` for labeled form controls.
3. `getByPlaceholder()`, `getByAltText()`, `getByTitle()` when the attribute is part of the user-facing contract.
4. `getByText()` for non-interactive content.
5. `getByTestId()` for explicit stable test contracts when semantic locators are not suitable.
6. CSS/XPath only when there is no better stable contract.

Prefer narrowing through semantic containers and filters over `.nth()`/`.first()` when multiple matches indicate ambiguity.

## React-safe locator behavior

Keep a `Locator`, not an `ElementHandle`, across re-renders. Locators re-resolve against the current DOM for actions/assertions.

## Web-first assertions

Prefer retrying assertions:

```ts
await expect(page.getByRole('alert')).toHaveText('Saved');
await expect(page).toHaveURL(/\/projects\/\d+$/);
await expect(page.getByLabel('Name')).toHaveValue('Ada');
```

Avoid immediate state snapshots followed by generic assertions:

```ts
// brittle
expect(await page.getByRole('alert').isVisible()).toBe(true);
```

Use `expect.poll()` or `expect(async () => ...).toPass()` only for conditions that cannot be expressed as a locator/page assertion.

## Synchronization

Avoid:

- `page.waitForTimeout(...)`;
- raw `setTimeout` sleeps;
- broad `waitForLoadState('networkidle')` as readiness;
- arbitrary large timeouts masking missing conditions.

Prefer:

- a web-first assertion on the resulting UI;
- `waitForResponse`/`waitForRequest` for a specific network event when that network event is part of the contract;
- `waitForURL` for navigation when the URL transition itself is relevant;
- locators and actionability auto-waiting.

## Explicit contracts

Add a test id when the UI has no stable accessible/user-visible discriminator, not to avoid fixing broken semantics. A test id should describe domain purpose, not layout (`save-project`, not `third-blue-button`).

## Force and trial actions

Treat `{ force: true }` as a code smell. Use only when the application intentionally requires interacting despite normal actionability rules and document why. Otherwise diagnose overlays, animation, disabled state, pointer interception, or incorrect target selection.
