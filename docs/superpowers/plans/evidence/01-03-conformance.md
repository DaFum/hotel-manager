# Plans 01-03 conformance evidence

The authoritative registry is `src/release/plans0103Conformance.ts`, enforced by
`src/release/plans0103Conformance.test.ts`. This file is a readable projection of it;
if the two disagree, the registry wins.

A row may only read `verified` when the executable file it names exists and contains the
exact assertion title it claims. The registry test checks that on every run, so a deleted or
renamed test cannot leave a claim standing.

## Task 1

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `registry.executable`<br>The conformance registry rejects unnamed claims, glob evidence and documentation-only proof for runtime behaviour. | MASTER ch. 92, 93, 94 | `src/release/plans0103Conformance.ts` | `src/release/plans0103Conformance.test.ts`<br>_requires executable evidence with a named assertion_ | verified |
| `registry.verified.proven`<br>A row may only read verified when the file and assertion it names exist on disk. | MASTER ch. 92, 94 | `src/release/plans0103Conformance.ts` | `src/release/plans0103Conformance.test.ts`<br>_proves a verified row by the file and assertion it names_ | verified |

## Task 2

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `command.envelope.identity`<br>Every command carries a command id, the game time it was issued at, an actor and its payload. | MASTER ch. 6, 29 | `src/game/commands/commandEnvelope.ts` | `src/game/commands/commandHandler.test.ts`<br>_records the envelope identity of an accepted command_ | verified |
| `command.duplicate.rejected`<br>A command id that has already been decided is rejected as a duplicate. | MASTER ch. 29 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_rejects a duplicate command id without touching state_ | verified |
| `command.staleVersion.rejected`<br>A command carrying an expected state version older than the current one is rejected as stale. | MASTER ch. 29 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_rejects a stale expected state version_ | verified |
| `command.queue.stableOrder`<br>Queued commands are applied in the order they were accepted. | MASTER ch. 30 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_applies queued commands in acceptance order_ | verified |
| `command.rejected.byteIdentical`<br>A rejected command leaves state, RNG streams, ledger, events and the state version byte-for-byte unchanged apart from the command journal entry recording the rejection. | MASTER ch. 29, 31 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_leaves state byte-for-byte unchanged when a command is rejected_ | verified |
| `command.rollback.midFailure`<br>A multi-write command that fails midway rolls back every write it had already made. | MASTER ch. 29 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_rolls back a multi-write command that fails midway_ | verified |
| `command.stateVersion.singleIncrement`<br>An applied command commits once and increments the state version exactly once. | MASTER ch. 29 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_increments the state version exactly once per applied command_ | verified |
| `command.log.bounded`<br>Accepted and rejected results are appended to a bounded command log that travels in the save. | MASTER ch. 29, 33 | `src/game/commands/commandHandler.ts` | `src/game/commands/commandHandler.test.ts`<br>_appends accepted and rejected results to a bounded command log_ | verified |
| `command.boundary.allPlayerActions`<br>Rates, purchasing, hiring, renovation, expansion, specialization and market research all pass through the same command boundary. | MASTER ch. 6, 29 | `src/game/simulation/GameSimulation.ts` | `src/game/commands/commandHandler.test.ts`<br>_routes every player action through the same command boundary_ | verified |
| `command.requestId.notAuthoritative`<br>Protocol request ids correlate responses only and never substitute for the authoritative command id. | MASTER ch. 29, 31 | `src/game/commands/commandEnvelope.ts` | `src/game/commands/commandHandler.test.ts`<br>_keeps protocol request ids out of authoritative command identity_ | verified |

