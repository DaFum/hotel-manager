# Game-domain conventions

- Validate persisted and externally supplied numeric state before arithmetic; authoritative counts and money must remain safe integers.
- Shared deterministic curves belong in `domain/` and must avoid transcendental functions so replay results do not depend on platform math implementations.
- Migration steps stamp their own literal target versions; never import the current-build version as a migration target.
