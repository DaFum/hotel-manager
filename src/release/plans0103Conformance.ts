/**
 * The executable conformance registry for the Plans 01-03 remediation gate.
 *
 * Its job is adversarial: it exists so a green suite cannot be mistaken for a
 * conformant one. Every acceptance item of the remediation plan owns exactly
 * one row, and a row may only claim `verified` once the named assertion in the
 * named executable file actually exists. The colocated test enforces that;
 * this file only declares the claims.
 */

export const CONFORMANCE_STATUSES = ["planned", "verified"] as const;

export type ConformanceStatus = (typeof CONFORMANCE_STATUSES)[number];

/** Where the behaviour is proven, and by which named assertion. */
export interface ConformanceEvidence {
  /** Repository-relative path to a test, spec or verification script. */
  path: string;
  /** The exact assertion title inside that file. */
  assertion: string;
}

export interface ConformanceRow {
  /** Stable acceptance-item id; never renamed once published. */
  id: string;
  /** The MASTER chapter(s) the claim is answerable to. */
  masterSection: string;
  /** The remediation task that owns the row. */
  task: number;
  /** The behaviour, stated as a fact the evidence must demonstrate. */
  claim: string;
  /** Repository-relative path of the implementation that carries the rule. */
  implementationPath: string;
  evidence: ConformanceEvidence;
  status: ConformanceStatus;
}