## Task 3

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `event.success.emitted`<br>A successful command emits typed events with a stable event id, game time and entity references. | MASTER ch. 6, 32 | `src/game/domain/eventBuffer.ts` | `src/game/domain/eventBuffer.test.ts`<br>_stamps every event with a stable id, game time and entities_ | planned |
| `event.causation.command`<br>Every event caused by a command carries that command's id as its cause. | MASTER ch. 32 | `src/game/domain/eventBuffer.ts` | `src/game/domain/eventBuffer.test.ts`<br>_carries the causing command id on every command-caused event_ | planned |
| `event.rejection.silent`<br>A rejected command emits no success event. | MASTER ch. 32 | `src/game/commands/commandHandler.ts` | `src/game/domain/eventBuffer.test.ts`<br>_emits no success event for a rejected command_ | planned |
| `event.order.stable`<br>Events drain in emission order and their sequence numbers never repeat. | MASTER ch. 30, 32 | `src/game/domain/eventBuffer.ts` | `src/game/domain/eventBuffer.test.ts`<br>_drains events in emission order with monotonic sequence numbers_ | planned |
| `event.coverage.transitions`<br>Bookings, stays, room and facility state, staffing, purchasing, maintenance, finance, city, research and competitor transitions all publish events. | MASTER ch. 32 | `src/game/domain/events.ts` | `src/game/domain/eventBuffer.test.ts`<br>_publishes an event for every declared simulation transition_ | planned |
| `worker.accepted.afterApply`<br>COMMAND_ACCEPTED is sent only after the command has been applied and reports the applied state version. | MASTER ch. 31 | `src/game/simulation/simulation.worker.ts` | `src/game/simulation/simulation.worker.test.ts`<br>_acknowledges a command only after it has been applied_ | planned |
| `client.listeners.disposalSafe`<br>GameClient listeners for accepted commands and domain events can be unsubscribed and stop firing after disposal. | MASTER ch. 31, 59 | `src/app/GameClient.ts` | `src/app/GameClient.test.ts`<br>_stops delivering events to unsubscribed and disposed listeners_ | planned |

## Task 4

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `protocol.version.rejected`<br>A message carrying a foreign protocol version is rejected as a fatal error. | MASTER ch. 31 | `src/game/domain/protocol.ts` | `src/game/domain/protocol.test.ts`<br>_rejects a foreign protocol version as a fatal error_ | planned |
| `protocol.delta.compact`<br>STATE_DELTA carries only changed and removed fields against a declared base version, never a whole snapshot. | MASTER ch. 31 | `src/game/domain/stateDelta.ts` | `src/game/domain/protocol.test.ts`<br>_carries only changed and removed fields in a state delta_ | planned |
| `protocol.delta.baseMismatch`<br>A delta whose base version does not match the client state is refused and a snapshot is requested instead. | MASTER ch. 31 | `src/app/GameClient.ts` | `src/app/GameClient.test.ts`<br>_requests a snapshot when a delta base version does not match_ | planned |
| `protocol.details.byId`<br>REQUEST_DETAILS answers with the requested stable entity id or a typed not-found error, never the whole snapshot. | MASTER ch. 31 | `src/game/simulation/simulation.worker.ts` | `src/game/simulation/simulation.worker.test.ts`<br>_answers entity details by stable id or a typed not-found error_ | planned |
| `protocol.perf.measured`<br>PERF_SAMPLE reports measured worker tick duration and command latency without feeding wall time into game logic. | MASTER ch. 31, 76 | `src/game/simulation/simulation.worker.ts` | `src/game/simulation/simulation.worker.test.ts`<br>_emits measured performance samples without feeding game logic_ | planned |
| `protocol.error.structured`<br>Simulation errors are structured, name a code and declare whether they are recoverable or fatal. | MASTER ch. 31 | `src/game/domain/protocol.ts` | `src/game/domain/protocol.test.ts`<br>_reports recoverable and fatal errors as structured codes_ | planned |

## Task 5

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `save.slots.multiple`<br>Several independent manual slots coexist and list in a deterministic order. | MASTER ch. 33 | `src/game/persistence/savePolicy.ts` | `src/game/persistence/savePolicy.test.ts`<br>_keeps manual slots independent and deterministically ordered_ | planned |
| `save.autosave.policy`<br>Autosaves are taken on month roll, year roll and before a major action, and only then. | MASTER ch. 33 | `src/game/persistence/savePolicy.ts` | `src/game/persistence/savePolicy.test.ts`<br>_schedules monthly, yearly and pre-major-action autosaves_ | planned |
| `save.recovery.generations`<br>At least two rotating recovery generations are retained and the oldest is dropped first. | MASTER ch. 33 | `src/game/persistence/recovery.ts` | `src/game/persistence/recovery.test.ts`<br>_rotates at least two recovery generations oldest first_ | planned |
| `save.corrupt.fallback`<br>A corrupted primary save falls back to the newest intact recovery generation rather than failing the load. | MASTER ch. 33 | `src/game/persistence/recovery.ts` | `src/game/persistence/recovery.test.ts`<br>_falls back to the newest intact generation when the primary is corrupt_ | planned |
| `save.write.atomic`<br>A failed write leaves the previously stored slot intact rather than a half-written record. | MASTER ch. 33 | `src/game/persistence/indexedDbSaveRepository.ts` | `src/game/persistence/recovery.test.ts`<br>_leaves the stored slot intact when a write fails_ | planned |
| `save.load.validated`<br>LOAD_GAME accepts a versioned envelope, runs the contiguous migration chain, validates RNG streams and numeric invariants, then replaces state atomically. | MASTER ch. 33 | `src/game/persistence/saveSchema.ts` | `src/game/simulation/simulation.worker.test.ts`<br>_validates a save envelope before replacing simulation state_ | planned |
| `save.load.invalid.noOverwrite`<br>An invalid import or load never overwrites the running game or a stored slot. | MASTER ch. 33 | `src/game/persistence/recovery.ts` | `src/game/persistence/recovery.test.ts`<br>_never overwrites a running game from an invalid load_ | planned |
| `save.migration.chain`<br>The v1, v2 and v3 fixtures migrate through the contiguous chain and round-trip calendar, money, ids, rooms, facilities, city, competitors, logs and RNG states. | MASTER ch. 33, 34 | `src/game/persistence/saveVersions.ts` | `src/game/persistence/savePolicy.test.ts`<br>_round-trips every fixture version through the migration chain_ | planned |
| `save.ui.recovery`<br>The save UI offers manual slots, names autosave and recovery entries, and surfaces validation failure as an explicit choice. | MASTER ch. 33, 59 | `src/ui/SaveManager.tsx` | `src/ui/SaveManager.test.tsx`<br>_offers manual slots, recovery entries and validation failure_ | planned |

