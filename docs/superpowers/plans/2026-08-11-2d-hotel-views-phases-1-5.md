# 2D Hotel Views Phases 1-5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete issues #25 and #35-#50 so every currently modelled operational problem can be reached from an alert and read as a physical situation in the isometric hotel.

**Architecture:** The Worker remains authoritative for stable entity references, generated geometry, agent locations, lift cars, and operational render descriptors. Pure modules under `src/render/` project those descriptors into camera-aware layout and LOD decisions; Pixi draws them, while React exposes equivalent localized controls and inspectors. The game is unreleased, so these descriptor additions initialize current state without advancing or migrating the save format.

**Tech Stack:** TypeScript 7, React 19, PixiJS 8, Vitest 4, Testing Library, Playwright, Zod-validated save envelopes.

## Global Constraints

- Preserve `same state + same commands + same RNG states = same result`; descriptor derivation uses stable ID ordering and no RNG.
- Authoritative render data is produced in the Worker and saved; camera state, LOD, focus, hover, and overlay visibility remain presentation-only.
- Pixi and the semantic DOM use the same stable room, facility, navigation, guest, and staff IDs.
- Money remains integer minor units and percentages remain integer basis points.
- The visible-agent selection budget in `src/render/agentMaterialization.ts` remains unchanged.
- Per the user's explicit pre-release decision, keep save version 9 and do not add migration code or frozen predecessor fixtures.
- The issue's five phases execute in order; Phase 3 begins with floor-plan generation because all later spatial work consumes it.

## Frontend Design Calibration

**Subject and job:** The player is a hotel operator at a Frankfurt operations desk in 1991. The hotel view has one job: turn an alert or capacity number into a physical cause the operator can locate and act on.

**Palette:** Reuse the established Bankenviertel tokens rather than introduce a second visual system: concrete `#0e1114`, ledger rule `#38434d`, bone paper `#e9e5db`, Deutschmark amber `#e8a33d`, lift steel `#6d9dc5`, operational green `#5cc98f`, and fault red `#e2543c`. Night rooms use amber as actual window light, not a generic warm overlay; unlit rooms recede into concrete/steel.

**Type:** Keep Anton/Arial Narrow for restrained floor and area plates, IBM Plex Sans/Segoe UI for instructions, and IBM Plex Mono/Consolas for room numbers, queue counts, routes, and lift positions. The canvas itself uses symbols and geometry; exact labels remain in the DOM so zoom never makes text illegible.

**Layout:** The hotel is an architectural section, not a tile field. Guest rooms form two wings around a ruled corridor spine; service areas read as a connected back-of-house band on the ground floor; lift and stair cores pin every floor vertically.

```text
  room wing        corridor / cores        room wing
  ◇ ◇ ◇       ════ □ lift  ▱ stair ════       ◇ ◇ ◇

  lobby / reception / restaurant  │  kitchen / stores / HK / plant
  guest-facing cutaway             │  service logistics band
```

**Signature:** The memorable element is the operational tracing overlay: enabling service areas lays a steel-blue route plate over the cutaway, while amber problem beacons and route ticks show the causal chain from queue to bottleneck. It extends the existing Leitplanke/status-rail idea into the building instead of adding decorative game art.

**Uniqueness review:** A generic management sim would use floating cards, gradients, or icon pins. This direction instead uses the repo's specific 1991 Frankfurt materials—ledger rules, dot-matrix figures, a Deutschmark-amber signal, and an architectural tracing layer. Renovation phases use changing construction notation (outline, permit stamp, hatch, inspection ticks, reopened edge), not five arbitrary colors. Motion is reserved for lift travel and followed agents; reduced-motion users receive discrete positions and textual state.

---

### Task 1: Structured alert targets and focusable world problems

**Files:**
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Modify: `src/game/persistence/saveSchema.ts`
- Modify: `src/ui/hotelViewModel.ts`
- Modify: `src/ui/hotelViewModel.test.ts`
- Modify: `src/render/camera.test.ts`

