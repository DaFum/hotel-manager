# Persistence conventions

- Before the first public release, accept only the current save format and reject older development saves.
- After the first public release, migration steps stamp literal historical target versions; never couple them to current-build version constants.
- Recovery rotation is a serialized read-modify-write operation per store.
- Slot listings tolerate foreign IDs, while direct slot description remains strict.