## Task 6

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `booking.record.context`<br>A booking retains its stay dates, party, segment, source, category, rate, room count, status history and guarantee terms. | MASTER ch. 11, 12 | `src/game/bookings/bookingTypes.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_retains the full slice context of a confirmed booking_ | planned |
| `booking.inventory.allDates`<br>Multi-room, multi-night inventory is checked against every date of the stay, walk-ins included. | MASTER ch. 11 | `src/game/bookings/bookingEngine.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_checks inventory across every date of a multi-night stay_ | planned |
| `booking.release.exact`<br>Cancellation and no-show release exactly the inventory the booking was holding, no more and no less. | MASTER ch. 11 | `src/game/bookings/bookingEngine.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_releases exactly the held inventory on cancellation and no-show_ | planned |
| `booking.checkin.cleanRoom`<br>Check-in assigns a clean room of the booked category by stable id order and records the queue wait. | MASTER ch. 12, 13 | `src/game/guests/guestJourney.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_assigns a clean room of the booked category in stable order_ | planned |
| `booking.recovery.authorized`<br>Only an authorized service recovery posts money or moves satisfaction; a rejected one posts nothing. | MASTER ch. 14 | `src/game/guests/complaints.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_posts nothing for a rejected service recovery_ | planned |
| `booking.chain.causal`<br>One stay runs end to end from confirmation through check-in, complaint, recovery, checkout and ledger posting as a single causal chain. | MASTER ch. 11, 12, 14 | `src/game/simulation/GameSimulation.ts` | `src/game/bookings/bookingLifecycle.integration.test.ts`<br>_runs one stay end to end as a single causal chain_ | planned |

## Task 7

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `fnb.hours.reservations`<br>Outlets serve only inside their opening hours and seat reservations and walk-ins against the same capacity, with a waitlist when it is gone. | MASTER ch. 16, 17 | `src/game/fnb/seating.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_serves only inside opening hours and waitlists beyond capacity_ | planned |
| `fnb.board.miseEnPlace`<br>Board plans, mise-en-place preparation, allergy substitutions and waste all move the same kitchen stock and menu economics. | MASTER ch. 16 | `src/game/fnb/kitchen.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_moves board plans, mise-en-place, allergies and waste through one stock_ | planned |
| `fnb.roomService.dependencies`<br>Room service depends on kitchen capacity, service staff, transport and the lift, and names the tightest of them as its cause. | MASTER ch. 16, 20 | `src/game/fnb/roomService.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_names the tightest room-service dependency as its cause_ | planned |
| `wellness.resources`<br>Wellness consumes water, energy and linen and is limited by specialist staff and maintenance state. | MASTER ch. 18 | `src/game/wellness/reservations.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_limits wellness by specialists, utilities and maintenance state_ | planned |
| `eventsales.lifecycle`<br>A conference runs offer, negotiation, deposit, room block, execution and cancellation, and its cancellation returns the block. | MASTER ch. 19 | `src/game/eventsales/contracts.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_runs the conference lifecycle from offer to cancellation_ | planned |
| `laundry.tradeoff`<br>Laundry holds floor stock and trades internal capacity against external contract cost under the same linen pool. | MASTER ch. 20 | `src/game/laundry/laundry.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_trades internal laundry capacity against external contract cost_ | planned |
| `engineering.priorities`<br>Engineering ranks preventive, reactive and replacement work against capacity, efficiency and remaining life. | MASTER ch. 21 | `src/game/engineering/policy.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_ranks preventive, reactive and replacement work by remaining life_ | planned |
| `utilities.authoritative`<br>Utility consumption and capacity are authoritative operating state that the Plan 02 systems draw on and pay for. | MASTER ch. 22 | `src/game/facilities/utilities.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_draws authoritative utility consumption from every serviced area_ | planned |
| `depth.sharedPrimitives`<br>Every serviced area reports its load and capacity through the shared facility primitive and names its tightest constraint. | MASTER ch. 15, 16, 22 | `src/game/facilities/facilityBoard.ts` | `src/game/simulation/hotelDepthConformance.test.ts`<br>_names the tightest constraint for every serviced area_ | planned |

## Task 8

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `render.camera`<br>The camera pans, zooms within bounds and focuses a room, a problem or a person by stable id. | MASTER ch. 49, 50 | `src/render/camera.ts` | `src/render/camera.test.ts`<br>_pans, clamps zoom and focuses an entity by stable id_ | planned |
| `render.floors`<br>Floor selection and cutaway show the chosen floor and highlight service areas without hiding the selected entity. | MASTER ch. 49 | `src/render/camera.ts` | `src/render/camera.test.ts`<br>_selects a floor and cuts away the ones above it_ | planned |
| `render.navigation`<br>The navigation graph routes through doors, corridors, stairs and lifts and reroutes around a closure. | MASTER ch. 51 | `src/render/navigationGraph.ts` | `src/render/navigationGraph.test.ts`<br>_routes through doors, corridors, stairs and lifts around closures_ | planned |
| `render.elevator.queue`<br>Lift capacity, travel time, queues and failure are visualised from authoritative worker state. | MASTER ch. 51 | `src/render/agentMaterialization.ts` | `src/render/agentMaterialization.test.ts`<br>_visualises lift capacity, queue and failure from worker state_ | planned |
| `render.materialization.bounded`<br>Only a bounded visual subset of agents is materialised, deterministically, and the renderer feeds no randomness back into the simulation. | MASTER ch. 52, 76 | `src/render/agentMaterialization.ts` | `src/render/agentMaterialization.test.ts`<br>_materialises a bounded deterministic subset of agents_ | planned |
| `render.dayNight.lod`<br>Time of day drives lighting and zoom drives the level of detail. | MASTER ch. 50, 52 | `src/render/camera.ts` | `src/render/camera.test.ts`<br>_drives lighting from time of day and detail from zoom_ | planned |
| `render.domEquivalence`<br>Every Pixi selection and action has a keyboard-reachable DOM equivalent that is not labelled by colour alone. | MASTER ch. 53, 54, 59 | `src/ui/HotelView.tsx` | `src/ui/HotelView.test.tsx`<br>_offers a keyboard-reachable DOM equivalent for every scene action_ | planned |

## Task 9

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `city.economics.shared`<br>Player and competitors resolve wages, property, pricing elasticity, credit and investment return through the same primitives. | MASTER ch. 63, 64, 65 | `src/game/competitors/month.ts` | `src/game/city/plan03Conformance.test.ts`<br>_resolves player and rival economics through the same primitives_ | planned |
| `city.rival.information`<br>A rival decision reads only its strategy, its own state, lagged public observation and public city state. | MASTER ch. 66 | `src/game/competitors/strategies.ts` | `src/game/city/plan03Conformance.test.ts`<br>_reads only strategy, own state and lagged public observation_ | planned |
| `city.rival.identity`<br>Named identity, strategy, bounded relation memory, investment age, debt, cash, occupancy and lifecycle all persist. | MASTER ch. 66, 67 | `src/game/competitors/lifecycle.ts` | `src/game/city/plan03Conformance.test.ts`<br>_persists rival identity, memory, debt and lifecycle across a save_ | planned |
| `city.entry.hurdle`<br>Entry requires real capital and clears an investment hurdle rather than appearing on a timer. | MASTER ch. 67 | `src/game/competitors/lifecycle.ts` | `src/game/city/plan03Conformance.test.ts`<br>_requires real capital and a cleared hurdle before a rival enters_ | planned |
| `city.exit.freesSupply`<br>An exiting rival frees its supply and leaves without plot armour or hidden money. | MASTER ch. 67 | `src/game/competitors/lifecycle.ts` | `src/game/city/plan03Conformance.test.ts`<br>_frees supply on exit and never hides money for a rival_ | planned |
| `city.feedback.bounded`<br>Transport changes, actor growth and decline, property and labour lags and hotel-to-city feedback stay saturating, delayed, finite and stably ordered. | MASTER ch. 68, 69 | `src/game/city/feedback.ts` | `src/game/city/plan03Conformance.test.ts`<br>_keeps city feedback saturating, delayed and finitely bounded_ | planned |

## Task 10

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `decade.seeds.bounded`<br>Declared seeds covering balanced, high and weak demand, wage and property pressure and route loss all keep money integral and every rate finite. | MASTER ch. 70, 71 | `scripts/verify-plans-01-03-long-run.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_yearly money stays integral and every rate stays finitely bounded_ | planned |
| `decade.entryExit`<br>Dedicated scenarios produce at least one viable competitor entry and one economic exit over ten years. | MASTER ch. 67, 71 | `scripts/verify-plans-01-03-long-run.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_at least one viable entry and one economic exit occur_ | planned |
| `decade.hashes`<br>Repeated decade runs of one seed produce identical state and event hashes. | MASTER ch. 70 | `src/game/debug/stateHash.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_repeated runs of the same seed produce identical hashes_ | planned |
| `decade.saveRestore`<br>A run saved at year five and reloaded through the migration chain matches the uninterrupted run at year ten. | MASTER ch. 33, 70 | `scripts/verify-plans-01-03-long-run.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_a save at year five continues to an identical year ten_ | planned |
| `decade.performance.separate`<br>Elapsed time is recorded beside the deterministic result and never changes it. | MASTER ch. 76 | `scripts/benchmark-slice.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_elapsed time is reported separately from deterministic output_ | planned |
| `decade.forecast.imperfect`<br>Paid market research gives nonzero but imperfect forecast coverage over the decade. | MASTER ch. 66 | `src/game/marketResearch/forecast.ts` | `scripts/verify-plans-01-03-long-run.ts`<br>_forecast coverage is nonzero and still imperfect_ | planned |

