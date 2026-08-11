# Redundant Release Tests Cleanup

## Goal

Remove release tests whose assertions are fully covered by the authoritative
ordered release-gate contract. Preserve every test that protects distinct
runtime, persistence, accessibility, replay, performance, or user-flow
behavior.

## Scope

- Delete `src/release/contentGate.test.ts`. Its content-validation presence and
  ordering assertions are implied by the exact command list in
  `src/release/releaseCheck.test.ts`.
- Delete `src/release/performanceGate.test.ts`. Its benchmark and stress-command
  assertions are implied by that same exact command list.
- Remove only the `includes the invariant gate` case from
  `src/release/releaseVersion.test.ts`. Keep the semantic-version validation
  case; the invariant command is already covered by the exact release list.

No E2E, simulation, migration, F&B, content, accessibility, replay, or
performance behavior tests are removed. Historical implementation plans remain
unchanged because they describe how the tests were originally introduced.

## Verification

Run the remaining release tests, the full unit suite with any independently
confirmed baseline failure reported separately, TypeScript typechecking, and a
format check over changed files. Confirm that the release command order remains
exactly covered by `src/release/releaseCheck.test.ts`.
