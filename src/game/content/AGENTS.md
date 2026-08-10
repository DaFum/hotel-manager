# Validated content conventions

- Runtime systems consume schema-validated `ContentRegistry` records or compatibility adapters derived from them; do not add a second hard-coded copy of pack-owned values.
- When authoritative processing depends on declared array order, persist an explicit `simulationOrder`, validate uniqueness, and sort by it. Registry ID order is deterministic but is not gameplay order.
- Regenerate `src/content-schema/__snapshots__/schemaVersion*.json` with `npm run content:schema`; never hand-edit generated schema snapshots.