## Task 11

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `replay.corpus.complete`<br>The corpus records versions, seed, RNG states, command envelopes, expected verdicts, ordered events, monthly checkpoints and a final state hash. | MASTER ch. 35, 70 | `fixtures/replay/plans-01-03.json` | `src/game/debug/replay.test.ts`<br>_records versions, envelopes, ordered events and a final hash_ | planned |
| `replay.throughBoundary`<br>Replay drives the real command boundary rather than mutating state directly, and reproduces the recorded hash. | MASTER ch. 29, 35 | `src/game/debug/replay.ts` | `src/game/debug/replay.test.ts`<br>_reproduces the recorded hash through the real command boundary_ | planned |
| `replay.hash.canonical`<br>The state hash canonicalises objects, maps, sets and stable ids and covers money, histories, city, competitors and RNG. | MASTER ch. 70 | `src/game/debug/stateHash.ts` | `src/game/debug/replay.test.ts`<br>_canonicalises authoritative state and ignores presentation data_ | planned |
| `replay.diagnostics`<br>A mismatch reports version, seed, game time, command id, event window, RNG draw index and a minimal state diff. | MASTER ch. 35 | `src/game/debug/replay.ts` | `src/game/debug/replay.test.ts`<br>_reports seed, command id, rng draw index and a minimal diff_ | planned |
| `replay.saveRestore`<br>The same corpus replays identically twice, from a migrated save, and across a mid-run save and load. | MASTER ch. 33, 35 | `scripts/replay-plans-01-03.ts` | `src/game/debug/replay.test.ts`<br>_replays identically twice and across a mid-run save and load_ | planned |

## Task 12

| Acceptance item | MASTER | Implementation | Evidence | Status |
| --- | --- | --- | --- | --- |
| `save.v4.migration`<br>A v3 save migrates to v4 with honest defaults for state version, command and event logs, booking lifecycle, utilities, renderer descriptors and save policy metadata. | MASTER ch. 33, 34 | `src/game/persistence/migrations/v3-to-v4.ts` | `src/game/persistence/migrations/v3-to-v4.test.ts`<br>_migrates a v3 fixture to v4 with explicit honest defaults_ | planned |
| `journey.browser`<br>The browser journey plays Frankfurt 1991 from a rate change through a stay, a complaint, a monthly close and a competitor transition to a manual save and a recovery load. | MASTER ch. 59, 60 | `e2e/plans-01-03-remediation.spec.ts` | `e2e/plans-01-03-remediation.spec.ts`<br>_plays the remediation journey and reloads from recovery_ | planned |
| `journey.truthfulAck`<br>Pending, accepted and rejected command states shown to the player are the worker's own verdicts. | MASTER ch. 31, 59 | `src/app/gameStore.ts` | `e2e/plans-01-03-remediation.spec.ts`<br>_shows the worker's own pending, accepted and rejected verdicts_ | planned |
