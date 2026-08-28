# Project discovery

Use this reference when entering an unfamiliar repository, workspace, or monorepo.

## Discovery order

1. Read applicable repository-agent instructions from the root down to the target app.
2. Find the workspace boundary and package manager from `packageManager`, lockfiles, and workspace config.
3. Inspect the target app's `package.json` before the root package when commands are app-scoped.
4. Detect Playwright from dependencies and config files; also inspect package scripts and CI commands because config can live outside defaults.
5. Detect React/Next/Vite from direct dependencies and config, not from filenames alone.
6. Determine whether tests target a local server, deployed preview, staging URL, or multiple origins.
7. Inspect current fixtures and setup projects before inventing new ones.

## Version guard

- Prefer the installed Playwright version's APIs.
- Run the repository's package-manager equivalent of `playwright --version` when dependencies are installed and command execution is appropriate.
- If documentation examples are newer than the installed version, verify API availability before adopting them.
- Do not upgrade Playwright merely to use a convenient API unless the task includes dependency modernization or the upgrade is necessary for correctness and compatible with repository constraints.
- For a fresh setup, use the current stable release unless repository engines/framework constraints require an older version.

## Monorepos

- Identify the actual app under test and where its server command must run.
- Keep Playwright config near existing project conventions; do not automatically move it to the monorepo root.
- Resolve `webServer.command` and `cwd` relative to the config behavior in the installed Playwright version.
- Avoid scanning or testing unrelated workspaces.
- If multiple apps participate in one journey, use multiple `webServer` entries and explicit base URLs/fixtures rather than ad-hoc process spawning inside tests.

## Existing test ecosystem

Check for Vitest/Jest/RTL/Cypress before adding tests. Preserve useful separation:

- unit/component logic already covered well by Vitest/Jest need not be duplicated in Playwright;
- migrate existing browser tests only when requested or when a broken mixed setup requires consolidation;
- reuse repository factories, seeders, mock servers, and test accounts where safe.