**Interfaces:**
- Produces: `AlertTargetRef = { entityId: string; kind: "room" | "facility" | "navigation" }` on spatial `AlertRecord`s.
- Produces: `renderDescriptors.positionByEntityId: Record<string, { floor: number; gridX: number; gridY: number }>` and `resolveEntityPosition(descriptors, entityId)`.
- Produces: `WorldProblem` with separate `id` (alert identity) and `entityId` (focus identity).

- [ ] Keep current save version 9; validate the new optional alert target without adding migration infrastructure.
- [ ] Write failing simulation tests proving room, facility, and navigation alerts carry honest stable targets at their push sites.
- [ ] Run the focused simulation tests and confirm the missing `target` failures.
- [ ] Add structured targets to spatial alerts. Leave genuinely non-spatial finance alerts without a world target rather than inventing a location.
- [ ] Write a failing `worldProblems()` test proving it resolves only structured targets, never matches substrings, never emits the origin fallback, and reports grid-projected coordinates.
- [ ] Replace substring matching with `resolveEntityPosition`; omit alerts whose target cannot be resolved.
- [ ] Add a camera regression proving a focused target updates the selected floor and remains visible under cutaway.
- [ ] Run the simulation, view-model, camera, and save-schema tests until green.
- [ ] Commit as `feat: add spatial alert targets`.

### Task 2: Notification-to-world navigation and semantic focus

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/ui/HotelView.tsx`
- Modify: `src/ui/HotelView.test.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.test.tsx`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/render/PixiHotelScene.test.ts`

**Interfaces:**
- Consumes: `AlertRecord.target` and `resolveEntityPosition` from Task 1.
- Produces: `HotelView.focusedEntityId?: string` and matching `data-entity-id` semantic controls.

- [ ] Write a failing pure scene test proving `camera.focusedId` yields a focus marker distinct from `${id}.selected`.
- [ ] Draw a separate focus outline/halo on the matching room tile and keep selection styling unchanged.
- [ ] Write a failing App integration test that clicks a notification action and expects: the alert panel remains expanded, camera focus uses the target entity ID/position, and the matching semantic room control receives focus.
- [ ] Map notification `actionTarget.entityId` from `alert.target.entityId`; omit the action for alerts with no spatial target.
- [ ] Replace `onAction={setOpenAlert}` with a handler that finds the source alert, resolves its position, calls `focusCamera`, opens the alert by alert ID, and requests semantic focus.
- [ ] In `HotelView`/`SemanticHotelTree`, scroll the matching room into view and focus its existing inspect button without adding a second interaction path.
- [ ] Run the App, HotelView, semantic-tree, and scene tests until green.
- [ ] Commit as `fix: connect notifications to hotel problems`.

### Task 3: Per-room lighting, building LOD, renovation phases, and occupant identity

