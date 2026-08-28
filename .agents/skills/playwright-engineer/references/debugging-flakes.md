# Debugging failures and flakes

## Classify before fixing

Common categories:

1. product defect;
2. test synchronization defect;
3. unstable locator/ambiguous target;
4. shared state/order dependence;
5. environment/server startup issue;
6. network/third-party nondeterminism;
7. data collision/cleanup failure;
8. browser-specific product behavior;
9. visual environment drift;
10. actual performance timeout.

Do not classify a failure as a flake merely because a retry passes.

## Evidence order

Inspect:

- Playwright error and call log;
- failed locator and strictness/actionability details;
- screenshot;
- trace timeline, DOM snapshot, console, and network;
- server logs when available;
- application source for the failing state transition;
- repetition pattern across browser/project/worker.

## Common remediations

- sleep -> assert the real readiness condition;
- brittle CSS/XPath -> semantic locator or explicit test id;
- stale element handle -> locator;
- shared account conflict -> per-worker/per-test identity;
- race between listener and request -> register wait/route/listener before triggering action;
- random data collision -> deterministic unique id tied to test/worker;
- serial mode hiding coupling -> remove shared mutation and restore isolation;
- blanket retry -> fix root cause, then retain only the repository's intentional CI retry policy;
- huge timeout -> localize the slow boundary and measure whether product performance is the issue.

## Flake confidence

After a fix, repeat the smallest relevant test enough to challenge the suspected race. Three to five repetitions can be a useful quick check; use more for rare flakes when runtime allows. Then run the broader affected scope.

A passing repetition increases confidence but does not prove absence of a rare flake. Report what was actually exercised.
