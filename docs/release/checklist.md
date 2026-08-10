# Release checklist

1. Start from a clean checkout on the release commit.
2. Set and validate the stable semantic version and update `CHANGELOG.md`.
3. Run `npm run release:check` without skipping or reordering a gate.
4. Confirm all 54 acceptance rows have concrete implementation, automated, and—where required—reviewed evidence.
5. Confirm original-parity claims contain only verified terms and no copied assets.
6. Confirm the complete migration chain, recovery generations, and real replay corpora pass.
7. Confirm Chromium, Firefox, and WebKit critical paths pass.
8. Confirm accessibility, localization, content, performance, stress, and invariant gates pass.
9. Keep diagnostics local and inspect the exported allow-listed fields before sharing them.
10. Record the clean-checkout command output as release evidence.
11. Do not create a release tag if any gate fails.

A retry after a failure is a new gate run. Never tag from partial output or from a working tree with unreviewed changes.