**Files:**
- Create: `src/render/roomVisuals.ts`
- Create: `src/render/roomVisuals.test.ts`
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Modify: `src/game/simulation/GameSimulation.test.ts`
- Modify: `src/game/simulation/entityDetail.ts`
- Create: `src/game/simulation/entityDetail.test.ts`
- Modify: `src/render/sceneLayout.ts`
- Modify: `src/render/sceneLayout.test.ts`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/ui/hotelViewModel.ts`
- Modify: `src/ui/hotelViewModel.test.ts`
- Modify: `src/ui/HotelView.tsx`
- Modify: `src/ui/HotelView.test.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.test.tsx`
- Modify: `src/ui/localization.ts`
- Modify: localization tests under `src/i18n/`

**Interfaces:**
- Produces: `renderDescriptors.renovationPhaseByRoomId`, `occupantByRoomId`, and room detail `{ condition, cleanliness, occupant, rateMinor, problemCodes }`.
- Produces: pure `roomLightState(room, lighting)`, `roomVisualFor(detailTier, room)`, and renovation-phase visual mapping.

- [ ] Write failing tests for day/evening/night room lighting: occupied rooms are visibly lit at night and empty rooms remain dark, while the scene keeps a readable global tint.
- [ ] Implement pure lighting styles and apply them per room; retain the textual light status in `WorldControls`.
- [ ] Write failing LOD tests for aggregate floor/status summaries, room tiles at room zoom, and concern/agent detail at people zoom.
- [ ] Pass `detailFor(camera.zoom)` into scene layout and draw only the tier's declared primitives.
- [ ] Write failing Worker tests that map every affected renovation room to the active `Project.phase` and join stays to reservations using the booking's stable `guestId` (falling back deterministically to `guest.${bookingId}`).
- [ ] Populate `renovationPhaseByRoomId` and `occupantByRoomId` in the derived descriptor refresh without changing economic state.
- [ ] Write failing UI tests for distinct localized planning, approval, construction, acceptance, and reopening labels, plus a guest label that does not expose a booking ID.
- [ ] Replace the single construction concern with phase-specific visuals and localized phase labels.
- [ ] Extend room detail and semantic rows to show occupancy, guest label, rate, condition, cleanliness, and open problems.
- [ ] Extend `entityDetail()` to return the same occupant identity and room-detail facts as the snapshot projection.
- [ ] Run all focused render, simulation, entity-detail, localization, and UI tests until green.
- [ ] Commit as `feat: complete room presentation detail`.

### Task 4: Deterministic architectural floor plan

**Files:**
- Create: `src/game/building/floorPlan.ts`
- Create: `src/game/building/floorPlan.test.ts`
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Modify: `src/game/persistence/saveVersions.ts`
- Modify: `src/game/persistence/saveSchema.ts`
- Modify: `src/render/sceneLayout.ts`
- Modify: `src/render/sceneLayout.test.ts`
- Modify: `src/render/PixiHotelScene.ts`

**Interfaces:**
- Produces: `generateFloorPlan(roomIds): FloorPlan` containing `positionsByEntityId`, `roomPositions`, `floorSlabs`, `exteriorWalls`, `areas`, and `navigationNodes`.
- Produces: stable room, corridor, stair, elevator, desk, and area positions keyed by entity ID.

- [ ] Write failing generator tests proving identical ordered inputs yield byte-identical plans, shuffled inputs use stable ID ordering, every room has one position, floors cap at 12 rooms, and walls/slabs/cores enclose every footprint.
- [ ] Implement the minimum fixed hotel shell: ground-floor public/service areas and paired room wings around one corridor spine per guest floor.
- [ ] Write failing tests proving new higher-numbered rooms append without moving existing stable room IDs.
- [ ] Replace the index-floor placeholder with `generateFloorPlan`; regenerate the plan after a renovation adds rooms.
- [ ] Initialize generated geometry on current states without advancing the pre-release save version.
- [ ] Change `placeRooms` and `PixiHotelScene` to project supplied `{ floor, gridX, gridY }`, never room-array indices.
- [ ] Draw floor slabs and exterior walls so the world reads as a building shell.
- [ ] Run floor-plan, layout, scene, simulation, and save-policy tests until green.
- [ ] Commit as `feat: add authoritative hotel floor plan`.

### Task 5: Placed areas, navigation topology, and service overlay

**Files:**
- Modify: `src/game/building/floorPlan.ts`
- Modify: `src/game/building/floorPlan.test.ts`
- Modify: `src/render/navigationGraph.ts`
- Modify: `src/render/navigationGraph.test.ts`
- Modify: `src/render/facilities/FacilityLayer.ts`
- Modify: `src/render/facilities/FacilityLayer.test.ts`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/render/camera.ts`
- Modify: `src/render/camera.test.ts`
- Modify: `src/ui/WorldControls.tsx`
- Modify: `src/ui/WorldControls.test.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.test.tsx`
- Modify: `src/ui/localization.ts`

**Interfaces:**
- Produces: placed footprints for reception, housekeeping, breakfast restaurant, kitchen, staff area, maintenance, bar, and restaurant.
- Produces: `CameraState.showServiceAreas` plus `serviceAreaEmphasis(area, camera)`.

