# Persistence conventions

- A migration stamps literal historical target versions; never couple it to current-build version constants.
- Recovery rotation is a serialized read-modify-write operation per store.
- Slot listings tolerate foreign IDs, while direct slot description remains strict.
