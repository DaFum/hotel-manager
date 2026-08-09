# Renderer conventions

- Camera, pathfinding, LOD, and agent materialization are deterministic projections of snapshots; they must not own hotel rules or consume simulation RNG.
- Every Pixi target uses the same stable entity ID exposed by the semantic DOM control.