- [ ] Write failing plan tests for every §29 minimum area and spatially adjacent restaurant/kitchen footprints.
- [ ] Replace the world-only decorative facility strip with placed isometric footprints while retaining the existing DOM facility board.
- [ ] Write failing navigation tests for room-to-corridor, corridor-to-stairs/lift links, stable ordering, and closed-node avoidance.
- [ ] Draw corridor tiles, stair cores, elevator cores, and closed-path marks from the supplied topology and `closedNavigationIds`.
- [ ] Add the same navigation IDs and state labels to the semantic view.
- [ ] Write failing camera/UI tests for an accessible service-overlay toggle and pure guest/service emphasis.
- [ ] Add `showServiceAreas` to presentation-only camera state; de-emphasize guest footprints and highlight service corridors, kitchen, storage, housekeeping, engineering, and lifts when enabled.
- [ ] Run floor-plan, navigation, facility-layer, camera, WorldControls, semantic, and scene tests until green.
- [ ] Commit as `feat: draw hotel shell and service areas`.

### Task 6: Authoritative agent locations

**Files:**
- Create: `src/game/simulation/renderDescriptors.ts`
- Create: `src/game/simulation/renderDescriptors.test.ts`
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Modify: `src/game/persistence/saveVersions.ts`
- Modify: `src/game/persistence/saveSchema.ts`
- Modify: `src/ui/hotelViewModel.ts`
- Modify: `src/render/agentMaterialization.ts`
- Modify: `src/render/agentMaterialization.test.ts`
- Modify: `src/render/sceneLayout.ts`
- Modify: `src/render/sceneLayout.test.ts`

**Interfaces:**
- Produces: `AgentRenderDescriptor = { id, kind, identityCode, locationId, statusCode, route, queuedFor?, waitingForRoomId? }`.
- Consumes: floor-plan navigation/area IDs from Tasks 4-5.

- [ ] Write failing descriptor tests for guests at arrival/reception/room/breakfast/bar/departure activities and staff at desks, service areas, dirty-room routes, and maintenance targets.
- [ ] Derive locations and routes from authoritative time, stays, queues, rooms, rosters, and area topology using stable ID ordering and no RNG.
- [ ] Make `visualAgents()` consume Worker descriptors and apply only the existing materialization budget/LOD filter.
- [ ] Update placement to resolve any navigation/area/room `locationId` through `positionByEntityId`; unresolved agents are still omitted instead of drawn at the origin.
- [ ] Initialize agent descriptors on current states without advancing the pre-release save version.
- [ ] Recompute descriptor data in the snapshot phase and after load with `??=` backfills before derived refresh.
- [ ] Run descriptor, view-model, materialization, layout, simulation, and save-policy tests until green.
- [ ] Commit as `feat: publish authoritative hotel agents`.

### Task 7: Lift cars and person following

**Files:**
- Modify: `src/game/simulation/renderDescriptors.ts`
- Modify: `src/game/simulation/renderDescriptors.test.ts`
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/render/camera.ts`
- Modify: `src/render/camera.test.ts`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/render/PixiHotelScene.test.ts`
- Modify: `src/ui/HotelView.tsx`
- Modify: `src/ui/HotelView.test.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.test.tsx`
- Modify: `src/ui/localization.ts`

**Interfaces:**
- Produces: per-car `{ id, currentFloor, destinationFloor, direction, motion, failed, progressBasisPoints }`.
- Produces: `CameraState.followingId` and `updateFollowCamera(camera, agents, positions)`.

- [ ] Write failing lift tests for deterministic car positions, direction, progress, queue assignment, and failed cars stopped on a floor.
- [ ] Derive each car from elapsed game time, trip demand, available floors, and the existing lift asset status.
- [ ] Draw cars at their interpolated core positions; draw failed cars stopped and waiting guests around the same core.
- [ ] Write failing camera tests proving person focus starts following, room/facility focus cancels following, and follow updates preserve zoom/overlay state.
- [ ] Add agent click handlers to Pixi and matching semantic buttons; both select the same agent and focus the same camera.
- [ ] Show localized person status, current position, and ordered route in the inspector.
- [ ] Run lift, camera, scene, HotelView, and semantic tests until green.
- [ ] Commit as `feat: render lifts and follow hotel agents`.

### Task 8: Reception, housekeeping, and fault/overload situations

**Files:**
- Modify: `src/game/simulation/renderDescriptors.ts`
- Modify: `src/game/simulation/renderDescriptors.test.ts`
- Modify: `src/game/simulation/initialState.ts`
- Modify: `src/game/simulation/GameSimulation.ts`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/ui/HotelView.tsx`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/localization.ts`

