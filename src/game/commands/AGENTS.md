# Command conventions

- Rejections commit only audit-journal changes through `setState`; they never advance `stateVersion` or RNG streams.
