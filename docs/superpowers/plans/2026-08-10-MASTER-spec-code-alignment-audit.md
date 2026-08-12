# MASTER Specification ↔ Code Alignment Audit

**Goal:** Establish a canonical, reproducible index of where MASTER rules are reachable
in the built game and where implemented rules stop at isolated correctness tests.

**Audit conclusion:** The architecture foundation is aligned, but implemented-plan labels
overstate gameplay reachability. At audit target commit `f9ae152`, **196 of 597 exported
synchronous functions under `src/game/` (33%) have no production, script, or E2E caller
outside their defining file**. Fourteen engine-side points remain open.

**Canonical source of truth:**
`docs/superpowers/specs/2026-08-08-hotel-management-simulator-MASTER-spec.md`.

**Audit target:** commit `f9ae152`.

**Relevant MASTER chapters:** 2, 4, 6-7, 9, 13, 18-19, 22, 24-25, 27, 38, 40,
53, 59-68, 70-72, and 78.

---

## Scope and relationship to the coverage audit

This document is an **audit and an index**, not an implementation plan. It records the
verified audited tree and defers all 14 remediations (#53-#66) to future plans. No
remediation is implemented here.

The [2026-08-09 MASTER coverage audit](2026-08-09-MASTER-spec-coverage-audit.md)
asked **which plan owns a MASTER chapter**. This audit asks the distinct, stricter
question: **is that chapter's rule reachable in the built game?** A plan assignment or a
passing leaf test does not establish reachability.

## Reproducible reachability audit

The headline number is grep-derived. It measures plain `export function` declarations
(not `export async function`) to reproduce the population used by the ticket. A function
counts as reached only when its identifier occurs outside its defining file in production
TypeScript, `scripts/`, or `e2e/`. Co-located `*.test.ts`/`*.test.tsx` files and all other
unit/spec files are excluded: an isolated correctness test is not a gameplay caller.

Run from a clean checkout of `f9ae152`:

```bash
git checkout --detach f9ae152

rg --no-heading '^export function [A-Za-z_$][A-Za-z0-9_$]*' \
  src/game -g '*.ts' -g '*.tsx' \
  | sed -E 's#^([^:]+):.*export function ([A-Za-z_$][A-Za-z0-9_$]*).*#\1\t\2#' \
  > /tmp/hotel-exported-functions.tsv
wc -l /tmp/hotel-exported-functions.tsv

while IFS=$'\t' read -r defining_file function_name; do
  if ! rg -l -w \
    --glob '!*.test.ts' --glob '!*.test.tsx' \
    --glob '!*.spec.ts' --glob '!*.spec.tsx' \
    "$function_name" src scripts e2e \
    | awk -v defining_file="$defining_file" \
        '$0 != defining_file { found=1 } END { exit !found }'
  then
    printf '%s\t%s\n' "$defining_file" "$function_name"
  fi
done < /tmp/hotel-exported-functions.tsv \
  > /tmp/hotel-zero-caller-functions.tsv
wc -l /tmp/hotel-zero-caller-functions.tsv
```

The counts are exactly `597` enumerated and `196` zero-caller functions, so the ticket's
**196 of 597 (33%)** does not require correction. This identifier-reference audit is not
a compiler call graph: aliases, same-named symbols, or dynamic access can create false
reachability. The repository has no configured dead-code tool—no ESLint dead-code
analysis, `ts-prune`, `knip`, `madge`, or `depcheck`—to substantiate it otherwise.

### Category A — correct in isolation, not reachable

These rules are implemented and unit-tested but have no caller outside their defining
file and tests. Correctness gates prove they work when invoked, not that gameplay invokes
them. Representative zero-caller rules are:

- insurance: `takeOutPolicy`, `fileClaim`;
- statements/debt: `cashFlowStatement`, `balanceSheet`, `recogniseReceivable`,
  `debtSchedule`, `isInsolvent`;
- regulation: `evaluateCompliance`;
- revenue/distribution: `applyRatePlan`, `automaticRate`, `acceptAllotment`;
- purchasing/utilities: `signSupplierContract`, `setReorderRule`,
  `applyEfficiencyInvestment`.

### Category B — aligned architecture contracts

- Worker authority: the Worker owns authoritative state; React/Pixi consume typed
  snapshots and deltas (MASTER 59, 66-67).
- `PHASE_ORDER` matches MASTER 64's 13 phases.
- Money uses integer minor units and rates use explicit basis points (MASTER 65).
- Seeded per-subsystem RNG streams are authoritative and their states are saved
  (MASTER 63).
- Saves are versioned, migrations are contiguous, and migrations have fixtures
  (MASTER 72).
- Content is schema-validated and addressed by stable IDs (MASTER 70-71).
- Localization, accessibility, notification control, and audio are wired presentation
  systems (MASTER 54, 57-58, 78).
- The renderer is presentation only and cannot mutate authoritative state (MASTER 55.1,
  59, 66).

## Enumerated open points

At `f9ae152`, `GameCommand` in `src/game/commands/commandEnvelope.ts` is exactly this
enumerated union: `SET_RATE`, `ORDER_SUPPLIES`, `HIRE`, `START_RENOVATION`,
`SET_SPECIALIZATION`, `EXPAND_FACILITY`, `BUY_MARKET_RESEARCH`, `ADOPT_TECHNOLOGY`,
`ASSIGN_BRAND`, `REMOVE_BRAND`, `SET_OPERATING_MODEL`, `SET_HOTEL_BUDGET`,
`SET_MANAGER_AUTHORITY`, `RESOLVE_ESCALATION`, `TRANSFER_INTERNAL_FUNDING`,
`START_DEVELOPMENT`, `COMPLETE_PRE_OPENING_TASK`, `OPEN_DEVELOPMENT`,
`RUN_DUE_DILIGENCE`, `ACQUIRE_HOTEL`, `SET_CAMPAIGN_DIFFICULTY`,
`RESOLVE_NARRATIVE_EVENT`, `TAKE_RECOVERY_MEASURE`, and
`CONTINUE_ENDLESS_CAREER`. Absent commands below are verified absences, not inferred UI
gaps.

| Issue | MASTER | Verified finding at `f9ae152` |
| ---: | --- | --- |
| #53 | 4.3 | `SandboxOptions` in `campaign/campaignConfig.ts` validates, freezes, and persists seven levers. Only `startingCapitalBasisPoints` is consumed, by `adjustedStartingCapitalMinor`; the economic-volatility, crisis-frequency, competitor-aggression, technology-speed, construction-volatility, and information-accuracy levers have no runtime reader. |
| #54 | 4.5, 22.15 | `RecoveryPath` lists eight measures, but `MODELLED_RECOVERY_PATHS` and `TAKE_RECOVERY_MEASURE` admit only `refinance`, `sell-hotel`, and `staff-reduction`. `validateRecoveryPath` refuses `capital-injection`, `asset-sale`, `emergency-credit`, `operator-conversion`, and `closure`; those five MASTER decisions are unimplemented. |
| #55 | 22.2, 22.13 | `finance/statements.ts` has no tax `AccountClass`/`ACCOUNT_CLASSES` entry or `ProfitAndLoss` line. `finance/monthlyClose.ts` reports no tax expense, liability, or payment, and no tax command exists. |
| #56 | 22.3, 22.4, 22.12 | `cashFlowStatement`, `balanceSheet`, and `recogniseReceivable` exist in `finance/statements.ts` but have zero non-test callers. `GameSimulation.closeMonth` calls only `closeMonth`; `GameState.statements` stores receivables/assets/depreciation but no produced cash-flow statement or balance sheet. |
| #57 | 22.7-22.11, 61.1 | `debtSchedule` and `isInsolvent` in `finance/debt.ts` are zero-caller rules. `GameState` holds one opening `loan`; the monthly loop only calls `accrueMonthlyInterestMinor`. There is no take-loan, repay, restructure, collateral, covenant, or credit-standing command; the narrow recovery `refinance` branch only rewrites the existing loan. |
| #58 | 24 | `GameState.insurance` exists and the monthly loop charges `totalMonthlyPremiumMinor`, but the initial policy set is empty. `takeOutPolicy` and `fileClaim` in `risk/insurance.ts` have zero non-test callers, with no buy/vary/cancel-policy or claim command. |
| #59 | 25 | `commercial/campaigns.ts`, `salesPipeline.ts`, `crm.ts`, and `loyalty.ts` define campaigns, sales contracts, consent/preferences, and redemption. Gameplay records CRM stays, earns points, and releases breakage, but has no command/call site for campaign registration, sales decisions, negotiated accounts, CRM consent/preferences, or `burnPoints`; only the passive subset is reachable. |
| #60 | 7.2-7.12 | `GameState.revenuePolicy` is initialized, but `applyRatePlan` and `automaticRate` in `revenue/revenuePolicy.ts` have zero non-test callers. Manual `SET_RATE` is the only revenue command; plans, restrictions, overbooking, automatic rules, and manager authority cannot be edited. `monthlyClose.ts` computes ADR/RevPAR but no GOPPAR. |
| #61 | 6.10-6.15, 15, 19 | `eventsales/leads.ts`, `contracts.ts`, and `negotiation.ts` model a lifecycle, but simulation directly generates a confirmed `EventRecord`. `acceptAllotment` in `distribution/channelEvolution.ts` and `signSupplierContract`/`setReorderRule` in `purchasing/contracts.ts` are zero-caller rules. `ORDER_SUPPLIES` is immediate; no corporate-account, group-block, allotment, channel-inventory, event-contract, supplier-contract, or reorder-rule command exists. |
| #62 | 18.4-18.12 | `staff/employeeLifecycle.ts` implements contracts, leave, training, promotion, resignation, and dismissal. Runtime automatically applies overtime, sickness, return, and resignation, but `HIRE` is the only player staff command; roster, contract, leave, training, promotion, and dismissal commands are absent. `staff/staffing.ts` remains the simpler flagship hire/capacity path. |
| #63 | 9.7-9.10 | `rooms/housekeeping.ts` exports only `cleanRoom`. `GameSimulation` accumulates generic minutes and cleans dirty rooms in stable room order; there is no authoritative job/order type, player priority, assignment, or separate inspection/room-release transition, and no housekeeping command. |
| #64 | 17, 27.3-27.5 | The quantum reads engineering capacity, posts preventive cost, meters utilities, and charges standing fees. The work/replacement queues in `engineering/policy.ts` and `priorities.ts` are not command-driven authoritative workflows; `applyEfficiencyInvestment` and outage creation in `utilities/consumption.ts` are unreachable. No maintenance-priority, repair/replace, utility-contract, efficiency, or outage-response command exists. |
| #65 | 38.3 | `evaluateCompliance` in `regulation/compliance.ts` derives grace/noncompliance, remediation, and monetary consequences but has zero non-test callers. `GameState` has no compliance cases, `GameSimulation` posts no fine/order/closure, and no remediation command exists. |
| #66 | 2.6, 40.1, 53, 68 | `GameState` in `simulation/initialState.ts` has singular `hotel` and `cityMarket` fields. Portfolio houses are `ManagedHotelRecord` aggregates in `company`, not independent operating states with room drilldown. This misses MASTER 40.1/53/68's per-hotel operating unit and collection state shape. |

### Existing issue pointers

Do not duplicate UI evidence here. Pair the engine rows with the existing UI issues by
pointer: **#28 over #60**, **#29 over #56**, **#30 over #62**, **#31 over #66**, and
**#34 over #59**.

Do not re-file the F&B engine shape either. MASTER 13's `runKitchenService`, `foodWaste`,
and `menuQuadrant` findings remain deferred under existing issue **#25**.

## Suggested future remediation grouping

This is an index for **future work only**; nothing in these groups is implemented here.

1. **Small/self-contained: #53, #55, #65.** Wire #53's unused sandbox inputs; add
   #55's missing tax account/statement/monthly posting; schedule and persist #65's
   compliance consequences.
2. **Command + call site + save consequence: #60, #59, #58, #64, #61, #62.** These
   are the initialized-but-inert revenue policy, partial commercial state, empty
   insurance, non-command engineering/utilities, bypassed contract/procurement/
   distribution lifecycles, and employee lifecycle documented above.
3. **Finance pass: #56 and #57.** Produce/persist statements and receivables while
   adding debt/credit/covenant decisions and solvency use, so profit, cash, assets,
   liabilities, and financing reconcile from the same postings.
4. **Dedicated state-shape decision: #66.** Give the singular-to-collections migration
   its own plan, including per-hotel tiers and bounded publication, or explicitly narrow
   the MASTER specification. Aggregate `ManagedHotelRecord`s do not close the mismatch.

#54's intentionally refused measures, #63's housekeeping model, and the #25 F&B pointer
need separately scoped decisions rather than being silently folded into those groups.

### Reusable future remediation pattern

For each wiring remediation: add a `GameCommand` variant in
`src/game/commands/commandEnvelope.ts`; add validate and apply branches in
`src/game/simulation/GameSimulation.ts`; add a versioned save migration when persisted
state is required; then prove reachability with a `ConformanceRow` in
`src/release/plans0103Conformance.ts` plus a named test assertion regenerated through
`scripts/generate-conformance-evidence.ts`. This is a proposed future pattern, not
implementation evidence.

## Verification and gate status

This ticket changes documentation only. This audit and the coverage-audit pointer are
under `docs/`, which `.prettierignore` excludes, so they do not change `npm run lint`
scope or any runtime, save, content, or protocol behavior.

`AGENTS.md` §18 nevertheless lists lint as a required gate. On the branch base,
`npm run lint` exits 1 for **21 pre-existing files**. Those files are unrelated to this
audit, remain unmodified, and are out of scope; the failure is a documented blocker for
a separate change. The docs-only ticket cannot honestly claim the full gate is green.

No-regression checks for this change:

- `npm run typecheck` — exits 0;
- `npm run test:run` — exits 0;
- `npm run lint` — exits 1 on the pre-existing blocker and is unaffected by docs;
- `git diff --check` — exits 0;
- `git status --short` — shows only the two intended documentation files before commit.
