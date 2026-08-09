# Narrative conventions

- Stories fire from simulated state and a seeded draw; never from a date, a script, or a fixed order.
- A choice returns typed effects; finance and reputation post them. Narrative code must not invent a command type or move money itself.
- Definitions and their choice effects are content in `src/game/content/1991/narrative.ts`, not conditionals here.
- Every fact, cost and delta crosses `domain/units`; ordering uses `compareIds`, never `localeCompare`.
