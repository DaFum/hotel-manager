# Release checklist

1. Start from a clean checkout on the release commit.
2. Set and validate the stable semantic version and update `CHANGELOG.md`.
3. Run `npm run release:check` without skipping or reordering a gate.
4. Confirm original-parity claims contain only verified terms and no copied assets.
5. Confirm current-format save/load, recovery generations, and real replay corpora pass.
6. Confirm Chromium, Firefox, and WebKit critical paths pass.
7. Confirm accessibility, localization, content, performance, stress, and invariant gates pass.
8. Keep diagnostics local and inspect the exported allow-listed fields before sharing them.
9. Record the clean-checkout command output as release evidence.
10. Do not create a release tag if any gate fails.

A retry after a failure is a new gate run. Never tag from partial output or from a working tree with unreviewed changes.