const ROWS: readonly ConformanceRow[] = [
  // --- Task 1: the registry itself ---------------------------------------
  {
    id: "registry.executable",
    masterSection: "MASTER ch. 92, 93, 94",
    task: 1,
    claim:
      "The conformance registry rejects unnamed claims, glob evidence and documentation-only proof for runtime behaviour.",
    implementationPath: "src/release/plans0103Conformance.ts",
    evidence: {
      path: "src/release/plans0103Conformance.test.ts",
      assertion: "requires executable evidence with a named assertion",
    },
    status: "verified",
  },
  {
    id: "registry.verified.proven",
    masterSection: "MASTER ch. 92, 94",
    task: 1,
    claim:
      "A row may only read verified when the file and assertion it names exist on disk.",
    implementationPath: "src/release/plans0103Conformance.ts",
    evidence: {
      path: "src/release/plans0103Conformance.test.ts",
      assertion: "proves a verified row by the file and assertion it names",
    },
    status: "verified",
  },

  // --- Task 2: commands ---------------------------------------------------
  {
    id: "command.envelope.identity",
    masterSection: "MASTER ch. 6, 29",
    task: 2,
    claim:
      "Every command carries a command id, the game time it was issued at, an actor and its payload.",
    implementationPath: "src/game/commands/commandEnvelope.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "records the envelope identity of an accepted command",
    },
    status: "verified",
  },
  {
    id: "command.duplicate.rejected",
    masterSection: "MASTER ch. 29",
    task: 2,
    claim:
      "A command id that has already been decided is rejected as a duplicate.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "rejects a duplicate command id without touching state",
    },
    status: "verified",
  },
  {
    id: "command.staleVersion.rejected",
    masterSection: "MASTER ch. 29",
    task: 2,
    claim:
      "A command carrying an expected state version older than the current one is rejected as stale.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "rejects a stale expected state version",
    },
    status: "verified",
  },
  {
    id: "command.queue.stableOrder",
    masterSection: "MASTER ch. 30",
    task: 2,
    claim: "Queued commands are applied in the order they were accepted.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "applies queued commands in acceptance order",
    },
    status: "verified",
  },
  {
    id: "command.rejected.byteIdentical",
    masterSection: "MASTER ch. 29, 31",
    task: 2,
    claim:
      "A rejected command leaves state, RNG streams, ledger, events and the state version byte-for-byte unchanged apart from the command journal entry recording the rejection.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion:
        "leaves state byte-for-byte unchanged when a command is rejected",
    },
    status: "verified",
  },
  {
    id: "command.rollback.midFailure",
    masterSection: "MASTER ch. 29",
    task: 2,
    claim:
      "A multi-write command that fails midway rolls back every write it had already made.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "rolls back a multi-write command that fails midway",
    },
    status: "verified",
  },
  {
    id: "command.stateVersion.singleIncrement",
    masterSection: "MASTER ch. 29",
    task: 2,
    claim:
      "An applied command commits once and increments the state version exactly once.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion:
        "increments the state version exactly once per applied command",
    },
    status: "verified",
  },
  {
    id: "command.log.bounded",
    masterSection: "MASTER ch. 29, 33",
    task: 2,
    claim:
      "Accepted and rejected results are appended to a bounded command log that travels in the save.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion:
        "appends accepted and rejected results to a bounded command log",
    },
    status: "verified",
  },
  {
    id: "command.boundary.allPlayerActions",
    masterSection: "MASTER ch. 6, 29",
    task: 2,
    claim:
      "Rates, purchasing, hiring, renovation, expansion, specialization and market research all pass through the same command boundary.",
    implementationPath: "src/game/simulation/GameSimulation.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion: "routes every player action through the same command boundary",
    },
    status: "verified",
  },
  {
    id: "command.requestId.notAuthoritative",
    masterSection: "MASTER ch. 29, 31",
    task: 2,
    claim:
      "Protocol request ids correlate responses only and never substitute for the authoritative command id.",
    implementationPath: "src/game/commands/commandEnvelope.ts",
    evidence: {
      path: "src/game/commands/commandHandler.test.ts",
      assertion:
        "keeps protocol request ids out of authoritative command identity",
    },
    status: "verified",
  },

  // --- Task 3: domain events ---------------------------------------------
  {
    id: "event.success.emitted",
    masterSection: "MASTER ch. 6, 32",
    task: 3,
    claim:
      "A successful command emits typed events with a stable event id, game time and entity references.",
    implementationPath: "src/game/domain/eventBuffer.ts",
    evidence: {
      path: "src/game/domain/eventBuffer.test.ts",
      assertion: "stamps every event with a stable id, game time and entities",
    },
    status: "verified",
  },
  {
    id: "event.causation.command",
    masterSection: "MASTER ch. 32",
    task: 3,
    claim:
      "Every event caused by a command carries that command's id as its cause.",
    implementationPath: "src/game/domain/eventBuffer.ts",
    evidence: {
      path: "src/game/domain/eventBuffer.test.ts",
      assertion: "carries the causing command id on every command-caused event",
    },
    status: "verified",
  },
  {
    id: "event.rejection.silent",
    masterSection: "MASTER ch. 32",
    task: 3,
    claim: "A rejected command emits no success event.",
    implementationPath: "src/game/commands/commandHandler.ts",
    evidence: {
      path: "src/game/domain/eventBuffer.test.ts",
      assertion: "emits no success event for a rejected command",
    },
    status: "verified",
  },
  {
    id: "event.order.stable",
    masterSection: "MASTER ch. 30, 32",
    task: 3,
    claim:
      "Events drain in emission order and their sequence numbers never repeat.",
    implementationPath: "src/game/domain/eventBuffer.ts",
    evidence: {
      path: "src/game/domain/eventBuffer.test.ts",
      assertion:
        "drains events in emission order with monotonic sequence numbers",
    },
    status: "verified",
  },
  {
    id: "event.coverage.transitions",
    masterSection: "MASTER ch. 32",
    task: 3,
    claim:
      "Bookings, stays, room and facility state, staffing, purchasing, maintenance, finance, city, research and competitor transitions all publish events.",
    implementationPath: "src/game/domain/events.ts",
    evidence: {
      path: "src/game/domain/eventBuffer.test.ts",
      assertion: "publishes an event for every declared simulation transition",
    },
    status: "verified",
  },
  {
    id: "worker.accepted.afterApply",
    masterSection: "MASTER ch. 31",
    task: 3,
    claim:
      "COMMAND_ACCEPTED is sent only after the command has been applied and reports the applied state version.",
    implementationPath: "src/game/simulation/simulation.worker.ts",
    evidence: {
      path: "src/game/simulation/simulation.worker.test.ts",
      assertion: "acknowledges a command only after it has been applied",
    },
    status: "verified",
  },
  {
    id: "client.listeners.disposalSafe",
    masterSection: "MASTER ch. 31, 59",
    task: 3,
    claim:
      "GameClient listeners for accepted commands and domain events can be unsubscribed and stop firing after disposal.",
    implementationPath: "src/app/GameClient.ts",
    evidence: {
      path: "src/app/GameClient.test.ts",
      assertion:
        "stops delivering events to unsubscribed and disposed listeners",
    },
    status: "verified",
  },

  // --- Task 4: protocol ---------------------------------------------------
  {
    id: "protocol.version.rejected",
    masterSection: "MASTER ch. 31",
    task: 4,
    claim:
      "A message carrying a foreign protocol version is rejected as a fatal error.",
    implementationPath: "src/game/domain/protocol.ts",
    evidence: {
      path: "src/game/domain/protocol.test.ts",
      assertion: "rejects a foreign protocol version as a fatal error",
    },
    status: "verified",
  },
  {
    id: "protocol.delta.compact",
    masterSection: "MASTER ch. 31",
    task: 4,
    claim:
      "STATE_DELTA carries only changed and removed fields against a declared base version, never a whole snapshot.",
    implementationPath: "src/game/domain/stateDelta.ts",
    evidence: {
      path: "src/game/domain/protocol.test.ts",
      assertion: "carries only changed and removed fields in a state delta",
    },
    status: "verified",
  },
  {
    id: "protocol.delta.baseMismatch",
    masterSection: "MASTER ch. 31",
    task: 4,
    claim:
      "A delta whose base version does not match the client state is refused and a snapshot is requested instead.",
    implementationPath: "src/app/GameClient.ts",
    evidence: {
      path: "src/app/GameClient.test.ts",
      assertion: "requests a snapshot when a delta base version does not match",
    },
    status: "verified",
  },
  {
    id: "protocol.details.byId",
    masterSection: "MASTER ch. 31",
    task: 4,
    claim:
      "REQUEST_DETAILS answers with the requested stable entity id or a typed not-found error, never the whole snapshot.",
    implementationPath: "src/game/simulation/simulation.worker.ts",
    evidence: {
      path: "src/game/simulation/simulation.worker.test.ts",
      assertion:
        "answers entity details by stable id or a typed not-found error",
    },
    status: "verified",
  },
  {
    id: "protocol.perf.measured",
    masterSection: "MASTER ch. 31, 76",
    task: 4,
    claim:
      "PERF_SAMPLE reports measured worker tick duration and command latency without feeding wall time into game logic.",
    implementationPath: "src/game/simulation/simulation.worker.ts",
    evidence: {
      path: "src/game/simulation/simulation.worker.test.ts",
      assertion:
        "emits measured performance samples without feeding game logic",
    },
    status: "verified",
  },
  {
    id: "protocol.error.structured",
    masterSection: "MASTER ch. 31",
    task: 4,
    claim:
      "Simulation errors are structured, name a code and declare whether they are recoverable or fatal.",
    implementationPath: "src/game/domain/protocol.ts",
    evidence: {
      path: "src/game/domain/protocol.test.ts",
      assertion: "reports recoverable and fatal errors as structured codes",
    },
    status: "verified",
  },

  // --- Task 5: persistence ------------------------------------------------
  {
    id: "save.slots.multiple",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "Several independent manual slots coexist and list in a deterministic order.",
    implementationPath: "src/game/persistence/savePolicy.ts",
    evidence: {
      path: "src/game/persistence/savePolicy.test.ts",
      assertion: "keeps manual slots independent and deterministically ordered",
    },
    status: "verified",
  },
  {
    id: "save.autosave.policy",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "Autosaves are taken on month roll, year roll and before a major action, and only then.",
    implementationPath: "src/game/persistence/savePolicy.ts",
    evidence: {
      path: "src/game/persistence/savePolicy.test.ts",
      assertion: "schedules monthly, yearly and pre-major-action autosaves",
    },
    status: "verified",
  },
  {
    id: "save.recovery.generations",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "At least two rotating recovery generations are retained and the oldest is dropped first.",
    implementationPath: "src/game/persistence/recovery.ts",
    evidence: {
      path: "src/game/persistence/recovery.test.ts",
      assertion: "rotates at least two recovery generations oldest first",
    },
    status: "verified",
  },
  {
    id: "save.corrupt.fallback",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "A corrupted primary save falls back to the newest intact recovery generation rather than failing the load.",
    implementationPath: "src/game/persistence/recovery.ts",
    evidence: {
      path: "src/game/persistence/recovery.test.ts",
      assertion:
        "falls back to the newest intact generation when the primary is corrupt",
    },
    status: "verified",
  },
  {
    id: "save.write.atomic",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "A failed write leaves the previously stored slot intact rather than a half-written record.",
    implementationPath: "src/game/persistence/indexedDbSaveRepository.ts",
    evidence: {
      path: "src/game/persistence/recovery.test.ts",
      assertion: "leaves the stored slot intact when a write fails",
    },
    status: "verified",
  },
  {
    id: "save.load.validated",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "LOAD_GAME accepts a versioned envelope, runs the contiguous migration chain, validates RNG streams and numeric invariants, then replaces state atomically.",
    implementationPath: "src/game/persistence/saveSchema.ts",
    evidence: {
      path: "src/game/simulation/simulation.worker.test.ts",
      assertion: "validates a save envelope before replacing simulation state",
    },
    status: "verified",
  },
  {
    id: "save.load.invalid.noOverwrite",
    masterSection: "MASTER ch. 33",
    task: 5,
    claim:
      "An invalid import or load never overwrites the running game or a stored slot.",
    implementationPath: "src/game/persistence/recovery.ts",
    evidence: {
      path: "src/game/persistence/recovery.test.ts",
      assertion: "never overwrites a running game from an invalid load",
    },
    status: "verified",
  },
  {
    id: "save.migration.chain",
    masterSection: "MASTER ch. 33, 34",
    task: 5,
    claim:
      "The v1, v2 and v3 fixtures migrate through the contiguous chain and round-trip calendar, money, ids, rooms, facilities, city, competitors, logs and RNG states.",
    implementationPath: "src/game/persistence/saveVersions.ts",
    evidence: {
      path: "src/game/persistence/savePolicy.test.ts",
      assertion:
        "round-trips every fixture version through the migration chain",
    },
    status: "verified",
  },
  {
    id: "save.ui.recovery",
    masterSection: "MASTER ch. 33, 59",
    task: 5,
    claim:
      "The save UI offers manual slots, names autosave and recovery entries, and surfaces validation failure as an explicit choice.",
    implementationPath: "src/ui/SaveManager.tsx",
    evidence: {
      path: "src/ui/SaveManager.test.tsx",
      assertion: "offers manual slots, recovery entries and validation failure",
    },
    status: "verified",
  },

  // --- Task 6: booking and guest lifecycle --------------------------------
  {
    id: "booking.record.context",
    masterSection: "MASTER ch. 11, 12",
    task: 6,
    claim:
      "A booking retains its stay dates, party, segment, source, category, rate, room count, status history and guarantee terms.",
    implementationPath: "src/game/bookings/bookingTypes.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion: "retains the full slice context of a confirmed booking",
    },
    status: "verified",
  },
  {
    id: "booking.inventory.allDates",
    masterSection: "MASTER ch. 11",
    task: 6,
    claim:
      "Multi-room, multi-night inventory is checked against every date of the stay, walk-ins included.",
    implementationPath: "src/game/bookings/bookingEngine.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion: "checks inventory across every date of a multi-night stay",
    },
    status: "verified",
  },
  {
    id: "booking.release.exact",
    masterSection: "MASTER ch. 11",
    task: 6,
    claim:
      "Cancellation and no-show release exactly the inventory the booking was holding, no more and no less.",
    implementationPath: "src/game/bookings/bookingEngine.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion:
        "releases exactly the held inventory on cancellation and no-show",
    },
    status: "verified",
  },
  {
    id: "booking.checkin.cleanRoom",
    masterSection: "MASTER ch. 12, 13",
    task: 6,
    claim:
      "Check-in assigns a clean room of the booked category by stable id order and records the queue wait.",
    implementationPath: "src/game/guests/guestJourney.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion: "assigns a clean room of the booked category in stable order",
    },
    status: "verified",
  },
  {
    id: "booking.recovery.authorized",
    masterSection: "MASTER ch. 14",
    task: 6,
    claim:
      "Only an authorized service recovery posts money or moves satisfaction; a rejected one posts nothing.",
    implementationPath: "src/game/guests/complaints.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion: "posts nothing for a rejected service recovery",
    },
    status: "verified",
  },
  {
    id: "booking.chain.causal",
    masterSection: "MASTER ch. 11, 12, 14",
    task: 6,
    claim:
      "One stay runs end to end from confirmation through check-in, complaint, recovery, checkout and ledger posting as a single causal chain.",
    implementationPath: "src/game/simulation/GameSimulation.ts",
    evidence: {
      path: "src/game/bookings/bookingLifecycle.integration.test.ts",
      assertion: "runs one stay end to end as a single causal chain",
    },
    status: "verified",
  },

  // --- Task 7: Plan 02 operating depth ------------------------------------
  {
    id: "fnb.hours.reservations",
    masterSection: "MASTER ch. 16, 17",
    task: 7,
    claim:
      "Outlets serve only inside their opening hours and seat reservations and walk-ins against the same capacity, with a waitlist when it is gone.",
    implementationPath: "src/game/fnb/seating.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "serves only inside opening hours and waitlists beyond capacity",
    },
    status: "planned",
  },
  {
    id: "fnb.board.miseEnPlace",
    masterSection: "MASTER ch. 16",
    task: 7,
    claim:
      "Board plans, mise-en-place preparation, allergy substitutions and waste all move the same kitchen stock and menu economics.",
    implementationPath: "src/game/fnb/kitchen.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "moves board plans, mise-en-place, allergies and waste through one stock",
    },
    status: "planned",
  },
  {
    id: "fnb.roomService.dependencies",
    masterSection: "MASTER ch. 16, 20",
    task: 7,
    claim:
      "Room service depends on kitchen capacity, service staff, transport and the lift, and names the tightest of them as its cause.",
    implementationPath: "src/game/fnb/roomService.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion: "names the tightest room-service dependency as its cause",
    },
    status: "planned",
  },
  {
    id: "wellness.resources",
    masterSection: "MASTER ch. 18",
    task: 7,
    claim:
      "Wellness consumes water, energy and linen and is limited by specialist staff and maintenance state.",
    implementationPath: "src/game/wellness/reservations.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "limits wellness by specialists, utilities and maintenance state",
    },
    status: "planned",
  },
  {
    id: "eventsales.lifecycle",
    masterSection: "MASTER ch. 19",
    task: 7,
    claim:
      "A conference runs offer, negotiation, deposit, room block, execution and cancellation, and its cancellation returns the block.",
    implementationPath: "src/game/eventsales/contracts.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion: "runs the conference lifecycle from offer to cancellation",
    },
    status: "planned",
  },
  {
    id: "laundry.tradeoff",
    masterSection: "MASTER ch. 20",
    task: 7,
    claim:
      "Laundry holds floor stock and trades internal capacity against external contract cost under the same linen pool.",
    implementationPath: "src/game/laundry/laundry.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "trades internal laundry capacity against external contract cost",
    },
    status: "planned",
  },
  {
    id: "engineering.priorities",
    masterSection: "MASTER ch. 21",
    task: 7,
    claim:
      "Engineering ranks preventive, reactive and replacement work against capacity, efficiency and remaining life.",
    implementationPath: "src/game/engineering/policy.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "ranks preventive, reactive and replacement work by remaining life",
    },
    status: "planned",
  },
  {
    id: "utilities.authoritative",
    masterSection: "MASTER ch. 22",
    task: 7,
    claim:
      "Utility consumption and capacity are authoritative operating state that the Plan 02 systems draw on and pay for.",
    implementationPath: "src/game/facilities/utilities.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion:
        "draws authoritative utility consumption from every serviced area",
    },
    status: "planned",
  },
  {
    id: "depth.sharedPrimitives",
    masterSection: "MASTER ch. 15, 16, 22",
    task: 7,
    claim:
      "Every serviced area reports its load and capacity through the shared facility primitive and names its tightest constraint.",
    implementationPath: "src/game/facilities/facilityBoard.ts",
    evidence: {
      path: "src/game/simulation/hotelDepthConformance.test.ts",
      assertion: "names the tightest constraint for every serviced area",
    },
    status: "planned",
  },

  // --- Task 8: the isometric operational view -----------------------------
  {
    id: "render.camera",
    masterSection: "MASTER ch. 49, 50",
    task: 8,
    claim:
      "The camera pans, zooms within bounds and focuses a room, a problem or a person by stable id.",
    implementationPath: "src/render/camera.ts",
    evidence: {
      path: "src/render/camera.test.ts",
      assertion: "pans, clamps zoom and focuses an entity by stable id",
    },
    status: "planned",
  },
  {
    id: "render.floors",
    masterSection: "MASTER ch. 49",
    task: 8,
    claim:
      "Floor selection and cutaway show the chosen floor and highlight service areas without hiding the selected entity.",
    implementationPath: "src/render/camera.ts",
    evidence: {
      path: "src/render/camera.test.ts",
      assertion: "selects a floor and cuts away the ones above it",
    },
    status: "planned",
  },
  {
    id: "render.navigation",
    masterSection: "MASTER ch. 51",
    task: 8,
    claim:
      "The navigation graph routes through doors, corridors, stairs and lifts and reroutes around a closure.",
    implementationPath: "src/render/navigationGraph.ts",
    evidence: {
      path: "src/render/navigationGraph.test.ts",
      assertion:
        "routes through doors, corridors, stairs and lifts around closures",
    },
    status: "planned",
  },
  {
    id: "render.elevator.queue",
    masterSection: "MASTER ch. 51",
    task: 8,
    claim:
      "Lift capacity, travel time, queues and failure are visualised from authoritative worker state.",
    implementationPath: "src/render/agentMaterialization.ts",
    evidence: {
      path: "src/render/agentMaterialization.test.ts",
      assertion:
        "visualises lift capacity, queue and failure from worker state",
    },
    status: "planned",
  },
  {
    id: "render.materialization.bounded",
    masterSection: "MASTER ch. 52, 76",
    task: 8,
    claim:
      "Only a bounded visual subset of agents is materialised, deterministically, and the renderer feeds no randomness back into the simulation.",
    implementationPath: "src/render/agentMaterialization.ts",
    evidence: {
      path: "src/render/agentMaterialization.test.ts",
      assertion: "materialises a bounded deterministic subset of agents",
    },
    status: "planned",
  },
  {
    id: "render.dayNight.lod",
    masterSection: "MASTER ch. 50, 52",
    task: 8,
    claim: "Time of day drives lighting and zoom drives the level of detail.",
    implementationPath: "src/render/camera.ts",
    evidence: {
      path: "src/render/camera.test.ts",
      assertion: "drives lighting from time of day and detail from zoom",
    },
    status: "planned",
  },
  {
    id: "render.domEquivalence",
    masterSection: "MASTER ch. 53, 54, 59",
    task: 8,
    claim:
      "Every Pixi selection and action has a keyboard-reachable DOM equivalent that is not labelled by colour alone.",
    implementationPath: "src/ui/HotelView.tsx",
    evidence: {
      path: "src/ui/HotelView.test.tsx",
      assertion:
        "offers a keyboard-reachable DOM equivalent for every scene action",
    },
    status: "planned",
  },

  // --- Task 9: fair city economics ----------------------------------------
  {
    id: "city.economics.shared",
    masterSection: "MASTER ch. 63, 64, 65",
    task: 9,
    claim:
      "Player and competitors resolve wages, property, pricing elasticity, credit and investment return through the same primitives.",
    implementationPath: "src/game/competitors/month.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion:
        "resolves player and rival economics through the same primitives",
    },
    status: "planned",
  },
  {
    id: "city.rival.information",
    masterSection: "MASTER ch. 66",
    task: 9,
    claim:
      "A rival decision reads only its strategy, its own state, lagged public observation and public city state.",
    implementationPath: "src/game/competitors/strategies.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion: "reads only strategy, own state and lagged public observation",
    },
    status: "planned",
  },
  {
    id: "city.rival.identity",
    masterSection: "MASTER ch. 66, 67",
    task: 9,
    claim:
      "Named identity, strategy, bounded relation memory, investment age, debt, cash, occupancy and lifecycle all persist.",
    implementationPath: "src/game/competitors/lifecycle.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion:
        "persists rival identity, memory, debt and lifecycle across a save",
    },
    status: "planned",
  },
  {
    id: "city.entry.hurdle",
    masterSection: "MASTER ch. 67",
    task: 9,
    claim:
      "Entry requires real capital and clears an investment hurdle rather than appearing on a timer.",
    implementationPath: "src/game/competitors/lifecycle.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion:
        "requires real capital and a cleared hurdle before a rival enters",
    },
    status: "planned",
  },
  {
    id: "city.exit.freesSupply",
    masterSection: "MASTER ch. 67",
    task: 9,
    claim:
      "An exiting rival frees its supply and leaves without plot armour or hidden money.",
    implementationPath: "src/game/competitors/lifecycle.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion: "frees supply on exit and never hides money for a rival",
    },
    status: "planned",
  },
  {
    id: "city.feedback.bounded",
    masterSection: "MASTER ch. 68, 69",
    task: 9,
    claim:
      "Transport changes, actor growth and decline, property and labour lags and hotel-to-city feedback stay saturating, delayed, finite and stably ordered.",
    implementationPath: "src/game/city/feedback.ts",
    evidence: {
      path: "src/game/city/plan03Conformance.test.ts",
      assertion: "keeps city feedback saturating, delayed and finitely bounded",
    },
    status: "planned",
  },

  // --- Task 10: the decade gate -------------------------------------------
  {
    id: "decade.seeds.bounded",
    masterSection: "MASTER ch. 70, 71",
    task: 10,
    claim:
      "Declared seeds covering balanced, high and weak demand, wage and property pressure and route loss all keep money integral and every rate finite.",
    implementationPath: "scripts/verify-plans-01-03-long-run.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion:
        "yearly money stays integral and every rate stays finitely bounded",
    },
    status: "planned",
  },
  {
    id: "decade.entryExit",
    masterSection: "MASTER ch. 67, 71",
    task: 10,
    claim:
      "Dedicated scenarios produce at least one viable competitor entry and one economic exit over ten years.",
    implementationPath: "scripts/verify-plans-01-03-long-run.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion: "at least one viable entry and one economic exit occur",
    },
    status: "planned",
  },
  {
    id: "decade.hashes",
    masterSection: "MASTER ch. 70",
    task: 10,
    claim:
      "Repeated decade runs of one seed produce identical state and event hashes.",
    implementationPath: "src/game/debug/stateHash.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion: "repeated runs of the same seed produce identical hashes",
    },
    status: "planned",
  },
  {
    id: "decade.saveRestore",
    masterSection: "MASTER ch. 33, 70",
    task: 10,
    claim:
      "A run saved at year five and reloaded through the migration chain matches the uninterrupted run at year ten.",
    implementationPath: "scripts/verify-plans-01-03-long-run.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion: "a save at year five continues to an identical year ten",
    },
    status: "planned",
  },
  {
    id: "decade.performance.separate",
    masterSection: "MASTER ch. 76",
    task: 10,
    claim:
      "Elapsed time is recorded beside the deterministic result and never changes it.",
    implementationPath: "scripts/benchmark-slice.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion:
        "elapsed time is reported separately from deterministic output",
    },
    status: "planned",
  },
  {
    id: "decade.forecast.imperfect",
    masterSection: "MASTER ch. 66",
    task: 10,
    claim:
      "Paid market research gives nonzero but imperfect forecast coverage over the decade.",
    implementationPath: "src/game/marketResearch/forecast.ts",
    evidence: {
      path: "scripts/verify-plans-01-03-long-run.ts",
      assertion: "forecast coverage is nonzero and still imperfect",
    },
    status: "planned",
  },

  // --- Task 11: replay ----------------------------------------------------
  {
    id: "replay.corpus.complete",
    masterSection: "MASTER ch. 35, 70",
    task: 11,
    claim:
      "The corpus records versions, seed, RNG states, command envelopes, expected verdicts, ordered events, monthly checkpoints and a final state hash.",
    implementationPath: "fixtures/replay/plans-01-03.json",
    evidence: {
      path: "src/game/debug/replay.test.ts",
      assertion: "records versions, envelopes, ordered events and a final hash",
    },
    status: "planned",
  },
  {
    id: "replay.throughBoundary",
    masterSection: "MASTER ch. 29, 35",
    task: 11,
    claim:
      "Replay drives the real command boundary rather than mutating state directly, and reproduces the recorded hash.",
    implementationPath: "src/game/debug/replay.ts",
    evidence: {
      path: "src/game/debug/replay.test.ts",
      assertion:
        "reproduces the recorded hash through the real command boundary",
    },
    status: "planned",
  },
  {
    id: "replay.hash.canonical",
    masterSection: "MASTER ch. 70",
    task: 11,
    claim:
      "The state hash canonicalises objects, maps, sets and stable ids and covers money, histories, city, competitors and RNG.",
    implementationPath: "src/game/debug/stateHash.ts",
    evidence: {
      path: "src/game/debug/replay.test.ts",
      assertion:
        "canonicalises authoritative state and ignores presentation data",
    },
    status: "planned",
  },
  {
    id: "replay.diagnostics",
    masterSection: "MASTER ch. 35",
    task: 11,
    claim:
      "A mismatch reports version, seed, game time, command id, event window, RNG draw index and a minimal state diff.",
    implementationPath: "src/game/debug/replay.ts",
    evidence: {
      path: "src/game/debug/replay.test.ts",
      assertion: "reports seed, command id, rng draw index and a minimal diff",
    },
    status: "planned",
  },
  {
    id: "replay.saveRestore",
    masterSection: "MASTER ch. 33, 35",
    task: 11,
    claim:
      "The same corpus replays identically twice, from a migrated save, and across a mid-run save and load.",
    implementationPath: "scripts/replay-plans-01-03.ts",
    evidence: {
      path: "src/game/debug/replay.test.ts",
      assertion: "replays identically twice and across a mid-run save and load",
    },
    status: "planned",
  },

  // --- Task 12: integration ------------------------------------------------
  {
    id: "save.v4.migration",
    masterSection: "MASTER ch. 33, 34",
    task: 12,
    claim:
      "A v3 save migrates to v4 with honest defaults for state version, command and event logs, booking lifecycle, utilities, renderer descriptors and save policy metadata.",
    implementationPath: "src/game/persistence/migrations/v3-to-v4.ts",
    evidence: {
      path: "src/game/persistence/migrations/v3-to-v4.test.ts",
      assertion: "migrates a v3 fixture to v4 with explicit honest defaults",
    },
    status: "planned",
  },
  {
    id: "journey.browser",
    masterSection: "MASTER ch. 59, 60",
    task: 12,
    claim:
      "The browser journey plays Frankfurt 1991 from a rate change through a stay, a complaint, a monthly close and a competitor transition to a manual save and a recovery load.",
    implementationPath: "e2e/plans-01-03-remediation.spec.ts",
    evidence: {
      path: "e2e/plans-01-03-remediation.spec.ts",
      assertion: "plays the remediation journey and reloads from recovery",
    },
    status: "planned",
  },
  {
    id: "journey.truthfulAck",
    masterSection: "MASTER ch. 31, 59",
    task: 12,
    claim:
      "Pending, accepted and rejected command states shown to the player are the worker's own verdicts.",
    implementationPath: "src/app/gameStore.ts",
    evidence: {
      path: "e2e/plans-01-03-remediation.spec.ts",
      assertion:
        "shows the worker's own pending, accepted and rejected verdicts",
    },
    status: "planned",
  },
];