**Interfaces:**
- Produces: reception desk staffing/queue descriptors, housekeeping rounds, room fault codes, and facility overload situations.

- [ ] Write failing tests that map on-duty reception staff one-to-one to stable desk IDs and expose unstaffed desks plus the real reception queue length.
- [ ] Draw manned/unmanned desks and queued guest descriptors at the placed reception area.
- [ ] Write failing housekeeping tests for dirty rooms grouped by floor, a housekeeper route to the first stable-priority dirty room, and a waiting guest linked to a not-ready room.
- [ ] Draw the round and waiting-room relationship using the authoritative agent descriptors.
- [ ] Write failing fault tests that resolve an out-of-order room to a renovation/asset/general fault code without exposing a domain sentence.
- [ ] Add localized fault reason labels to the room inspector and semantic view.
- [ ] Write failing overload tests for `queue = max(0, demand - capacity)` and preservation of the facility board's tightest-constraint cause.
- [ ] Draw overloaded footprints as full areas plus visible or aggregated queues; keep exact demand/capacity/cause in the DOM.
- [ ] Run descriptor, simulation, scene, HotelView, semantic, and localization tests until green.
- [ ] Commit as `feat: visualize hotel operating problems`.

### Task 9: Spatial F&B situations

**Files:**
- Modify: `src/game/simulation/renderDescriptors.ts`
- Modify: `src/game/simulation/renderDescriptors.test.ts`
- Modify: `src/render/PixiHotelScene.ts`
- Modify: `src/render/PixiHotelScene.test.ts`
- Modify: `src/ui/accessibility/SemanticHotelTree.tsx`
- Modify: `src/ui/localization.ts`

**Interfaces:**
- Produces: outlet descriptors with seats/tables, occupied covers, waitlisted/turned-away covers, service and kitchen throughput, kitchen cause, and host/bar queue anchor IDs.

- [ ] Write failing tests mapping `FnbOutletState` to capped visible tables/seats, exact aggregate counts, host/bar queues, and a kitchen line adjacent to the restaurant.
- [ ] Derive F&B render descriptors from existing kitchen/seating results; do not create a second capacity calculation.
- [ ] Draw free/occupied tables, host queue, kitchen line load, and bar waiters from the placed footprints.
- [ ] Add a regression where free restaurant tables coexist with an overloaded kitchen and verify both facts are simultaneously visible and named in the semantic view.
- [ ] Run F&B integration, render-descriptor, scene, and semantic tests until green.
- [ ] Commit as `feat: render spatial food and beverage service`.

### Task 10: Replay update and release verification

**Files:**
- Regenerate: `fixtures/replay/vertical-slice.json`
- Modify only if required by intentional contract changes: affected tests and documentation references.

**Interfaces:**
- Consumes: current save version 9 and all descriptor contracts.

- [ ] Run `npm run test:run` and record the exact file/test counts.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run content:validate`.
- [ ] Run `npm run benchmark:all`.
- [ ] Run `npm run stress:50y`.
- [ ] Run `npm run verify:replays`; if the authoritative descriptor additions intentionally change the hash, regenerate only with `node --import tsx scripts/record-replay-corpus.ts`, then rerun replay verification.
- [ ] Review `git diff --check`, `git status --short`, and the complete diff against issue #33 Tasks 1-5; remove only orphans created by this implementation.
- [ ] Commit the regenerated replay observation and any directly required verification adjustments as `test: record complete hotel view descriptors`.

## Self-Review

- Spec coverage: Tasks 1-2 cover #35/#36; Task 3 covers #47-#50; Tasks 4-5 cover #37-#39/#46; Tasks 6-7 cover #41-#43; Tasks 8-9 cover #25/#40/#44/#45.
- Save coverage: current-format saves validate alert targets, geometry, agents, and lifts without pre-release migration paths.
- Accessibility coverage: every Pixi entity action has the same stable-ID DOM action; light, renovation, navigation, people, faults, overload, and F&B retain text equivalents.
- Determinism coverage: generated geometry, descriptor ordering, routes, and lift movement are pure functions of saved state and stable IDs.
- Placeholder scan: no deferred implementation markers remain.
