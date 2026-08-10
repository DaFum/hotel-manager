# Content authoring

The core simulation content is a versioned JSON pack in `src/content/core/core-pack.json`. The runtime, validator, and internal editor all parse it through the same Zod schemas.

## Rules

1. Give every object a permanent, lowercase dotted or dashed stable ID. Never reuse a retired ID for another meaning.
2. Use the unit named by each field (`Minor`, `BasisPoints`, `Minutes`, `MilliUnits`, `RoomNights`, or `SquareMeters`). Money is always an integer minor unit.
3. Add references only to records in the same validated pack. Reference type mismatches, missing IDs, and technology prerequisite cycles block a build and editor export.
4. Increment `schemaVersion` only for structural schema changes. Increment `contentVersion` for additions or balancing changes.
5. Structural changes require an explicit content migration. Running saves preserve authoritative historical/balance values; a content migration updates definitions and version metadata rather than silently rewriting the campaign.
6. Preserve gameplay order with a unique `simulationOrder`; alphabetical registry order is not simulation order.
7. Regenerate the checked-in JSON Schema with `npm run content:schema` after structural schema changes.
8. Use `/tools/content-editor` for supported content families or make a reviewed JSON edit. Import and export use the canonical schema and cannot bypass validation.

## Verification

Run `npm run content:validate`. This parses every JSON pack under `src/content/core`, validates ranges and units, and resolves cross-references. The command is release-blocking.

Player save files are separate from content packs. They use a checksummed transfer envelope and are validated and migrated before the selected IndexedDB slot is atomically replaced.