export const PLANS_01_03_CONFORMANCE = ROWS;

/**
 * The acceptance items the remediation plan is answerable for, written out
 * rather than derived from the rows: the point of the list is to fail when a
 * row is quietly dropped, so it cannot be generated from the rows themselves.
 */
export const REQUIRED_ACCEPTANCE_IDS: readonly string[] = [
  "registry.executable",
  "registry.verified.proven",
  "command.envelope.identity",
  "command.duplicate.rejected",
  "command.staleVersion.rejected",
  "command.queue.stableOrder",
  "command.rejected.byteIdentical",
  "command.rollback.midFailure",
  "command.stateVersion.singleIncrement",
  "command.log.bounded",
  "command.boundary.allPlayerActions",
  "command.requestId.notAuthoritative",
  "event.success.emitted",
  "event.causation.command",
  "event.rejection.silent",
  "event.order.stable",
  "event.coverage.transitions",
  "worker.accepted.afterApply",
  "client.listeners.disposalSafe",
  "protocol.version.rejected",
  "protocol.delta.compact",
  "protocol.delta.baseMismatch",
  "protocol.details.byId",
  "protocol.perf.measured",
  "protocol.error.structured",
  "save.slots.multiple",
  "save.autosave.policy",
  "save.recovery.generations",
  "save.corrupt.fallback",
  "save.write.atomic",
  "save.load.validated",
  "save.load.invalid.noOverwrite",
  "save.migration.chain",
  "save.ui.recovery",
  "booking.record.context",
  "booking.inventory.allDates",
  "booking.release.exact",
  "booking.checkin.cleanRoom",
  "booking.recovery.authorized",
  "booking.chain.causal",
  "fnb.hours.reservations",
  "fnb.board.miseEnPlace",
  "fnb.roomService.dependencies",
  "wellness.resources",
  "eventsales.lifecycle",
  "laundry.tradeoff",
  "engineering.priorities",
  "utilities.authoritative",
  "depth.sharedPrimitives",
  "render.camera",
  "render.floors",
  "render.navigation",
  "render.elevator.queue",
  "render.materialization.bounded",
  "render.dayNight.lod",
  "render.domEquivalence",
  "city.economics.shared",
  "city.rival.information",
  "city.rival.identity",
  "city.entry.hurdle",
  "city.exit.freesSupply",
  "city.feedback.bounded",
  "decade.seeds.bounded",
  "decade.entryExit",
  "decade.hashes",
  "decade.saveRestore",
  "decade.performance.separate",
  "decade.forecast.imperfect",
  "replay.corpus.complete",
  "replay.throughBoundary",
  "replay.hash.canonical",
  "replay.diagnostics",
  "replay.saveRestore",
  "save.v4.migration",
  "journey.browser",
  "journey.truthfulAck",
];

export function conformanceRow(id: string): ConformanceRow {
  const row = ROWS.find((r) => r.id === id);
  if (!row) throw new Error(`unknown conformance row: ${id}`);
  return row;
}

/** Every row that has not yet earned its evidence; the gate must find none. */
export function unverifiedRows(): readonly ConformanceRow[] {
  return ROWS.filter((r) => r.status !== "verified");
}
